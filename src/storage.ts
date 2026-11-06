import { z } from "zod";
import {
  FULL,
  defaultPlayers,
  emptyClock,
  emptySettings,
  formations,
  matchState,
  validateSettings,
  type Game,
} from "./domain";

export const STORAGE_KEY = "cancha-justa.game.v1";
const timestamp = z.number().finite().nonnegative().nullable();
const schema = z.object({
  version: z.literal(1),
  settings: z.object({
    players: z.array(
      z.object({
        id: z.string().min(1),
        nickname: z.string(),
        number: z.string(),
      }),
    ),
    keeperId: z.string(),
    formation: z.enum(formations),
    interval: z.number().finite(),
    swaps: z.number().finite(),
  }),
  plan: z
    .object({
      segments: z
        .array(
          z.object({
            start: z.number().int().nonnegative(),
            end: z.number().int().positive(),
            field: z.array(z.string()),
          }),
        )
        .min(1),
      totals: z.record(z.string(), z.number().finite().nonnegative()),
      gap: z.number().finite().nonnegative(),
    })
    .nullable(),
  clock: z.object({ firstStartedAt: timestamp, secondStartedAt: timestamp }),
});
export const freshGame = (): Game => ({
  version: 1,
  settings: { ...emptySettings(), players: defaultPlayers() },
  plan: null,
  clock: emptyClock(),
});
export function parseGame(raw: string): Game {
  const game = schema.parse(JSON.parse(raw));
  const { settings, plan, clock } = game;
  if (
    new Set(settings.players.map((player) => player.id)).size !==
    settings.players.length
  )
    throw new Error("Participantes duplicados.");
  if (
    clock.secondStartedAt !== null &&
    (clock.firstStartedAt === null ||
      clock.secondStartedAt < clock.firstStartedAt + 1_500_000)
  )
    throw new Error("Reloj incompatible.");
  if (!plan && clock.firstStartedAt !== null)
    throw new Error("Falta el plan del partido.");
  if (plan) {
    if (validateSettings(settings).length)
      throw new Error("Ajustes incompatibles.");
    const ids = new Set(
      settings.players
        .filter((player) => player.id !== settings.keeperId)
        .map((player) => player.id),
    );
    const totals = Object.fromEntries(
      settings.players.map((player) => [player.id, 0]),
    );
    for (const [index, segment] of plan.segments.entries()) {
      const previous = plan.segments[index - 1];
      if (
        segment.start !== (previous?.end ?? 0) ||
        segment.end <= segment.start ||
        segment.end > FULL
      )
        throw new Error("Plan incompleto.");
      if (
        new Set(segment.field).size !== 5 ||
        segment.field.length !== 5 ||
        segment.field.some((id) => !ids.has(id))
      )
        throw new Error("Alineacion incompatible.");
      if (
        previous &&
        segment.field.filter((id) => !previous.field.includes(id)).length !==
          settings.swaps
      )
        throw new Error("Cambios incompatibles.");
      if (
        segment.start !== index * Math.round(settings.interval * 60) ||
        segment.end !==
          Math.min(segment.start + Math.round(settings.interval * 60), FULL)
      )
        throw new Error("Intervalos incompatibles.");
      for (const id of segment.field) totals[id] += segment.end - segment.start;
    }
    if (plan.segments.at(-1)?.end !== FULL) throw new Error("Plan incompleto.");
    totals[settings.keeperId] = FULL;
    if (
      Object.keys(plan.totals).length !== settings.players.length ||
      Object.entries(totals).some(([id, value]) => plan.totals[id] !== value)
    )
      throw new Error("Minutos incompatibles.");
    const fieldTotals = [...ids].map((id) => totals[id]);
    if (plan.gap !== Math.max(...fieldTotals) - Math.min(...fieldTotals))
      throw new Error("Reparto incompatible.");
  }
  return game;
}
export function loadGame(): { game: Game; notice: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { game: freshGame(), notice: "" };
    const game = parseGame(saved);
    if (
      game.settings.players.length === 0 &&
      game.clock.firstStartedAt === null
    )
      return { game: freshGame(), notice: "" };
    const phase = matchState(game.clock, Date.now()).phase;
    return {
      game,
      notice:
        phase === "setup"
          ? "Convocatoria recuperada en este dispositivo."
          : "Partido recuperado. Las alineaciones y los minutos son estimaciones del plan, no cambios verificados.",
    };
  } catch {
    return {
      game: freshGame(),
      notice:
        "No se pudo recuperar el partido. Los datos locales no estan disponibles o no son validos.",
    };
  }
}
