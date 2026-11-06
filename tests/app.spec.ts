import { expect, test, type Page } from "@playwright/test";
import type { Plan } from "../src/domain";

const key = "cancha-justa.game.v1";
async function openTeam(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) < 700)
    await page
      .locator(".mobile-nav")
      .getByRole("button", { name: "Equipo", exact: true })
      .click();
}
async function fillTeam(page: Page) {
  await page.goto("/");
  const nicknames = [
    "Leo",
    "Nico",
    "Alex",
    "Dani",
    "Hugo",
    "Teo",
    "Luca",
    "Max",
    "Pau",
    "Eric",
  ];
  const rows = page.locator(".roster-row");
  await expect(rows).toHaveCount(10);
  for (const [index, nickname] of nicknames.entries()) {
    await rows.nth(index).locator("input").nth(0).fill(nickname);
    await rows
      .nth(index)
      .locator("input")
      .nth(1)
      .fill(String(index + 1));
  }
  await page
    .getByLabel("Portero Todo el partido")
    .selectOption({ label: "Leo · #1" });
  await page.getByLabel("Cambios por ronda").fill("2");
  await page
    .getByRole("button", { name: "Calcular rotaciones", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar partido", exact: true }),
  ).toBeEnabled();
}
async function setClock(
  page: Page,
  firstAgo: number,
  secondAgo: number | null = null,
) {
  await page.evaluate(
    ({ storageKey, first, second }) => {
      const game = JSON.parse(localStorage.getItem(storageKey)!);
      game.clock = {
        firstStartedAt: Date.now() - first * 1000,
        secondStartedAt: second === null ? null : Date.now() - second * 1000,
      };
      localStorage.setItem(storageKey, JSON.stringify(game));
    },
    { storageKey: key, first: firstAgo, second: secondAgo },
  );
  await page.reload();
}
test("plans, recalculates, displays every view, and preserves local privacy", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      new URL(request.url()).hostname !== "localhost"
    )
      external.push(request.url());
  });
  await fillTeam(page);
  await expect(page.locator(".pitch-player:not(.unassigned)")).toHaveCount(6);
  await expect(page.locator(".bench .player-line")).toHaveCount(4);
  expect(
    await page
      .locator(".skip-link")
      .evaluate((element) => element.getBoundingClientRect().bottom),
  ).toBeLessThanOrEqual(0);
  await expect(page.locator(".next-time")).toContainText("05:00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("pitch.png"),
    fullPage: true,
  });
  const readPositions = () =>
    page.locator(".pitch-player:not(.is-keeper)").evaluateAll((elements) =>
      elements.map((element) => ({
        number: element.querySelector(".player-token")!.textContent,
        position: element.querySelector(".position-label")!.textContent,
      })),
    );
  const startingPositions = await readPositions();
  await page
    .getByRole("button", { name: "Tramo siguiente", exact: true })
    .click();
  await expect(page.locator(".pitch-heading")).toContainText("05:00");
  const continuingPlayers = (await readPositions()).filter((player) =>
    startingPositions.some((previous) => previous.number === player.number),
  );
  expect(continuingPlayers).toHaveLength(3);
  for (const player of continuingPlayers) {
    expect(player.position).toBe(
      startingPositions.find((previous) => previous.number === player.number)!
        .position,
    );
  }
  await page
    .locator(".view-tabs")
    .getByRole("button", { name: "Rotaciones", exact: true })
    .click();
  await expect(page.locator(".timeline-row")).toHaveCount(10);
  await page
    .locator(".view-tabs")
    .getByRole("button", { name: "Minutos", exact: true })
    .click();
  await expect(page.locator(".fairness-summary")).toContainText(
    "Mejor reparto posible",
  );
  await expect(
    page.locator(".minute-bars:not(.compact) .minute-row"),
  ).toHaveCount(10);
  await page.screenshot({
    path: testInfo.outputPath("minutes.png"),
    fullPage: true,
  });
  await openTeam(page);
  await page.getByLabel("Minutos del intervalo").fill("10");
  await page.getByLabel("Formación", { exact: true }).selectOption("3-1-1");
  if ((page.viewportSize()?.width ?? 1440) >= 700)
    await expect(
      page.getByRole("button", { name: "Iniciar partido", exact: true }),
    ).toBeDisabled();
  await page
    .getByRole("button", { name: "Calcular rotaciones", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar partido", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".next-time")).toContainText("10:00");
  await page.reload();
  await expect(page.locator(".formation-label")).toHaveText("3-1-1");
  await expect(page.locator(".bench .player-line")).toHaveCount(4);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("uses separate minutes and seconds for exact substitution intervals", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByLabel("Portero Todo el partido")
    .selectOption({ label: "Ibai A · #1" });
  await page.getByLabel("Minutos del intervalo").fill("0");
  await page
    .getByRole("button", { name: "Calcular rotaciones", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "El intervalo debe ser positivo",
  );
  await page.getByLabel("Segundos del intervalo").fill("60");
  await expect(page.locator(".validation-errors")).toContainText([
    "El intervalo debe ser positivo",
    "entre 0 y 59",
  ]);
  await expect(page.getByLabel("Segundos del intervalo")).toHaveValue("0");
  await page.getByLabel("Minutos del intervalo").fill("6");
  await page.getByLabel("Segundos del intervalo").fill("15");
  await page
    .getByRole("button", { name: "Calcular rotaciones", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar partido", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".next-time")).toContainText("06:15");
  await expect(page.locator(".next-caption")).toHaveText("Cada 06:15");
  const saved = await page.evaluate(
    (storageKey) => JSON.parse(localStorage.getItem(storageKey)!),
    key,
  );
  expect(saved.settings.interval).toBe(6.25);
  expect(saved.plan.segments[0].end).toBe(375);
  await page.reload();
  await openTeam(page);
  await expect(page.getByLabel("Minutos del intervalo")).toHaveValue("6");
  await expect(page.getByLabel("Segundos del intervalo")).toHaveValue("15");
  const intervalBounds = await page
    .getByLabel("Minutos del intervalo")
    .boundingBox();
  const secondsBounds = await page
    .getByLabel("Segundos del intervalo")
    .boundingBox();
  const swapsBounds = await page.getByLabel("Cambios por ronda").boundingBox();
  expect(intervalBounds).not.toBeNull();
  expect(secondsBounds).not.toBeNull();
  expect(swapsBounds).not.toBeNull();
  expect(Math.abs(intervalBounds!.y - secondsBounds!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(intervalBounds!.y - swapsBounds!.y)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(intervalBounds!.height - swapsBounds!.height),
  ).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("interval-controls.png"),
    fullPage: true,
  });
});

test("randomizes recalculated lineups but preserves the saved draw on refresh", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999999;
  });
  await fillTeam(page);
  const readPlan = () =>
    page.evaluate(
      (storageKey) =>
        JSON.parse(localStorage.getItem(storageKey)!).plan as Plan,
      key,
    );
  const first = await readPlan();
  await openTeam(page);
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  await page
    .getByRole("button", { name: "Recalcular rotaciones", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar partido", exact: true }),
  ).toBeEnabled();
  const second = await readPlan();
  expect([...second.segments[0].field].sort()).not.toEqual(
    [...first.segments[0].field].sort(),
  );
  expect([...second.segments.at(-1)!.field].sort()).not.toEqual(
    [...first.segments.at(-1)!.field].sort(),
  );
  expect(second.gap).toBe(first.gap);
  await expect(page.locator(".pitch-player.is-keeper")).toContainText("Leo");
  await page.reload();
  await expect(page.locator(".pitch-player.is-keeper")).toContainText("Leo");
  expect(await readPlan()).toEqual(second);
});

test("recovers half boundaries and clears all previous game data explicitly", async ({
  page,
}, testInfo) => {
  await fillTeam(page);
  await page
    .getByRole("button", { name: "Iniciar partido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Empezar primera parte", exact: true })
    .click();
  await expect(page.locator(".phase-pill")).toHaveText("Primera parte");
  await openTeam(page);
  await expect(page.getByLabel("Minutos del intervalo")).toBeDisabled();
  await expect(page.getByLabel("Segundos del intervalo")).toBeDisabled();
  await expect(page.getByLabel("Portero Todo el partido")).toBeDisabled();
  await setClock(page, 1800);
  await expect(page.locator(".phase-pill")).toHaveText("Descanso");
  await expect(page.locator(".segment-control")).toContainText("20:00 — 25:00");
  await page.screenshot({
    path: testInfo.outputPath("halftime.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Iniciar 2ª parte", exact: true })
    .click();
  await expect(page.locator(".phase-pill")).toHaveText("Segunda parte");
  await expect(page.locator(".segment-control")).toContainText("25:00 — 30:00");
  await setClock(page, 4000, 1800);
  await expect(page.locator(".phase-pill")).toHaveText("Partido finalizado");
  await expect(page.getByLabel("Reloj de la parte")).toHaveText("25:00");
  await expect(page.locator(".segment-control")).toContainText("45:00 — 50:00");
  await page
    .getByRole("button", { name: "Nuevo partido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Borrar y empezar", exact: true })
    .click();
  await openTeam(page);
  await expect(page.locator(".roster-row")).toHaveCount(10);
  await expect(
    page.getByLabel("Apodo del dorsal 1", { exact: true }),
  ).toHaveValue("Ibai A");
  await expect(
    page.getByLabel("Apodo del dorsal 15", { exact: true }),
  ).toHaveValue("Beñat");
  await expect(
    page.getByRole("textbox", { name: "Apodo", exact: true }),
  ).toHaveValue("");
  expect(
    await page.evaluate((storageKey) => localStorage.getItem(storageKey), key),
  ).not.toContain("Leo");
  expect(
    await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey)!).plan,
      key,
    ),
  ).toBeNull();
});

