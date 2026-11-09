import { afterEach, describe, expect, it, beforeAll, vi } from "vitest";
import GLPK, { type GLPK as Solver } from "glpk.js/node";
import {
  emptyClock,
  FULL,
  HALF,
  intervalParts,
  matchState,
  minutesSoFar,
  ranges,
  segmentAt,
  validateSettings,
  type Settings,
} from "./domain";
import { createPlan } from "./planner";

let solver: Solver;
beforeAll(async () => {
  solver = await GLPK();
});
export function settings(count = 10, interval = 5, swaps = 2): Settings {
  return {
    players: Array.from({ length: count }, (_, index) => ({
      id: `kid-${index}`,
      nickname: `Peque ${index}`,
      number: String(index + 1),
    })),
    keeperId: "kid-0",
    formation: "2-2-1",
    interval,
    swaps: count === 6 ? 0 : swaps,
  };
}
describe("game rules", () => {
  it("converts saved decimal-minute intervals to explicit minutes and seconds", () => {
    expect(intervalParts(6.25)).toEqual({ minutes: 6, seconds: 15 });
    expect(intervalParts(6.15)).toEqual({ minutes: 6, seconds: 9 });
    expect(intervalParts(59 / 60)).toEqual({ minutes: 0, seconds: 59 });
    expect(intervalParts(60)).toEqual({ minutes: 60, seconds: 0 });
    expect(intervalParts(0)).toEqual({ minutes: 0, seconds: 0 });
  });
  it.each([4.1, 8.2, 6.25, 61 / 60, 59 / 60])(
    "accepts whole-second intervals despite floating-point rounding: %s minutes",
    (interval) => {
      expect(validateSettings({ ...settings(), interval })).toEqual([]);
      expect(ranges(interval)[0].end).toBe(Math.round(interval * 60));
    },
  );
  it.each([0, -1, 0.001, 6.251, Infinity, NaN])(
    "rejects zero, invalid, and fractional-second intervals: %s",
    (interval) => {
      expect(validateSettings({ ...settings(), interval })).not.toEqual([]);
    },
  );
  it("requires a valid squad, fixed keeper and feasible exact swap count", () => {
    expect(validateSettings(settings(5))).not.toHaveLength(0);
    expect(validateSettings({ ...settings(), keeperId: "" })).not.toHaveLength(
      0,
    );
    expect(validateSettings(settings(7, 5, 2))).not.toHaveLength(0);
    expect(validateSettings(settings(10, 5, 2))).toEqual([]);
    expect(validateSettings(settings(6))).toEqual([]);
    expect(validateSettings({ ...settings(), interval: 0 })).not.toHaveLength(
      0,
    );
  });
  it("carries intervals across halves and never creates a full-time swap", () => {
    expect(ranges(10).map((segment) => segment.start)).toEqual([
      0, 600, 1200, 1800, 2400,
    ]);
    expect(ranges(7).at(-1)).toEqual({ start: 2940, end: 3000 });
    expect(ranges(50)).toEqual([{ start: 0, end: FULL }]);
  });
  it("requires manual half starts and clamps interrupted halves", () => {
    expect(matchState(emptyClock(), 1_000_000).phase).toBe("setup");
    const clock = { firstStartedAt: 0, secondStartedAt: null };
    expect(matchState(clock, HALF * 1000).phase).toBe("halftime");
    expect(matchState(clock, 20_000_000).elapsed).toBe(HALF);
    expect(
      matchState({ ...clock, secondStartedAt: 2_000_000 }, 10_000_000),
    ).toMatchObject({ phase: "finished", elapsed: FULL });
  });
});
describe("optimal rotation planner", () => {
  afterEach(() => vi.restoreAllMocks());

  it("randomizes starting and finishing lineups on each calculation without changing fairness or the roster", async () => {
    const config = settings();
    const original = structuredClone(config);
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const first = await createPlan(config, solver);
    random.mockReturnValue(0);
    const second = await createPlan(config, solver);

    expect(new Set(first.segments[0].field)).not.toEqual(
      new Set(second.segments[0].field),
    );
    expect(new Set(first.segments.at(-1)!.field)).not.toEqual(
      new Set(second.segments.at(-1)!.field),
    );
    expect(first.gap).toBe(second.gap);
    expect(first.totals[config.keeperId]).toBe(FULL);
    expect(second.totals[config.keeperId]).toBe(FULL);
    expect(config).toEqual(original);
    for (const plan of [first, second]) {
      for (const [index, segment] of plan.segments.entries()) {
        expect(new Set(segment.field).size).toBe(5);
        expect(segment.field).not.toContain(config.keeperId);
        if (index > 0)
          expect(
            segment.field.filter(
              (id) => !plan.segments[index - 1].field.includes(id),
            ),
          ).toHaveLength(config.swaps);
      }
    }
  }, 15_000);

  it("randomizes the starting five even when the interval produces no substitutions", async () => {
    const config = settings(10, 60, 2);
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const first = await createPlan(config, solver);
    random.mockReturnValue(0);
    const second = await createPlan(config, solver);

    expect(first.segments).toHaveLength(1);
    expect(second.segments).toHaveLength(1);
    expect(new Set(first.segments[0].field)).not.toEqual(
      new Set(second.segments[0].field),
    );
    expect(first.gap).toBe(second.gap);
  });

  it.each([
    [6, 5, 0],
    [7, 10, 1],
    [8, 10, 2],
    [9, 10, 3],
    [10, 5, 2],
    [12, 10, 5],
    [10, 7, 3],
    [10, 60, 2],
  ])(
    "preserves lineup and totals for %i children, %i-minute intervals, %i swaps",
    async (count, interval, swaps) => {
      const config = settings(count, interval, swaps);
      const plan = await createPlan(config, solver);
      for (const [index, segment] of plan.segments.entries()) {
        expect(new Set(segment.field).size).toBe(5);
        expect(segment.field).not.toContain(config.keeperId);
        if (index > 0)
          expect(
            segment.field.filter(
              (id) => !plan.segments[index - 1].field.includes(id),
            ),
          ).toHaveLength(swaps);
        if (index > 0) {
          const previous = plan.segments[index - 1].field;
          for (const [position, id] of segment.field.entries()) {
            if (previous.includes(id)) expect(previous[position]).toBe(id);
          }
        }
      }
      expect(
        Object.values(plan.totals).reduce((sum, value) => sum + value, 0),
      ).toBe(FULL * 6);
      expect(plan.totals[config.keeperId]).toBe(FULL);
      expect(minutesSoFar(config, plan, FULL)).toEqual(plan.totals);
    },
    35_000,
  );
  it("achieves exactly equal field minutes where feasible", async () => {
    expect((await createPlan(settings(11, 5, 5), solver)).gap).toBe(0);
  });
  it("does not immediately bench the player who just came on when one substitute is available", async () => {
    const config = settings(7, 5, 1);
    const plan = await createPlan(config, solver);
    const firstIncoming = plan.segments[1].field.filter(
      (id) => !plan.segments[0].field.includes(id),
    );
    const nextOutgoing = plan.segments[1].field.filter(
      (id) => !plan.segments[2].field.includes(id),
    );

    expect(firstIncoming).toHaveLength(1);
    expect(nextOutgoing).toHaveLength(1);
    expect(nextOutgoing).not.toContain(firstIncoming[0]);
  });
  it("keeps every incoming player on through the following round when a compliant plan exists", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const config = settings(10, 5, 2);
    const plan = await createPlan(config, solver);

    for (let index = 1; index < plan.segments.length - 1; index++) {
      const previous = plan.segments[index - 1].field;
      const current = plan.segments[index].field;
      const next = plan.segments[index + 1].field;
      const incoming = current.filter((id) => !previous.includes(id));

      for (const id of incoming) expect(next).toContain(id);
    }
  }, 35_000);
  it("matches an exhaustive optimum for a small unequal-segment case", async () => {
    const config = settings(7, 18, 1);
    const durations = [1080, 1080, 840];
    let optimal = Infinity;
    for (let firstBench = 0; firstBench < 6; firstBench++) {
      for (let secondBench = 0; secondBench < 6; secondBench++) {
        for (let thirdBench = 0; thirdBench < 6; thirdBench++) {
          if (firstBench === secondBench || secondBench === thirdBench)
            continue;
          const minutes = Array(6).fill(FULL) as number[];
          [firstBench, secondBench, thirdBench].forEach((bench, index) => {
            minutes[bench] -= durations[index];
          });
          optimal = Math.min(
            optimal,
            Math.max(...minutes) - Math.min(...minutes),
          );
        }
      }
    }
    expect((await createPlan(config, solver)).gap).toBe(optimal);
  });
  it("balances cumulative minutes among plans with the best final gap", async () => {
    const config = settings(10, 18, 2);
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const plan = await createPlan(config, solver);
    const fieldPlayers = config.players
      .filter((player) => player.id !== config.keeperId)
      .map((player) => player.id);
    let bestFinalGap = Infinity;
    let bestCumulativeImbalance = Infinity;
    function pairs(items: string[]): string[][] {
      return items.flatMap((first, index) =>
        items.slice(index + 1).map((second) => [first, second]),
      );
    }

    function enumerate(index: number, field: string[], totals: number[], spread: number) {
      const duration = plan.segments[index].end - plan.segments[index].start;
      const nextTotals = [...totals];
      for (const id of field)
        nextTotals[fieldPlayers.indexOf(id)] += duration;
      const values = fieldPlayers.map((_, player) => nextTotals[player]);
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const nextImbalance =
        spread + values.reduce((sum, value) => sum + Math.abs(value - mean), 0);

      if (index === plan.segments.length - 1) {
        const finalGap = Math.max(...values) - Math.min(...values);
        if (
          finalGap < bestFinalGap ||
          (finalGap === bestFinalGap &&
            nextImbalance < bestCumulativeImbalance)
        ) {
          bestFinalGap = finalGap;
          bestCumulativeImbalance = nextImbalance;
        }
        return;
      }

      const bench = fieldPlayers.filter((id) => !field.includes(id));
      for (const outgoingPlayers of pairs(field)) {
        for (const incomingPlayers of pairs(bench)) {
          const outgoing = new Set(outgoingPlayers);
          enumerate(
            index + 1,
            [
              ...field.filter((id) => !outgoing.has(id)),
              ...incomingPlayers,
            ],
            nextTotals,
            nextImbalance,
          );
        }
      }
    }

    enumerate(0, plan.segments[0].field, fieldPlayers.map(() => 0), 0);

    expect(plan.gap).toBe(bestFinalGap);
    const plannedImbalance = plan.segments.reduce(
      (sum, segment) => {
        const elapsed = segment.end;
        const totals = fieldPlayers.map((id) =>
          plan.segments.reduce(
            (minutes, previous) =>
              minutes +
              (previous.field.includes(id)
                ? Math.max(0, Math.min(elapsed, previous.end) - previous.start)
                : 0),
            0,
          ),
        );
        const mean = totals.reduce((total, value) => total + value, 0) / totals.length;
        return (
          sum +
          totals.reduce((total, value) => total + Math.abs(value - mean), 0)
        );
      },
      0,
    );
    expect(plannedImbalance).toBeCloseTo(bestCumulativeImbalance);
  });
  it("keeps halftime substitutions pending until second-half kickoff", async () => {
    const plan = await createPlan(settings(7, 5, 1), solver);
    expect(segmentAt(plan, HALF, true)).toBe(4);
    expect(segmentAt(plan, HALF, false)).toBe(5);
    expect(segmentAt(plan, FULL)).toBe(9);
  });
});
