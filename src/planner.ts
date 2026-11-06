import type { GLPK, LP } from "glpk.js/node";
import type { GLPK as BrowserGLPK } from "glpk.js";
import {
  FULL,
  ranges,
  validateSettings,
  type Plan,
  type Settings,
} from "./domain";

export async function createPlan(
  settings: Settings,
  glpk: GLPK | BrowserGLPK,
): Promise<Plan> {
  const errors = validateSettings(settings);
  if (errors.length) throw new Error(errors[0]);
  const players = settings.players.filter(
    (player) => player.id !== settings.keeperId,
  );
  for (let index = players.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [players[index], players[swapIndex]] = [players[swapIndex], players[index]];
  }
  const slots = ranges(settings.interval);
  const selected: string[][] = [];
  if (players.length === 5 || slots.length === 1) {
    for (const slot of slots) {
      void slot;
      selected.push(players.slice(0, 5).map((player) => player.id));
    }
  } else {
    const unit = slots.reduce(
      (divisor, slot) => gcd(divisor, slot.end - slot.start),
      FULL,
    );
    const minimumGap = lowerBound(
      slots.map((slot) => (slot.end - slot.start) / unit),
      players.length,
    );
    const model: LP = {
      name: "minutos-iguales",
      objective: {
        direction: glpk.GLP_MIN,
        name: "diferencia",
        vars: [
          { name: "highest", coef: 1 },
          { name: "lowest", coef: -1 },
        ],
      },
      subjectTo: [
        {
          name: "knownBound",
          vars: [
            { name: "highest", coef: 1 },
            { name: "lowest", coef: -1 },
          ],
          bnds: { type: glpk.GLP_LO, lb: minimumGap, ub: 0 },
        },
      ],
      binaries: [],
      bounds: [
        { name: "highest", type: glpk.GLP_DB, lb: 0, ub: FULL / unit },
        { name: "lowest", type: glpk.GLP_DB, lb: 0, ub: FULL / unit },
      ],
    };
    const presence = (player: number, slot: number) => `p${player}s${slot}`;
    for (let slot = 0; slot < slots.length; slot++) {
      const field = players.map((_, player) => ({
        name: presence(player, slot),
        coef: 1,
      }));
      model.binaries!.push(...field.map((variable) => variable.name));
      model.subjectTo.push({
        name: `five${slot}`,
        vars: field,
        bnds: { type: glpk.GLP_FX, lb: 5, ub: 5 },
      });
      if (slot === 0) {
        for (let player = 0; player < players.length; player++)
          model.subjectTo.push({
            name: `initial${player}`,
            vars: [{ name: presence(player, 0), coef: 1 }],
            bnds: {
              type: glpk.GLP_FX,
              lb: player < 5 ? 1 : 0,
              ub: player < 5 ? 1 : 0,
            },
          });
      } else {
        const overlaps = [];
        for (let player = 0; player < players.length; player++) {
          const overlap = `o${player}s${slot}`;
          model.binaries!.push(overlap);
          overlaps.push({ name: overlap, coef: 1 });
          for (const previous of [slot - 1, slot])
            model.subjectTo.push({
              name: `${overlap}le${previous}`,
              vars: [
                { name: overlap, coef: 1 },
                { name: presence(player, previous), coef: -1 },
              ],
              bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
            });
          model.subjectTo.push({
            name: `${overlap}ge`,
            vars: [
              { name: overlap, coef: 1 },
              { name: presence(player, slot - 1), coef: -1 },
              { name: presence(player, slot), coef: -1 },
            ],
            bnds: { type: glpk.GLP_LO, lb: -1, ub: 0 },
          });
        }
        model.subjectTo.push({
          name: `swap${slot}`,
          vars: overlaps,
          bnds: {
            type: glpk.GLP_FX,
            lb: 5 - settings.swaps,
            ub: 5 - settings.swaps,
          },
        });
      }
    }
    for (let player = 0; player < players.length; player++) {
      const total = slots.map((slot, index) => ({
        name: presence(player, index),
        coef: (slot.end - slot.start) / unit,
      }));
      model.subjectTo.push({
        name: `max${player}`,
        vars: [...total, { name: "highest", coef: -1 }],
        bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
      });
      model.subjectTo.push({
        name: `min${player}`,
        vars: [...total, { name: "lowest", coef: -1 }],
        bnds: { type: glpk.GLP_LO, lb: 0, ub: 0 },
      });
      if (player > 0 && player !== 5) {
        model.subjectTo.push({
          name: `symmetry${player}`,
          vars: [
            ...total,
            ...slots.map((slot, index) => ({
              name: presence(player - 1, index),
              coef: -(slot.end - slot.start) / unit,
            })),
          ],
          bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
        });
      }
    }
    const solved = await glpk.solve(model, {
      msglev: glpk.GLP_MSG_OFF,
      presol: true,
      tmlim: 25,
      mipgap: 0,
    });
    if (solved.result.status !== glpk.GLP_OPT)
      throw new Error(
        "No se pudo demostrar el mejor reparto en 25 segundos. Prueba otro intervalo o numero de cambios y vuelve a calcular.",
      );
    for (let slot = 0; slot < slots.length; slot++)
      selected.push(
        players
          .filter(
            (_, player) => solved.result.vars[presence(player, slot)] > 0.5,
          )
          .map((player) => player.id),
      );
  }
  const positionSeconds = Object.fromEntries(
    players.map((player) => [player.id, [0, 0, 0, 0, 0]]),
  );
  const totals = Object.fromEntries(
    settings.players.map((player) => [player.id, 0]),
  );
  const segments = slots.map((slot, index) => {
    const permutations = permute(selected[index]);
    let best = permutations[0];
    let bestScore = Infinity;
    for (const candidate of permutations) {
      const score = candidate.reduce(
        (sum, id, position) => sum + positionSeconds[id][position],
        0,
      );
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    for (let position = 0; position < best.length; position++) {
      positionSeconds[best[position]][position] += slot.end - slot.start;
      totals[best[position]] += slot.end - slot.start;
    }
    return { ...slot, field: best };
  });
  totals[settings.keeperId] = FULL;
  const fieldTotals = players.map((player) => totals[player.id]);
  return {
    segments,
    totals,
    gap: Math.max(...fieldTotals) - Math.min(...fieldTotals),
  };
}
function permute(items: string[]): string[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) =>
    permute(items.filter((_, other) => other !== index)).map((rest) => [
      item,
      ...rest,
    ]),
  );
}
function gcd(first: number, second: number): number {
  return second === 0 ? first : gcd(second, first % second);
}
function lowerBound(durations: number[], count: number): number {
  let possible = 1n;
  for (const duration of durations) possible |= possible << BigInt(duration);
  const maximum = durations.reduce((sum, duration) => sum + duration, 0);
  const total = maximum * 5;
  const values = Array.from(
    { length: maximum + 1 },
    (_, value) => value,
  ).filter((value) => (possible & (1n << BigInt(value))) !== 0n);
  if (values.length > 100) return total % count === 0 ? 0 : 1;
  const mask = (1n << BigInt(total + 1)) - 1n;
  const feasible = (gap: number) => {
    for (const low of values) {
      if (low * count > total) break;
      const window = values.filter(
        (value) => value >= low && value <= low + gap,
      );
      if (window.at(-1)! * count < total) continue;
      let sums = 1n;
      for (let player = 0; player < count; player++) {
        let next = 0n;
        for (const value of window) next |= sums << BigInt(value);
        sums = next & mask;
      }
      if ((sums & (1n << BigInt(total))) !== 0n) return true;
    }
    return false;
  };
  let low = 0;
  let high = maximum;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (feasible(middle)) high = middle;
    else low = middle + 1;
  }
  return low;
}
