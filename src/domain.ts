export const HALF = 25 * 60;
export const FULL = HALF * 2;
export const formations = ["2-2-1", "2-1-2", "1-3-1", "3-1-1"] as const;
export type Formation = (typeof formations)[number];
export type Player = { id: string; nickname: string; number: string };
export const defaultPlayers = (): Player[] => [
  { id: "default-1", nickname: "Ibai A", number: "1" },
  { id: "default-16", nickname: "Ibai G", number: "16" },
  { id: "default-5", nickname: "Einar", number: "5" },
  { id: "default-2", nickname: "Rayan", number: "2" },
  { id: "default-4", nickname: "Lier", number: "4" },
  { id: "default-7", nickname: "Amir", number: "7" },
  { id: "default-10", nickname: "Jon", number: "10" },
  { id: "default-3", nickname: "Tomas", number: "3" },
  { id: "default-6", nickname: "Telmo", number: "6" },
  { id: "default-15", nickname: "Beñat", number: "15" },
];
export type Settings = {
  players: Player[];
  keeperId: string;
  formation: Formation;
  interval: number;
  swaps: number;
};
export type Segment = { start: number; end: number; field: string[] };
export type Plan = {
  segments: Segment[];
  totals: Record<string, number>;
  gap: number;
};
export type Clock = {
  firstStartedAt: number | null;
  secondStartedAt: number | null;
};
export type Game = {
  version: 1;
  settings: Settings;
  plan: Plan | null;
  clock: Clock;
};
export const emptyClock = (): Clock => ({
  firstStartedAt: null,
  secondStartedAt: null,
});
export const emptySettings = (): Settings => ({
  players: [],
  keeperId: "",
  formation: "2-2-1",
  interval: 5,
  swaps: 2,
});
export function intervalParts(intervalMinutes: number): {
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Number.isFinite(intervalMinutes)
    ? Math.max(0, Math.round(intervalMinutes * 60))
    : 0;
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}
export function validateSettings(settings: Settings): string[] {
  const errors: string[] = [];
  if (settings.players.length < 6)
    errors.push("Se necesitan al menos 6 jugadores.");
  if (
    settings.players.some(
      (player) => !player.nickname.trim() || !player.number.trim(),
    )
  )
    errors.push("Completa el apodo y el dorsal de cada jugador.");
  if (
    new Set(settings.players.map((player) => player.id)).size !==
    settings.players.length
  )
    errors.push("Hay jugadores duplicados.");
  if (!settings.players.some((player) => player.id === settings.keeperId))
    errors.push("Elige al portero antes de calcular.");
  if (!formations.includes(settings.formation))
    errors.push("Elige una formacion valida.");
  const intervalSeconds = settings.interval * 60;
  if (
    !Number.isFinite(settings.interval) ||
    settings.interval <= 0 ||
    !Number.isSafeInteger(Math.round(intervalSeconds)) ||
    Math.round(intervalSeconds) < 1 ||
    Math.abs(intervalSeconds - Math.round(intervalSeconds)) > 1e-7
  )
    errors.push("El intervalo debe ser positivo, con precision de segundos.");
  const bench = Math.max(0, settings.players.length - 6);
  if (
    !Number.isInteger(settings.swaps) ||
    (bench === 0
      ? settings.swaps !== 0
      : settings.swaps < 1 || settings.swaps > Math.min(5, bench))
  )
    errors.push(
      "Los cambios deben caber en el banquillo y en las 5 plazas de campo.",
    );
  return errors;
}
export function ranges(
  intervalMinutes: number,
): { start: number; end: number }[] {
  const step = Math.round(intervalMinutes * 60);
  if (!Number.isSafeInteger(step) || step <= 0)
    throw new Error("Intervalo no valido.");
  const result = [];
  for (let start = 0; start < FULL; start += step)
    result.push({ start, end: Math.min(start + step, FULL) });
  return result;
}
export function matchState(clock: Clock, now: number) {
  if (clock.firstStartedAt === null)
    return { phase: "setup" as const, elapsed: 0, halfElapsed: 0 };
  if (clock.secondStartedAt !== null) {
    const halfElapsed = Math.min(
      HALF,
      Math.max(0, (now - clock.secondStartedAt) / 1000),
    );
    return {
      phase: halfElapsed >= HALF ? ("finished" as const) : ("second" as const),
      elapsed: HALF + halfElapsed,
      halfElapsed,
    };
  }
  const halfElapsed = Math.min(
    HALF,
    Math.max(0, (now - clock.firstStartedAt) / 1000),
  );
  return {
    phase: halfElapsed >= HALF ? ("halftime" as const) : ("first" as const),
    elapsed: halfElapsed,
    halfElapsed,
  };
}
export function segmentAt(
  plan: Plan,
  elapsed: number,
  halftime = false,
): number {
  const instant = halftime ? elapsed - 0.001 : elapsed;
  return Math.max(
    0,
    plan.segments.findLastIndex((segment) => segment.start <= instant),
  );
}
export function minutesSoFar(
  settings: Settings,
  plan: Plan,
  elapsed: number,
): Record<string, number> {
  const totals = Object.fromEntries(
    settings.players.map((player) => [player.id, 0]),
  );
  totals[settings.keeperId] = Math.min(FULL, elapsed);
  for (const segment of plan.segments) {
    const duration = Math.max(
      0,
      Math.min(elapsed, segment.end) - segment.start,
    );
    for (const id of segment.field) totals[id] += duration;
  }
  return totals;
}
export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
export function formatMinutes(seconds: number): string {
  const whole = Math.round(seconds);
  return whole % 60 === 0
    ? `${whole / 60} min`
    : `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")} min`;
}
export const positionLabels = (formation: Formation): string[] => {
  const [defenders, midfielders, forwards] = formation.split("-").map(Number);
  const labels = (count: number, singular: string, plural: string) =>
    count === 1
      ? [singular]
      : Array.from(
          { length: count },
          (_, index) =>
            `${plural} ${count === 2 ? ["izq.", "der."][index] : ["izq.", "centro", "der."][index]}`,
        );
  return [
    ...labels(defenders, "Defensa", "Def."),
    ...labels(midfielders, "Medio", "Med."),
    ...labels(forwards, "Delantero", "Del."),
  ];
};
