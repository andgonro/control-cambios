import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import GLPK, { type GLPK as Solver } from "glpk.js/node";
import { emptyClock, type Game, type Settings } from "./domain";
import { createPlan } from "./planner";
import { freshGame, loadGame, parseGame } from "./storage";

let solver: Solver;
beforeAll(async () => {
  solver = await GLPK();
});
function config(): Settings {
  return {
    players: Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      nickname: "Mismo apodo",
      number: String(index),
    })),
    keeperId: "0",
    formation: "3-1-1",
    interval: 10,
    swaps: 1,
  };
}
describe("saved game validation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts with the requested editable default squad and no selected keeper", () => {
    const game = freshGame();
    expect(
      game.settings.players.map(({ nickname, number }) => [number, nickname]),
    ).toEqual([
      ["1", "Ibai A"],
      ["16", "Ibai G"],
      ["5", "Einar"],
      ["2", "Rayan"],
      ["4", "Lier"],
      ["7", "Amir"],
      ["10", "Jon"],
      ["3", "Tomas"],
      ["6", "Telmo"],
      ["15", "Beñat"],
    ]);
    expect(new Set(game.settings.players.map((player) => player.id)).size).toBe(
      10,
    );
    expect(game.settings.keeperId).toBe("");
    expect(game.plan).toBeNull();
    expect(game.clock).toEqual(emptyClock());
    game.settings.players[0].nickname = "Edited";
    game.settings.players.pop();
    expect(freshGame().settings.players).toHaveLength(10);
    expect(freshGame().settings.players[0].nickname).toBe("Ibai A");
  });

  it("loads defaults for a first visit or an existing empty setup", () => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    expect(loadGame().game).toEqual(freshGame());
    const empty = freshGame();
    empty.settings.players = [];
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(empty) });
    expect(loadGame().game).toEqual(freshGame());
  });

  it("preserves a saved adjusted squad rather than replacing it with defaults", () => {
    const adjusted = { ...freshGame(), settings: config() };
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(adjusted) });
    expect(loadGame().game).toEqual(adjusted);
  });

  it("recovers empty and partially completed pregame settings", () => {
    expect(parseGame(JSON.stringify(freshGame()))).toEqual(freshGame());
    const game = {
      ...freshGame(),
      settings: { ...config(), interval: 0, keeperId: "" },
    };
    expect(parseGame(JSON.stringify(game))).toEqual(game);
  });
  it("recovers the exact existing plan and fixed keeper without merging duplicate nicknames", async () => {
    const settings = config();
    const game: Game = {
      version: 1,
      settings,
      plan: await createPlan(settings, solver),
      clock: { firstStartedAt: 1, secondStartedAt: 2_000_000 },
    };
    expect(parseGame(JSON.stringify(game))).toEqual(game);
    expect(new Set(game.plan!.segments[0].field).size).toBe(5);
  });
  it("rejects a running game without a plan and an impossible second-half start", () => {
    expect(() =>
      parseGame(
        JSON.stringify({
          ...freshGame(),
          clock: { firstStartedAt: 1, secondStartedAt: null },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseGame(
        JSON.stringify({
          ...freshGame(),
          clock: { firstStartedAt: null, secondStartedAt: 1 },
        }),
      ),
    ).toThrow();
  });
  it("rejects corrupt assignments, timing and minute totals", async () => {
    const settings = config();
    const plan = await createPlan(settings, solver);
    const original: Game = { version: 1, settings, plan, clock: emptyClock() };
    for (const corrupt of [
      { ...plan, totals: { ...plan.totals, "0": 1 } },
      { ...plan, gap: plan.gap + 1 },
      { ...plan, segments: plan.segments.slice(1) },
      {
        ...plan,
        segments: plan.segments.map((segment, index) =>
          index ? segment : { ...segment, field: ["0", "1", "2", "3", "4"] },
        ),
      },
    ])
      expect(() =>
        parseGame(JSON.stringify({ ...original, plan: corrupt })),
      ).toThrow();
    expect(() => parseGame("invalid data")).toThrow();
  });
});