test("works and refreshes offline after readiness, including calculation", async ({
  page,
  context,
}) => {
  await fillTeam(page);
  await expect(page.locator(".connection")).toContainText(
    "Disponible sin conexión",
    { timeout: 45_000 },
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".pitch-player:not(.unassigned)")).toHaveCount(6);
  await expect(page.locator(".connection")).toContainText("Sin conexión");
  await openTeam(page);
  await page.getByLabel("Minutos del intervalo").fill("10");
  await page
    .getByRole("button", { name: "Calcular rotaciones", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar partido", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Iniciar partido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Empezar primera parte", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".phase-pill")).toHaveText("Primera parte");
  await context.setOffline(false);
});

test("loads the editable default squad and preserves adjustments after refresh", async ({
  page,
}) => {
  await page.goto("/");
  const rows = page.locator(".roster-row");
  await expect(rows).toHaveCount(10);
  expect(
    await rows
      .locator("input:not(.editable-number)")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual([
    "Ibai A",
    "Ibai G",
    "Einar",
    "Rayan",
    "Lier",
    "Amir",
    "Jon",
    "Tomas",
    "Telmo",
    "Beñat",
  ]);
  expect(
    await rows
      .locator(".editable-number")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual(["1", "16", "5", "2", "4", "7", "10", "3", "6", "15"]);
  await expect(page.getByLabel("Portero Todo el partido")).toHaveValue("");
  await page
    .getByLabel("Apodo del dorsal 1", { exact: true })
    .fill("Ibai suplente");
  await page
    .getByRole("button", { name: "Quitar a Ibai G", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Apodo", exact: true })
    .fill("Invitado");
  await page.getByRole("textbox", { name: "Dorsal", exact: true }).fill("99");
  await page
    .getByRole("button", { name: "Añadir jugador", exact: true })
    .click();
  await page.reload();
  await expect(rows).toHaveCount(10);
  await expect(
    page.getByLabel("Apodo del dorsal 1", { exact: true }),
  ).toHaveValue("Ibai suplente");
  await expect(
    page.getByLabel("Apodo del dorsal 99", { exact: true }),
  ).toHaveValue("Invitado");
  await expect(
    page.getByRole("button", { name: "Quitar a Ibai G", exact: true }),
  ).toHaveCount(0);
});

test("keeps the skip link offscreen until keyboard focus", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  expect(
    await page
      .locator(".skip-link")
      .evaluate((element) => element.getBoundingClientRect().bottom),
  ).toBeLessThanOrEqual(0);
  await page.keyboard.press("Tab");
  if (browserName === "webkit")
    await page.getByRole("link", { name: "Saltar al partido" }).focus();
  await expect(
    page.getByRole("link", { name: "Saltar al partido" }),
  ).toBeFocused();
  expect(
    await page
      .locator(".skip-link")
      .evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(0);
});
