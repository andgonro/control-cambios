# Cancha Justa

Spanish, phone-first, single-page football rotation planner. Built with React, TypeScript, Vite, and a locally executed optimization solver. There is no backend, account, cloud player storage, or analytics.

## Run

Requires Node.js 22.12 or newer within a supported Node release.

- Install dependencies: `npm ci`.
- Start development: `npm run dev`.
- Check types and create the offline-ready production bundle: `npm run build`.
- Serve that bundle locally: `npm run preview -- --port 4173`.
- Open `http://localhost:4173`.

The production preview supports offline preparation. The development server does not register the offline service worker.

## GitHub Pages

Open the hosted app on your phone at https://andgonro.github.io/control-cambios/.

The repository is public, including the default player nicknames and numbers in the source. User-entered game details remain local to each browser; a phone does not share the game saved on a computer.

The deployment workflow tests and builds pushes to `main`, then publishes the production bundle through GitHub Pages. Repository Settings > Pages must use GitHub Actions as its source. The build automatically uses `/control-cambios/` in GitHub Actions, while normal local development keeps `/`.

To test the Pages path locally, build with `npm run build -- --base=/control-cambios/`, then serve it with `npm run preview -- --base=/control-cambios/`. Open the preview URL followed by `/control-cambios/`.

## Validate

- Unit tests: `npm test`.
- Install browser test engines: `npx playwright install chromium webkit`.
- Browser tests: build first, then run `npm run test:e2e`. The test configuration starts a preview server if needed.
- Browser coverage includes desktop Chromium, a phone-sized Chromium viewport, and an iPhone-sized WebKit viewport. Emulation is not a substitute for testing on physical iOS and Android devices.

## Match Rules

- Six on the pitch: five field players and one fixed goalkeeper.
- Two manually started, continuous twenty-five-minute halves. No in-half pause.
- New games start with the ten default players supplied by the coach. Edit, add, or remove players as needed, select the keeper, formation, interval, and exact field swap count, then calculate.
- Freely edit and recalculate before kickoff. Changes invalidate the previous plan. Settings lock at kickoff.
- Enter substitution intervals with separate whole minutes and seconds, with seconds from zero to fifty-nine and a positive total duration. Six minutes and fifteen seconds schedules exchanges every 06:15, not every 6.15 decimal minutes. Previously saved intervals retain their original durations.
- Every calculation randomly draws the starting five from the field players before optimizing the rotations. The keeper stays fixed, and the best achievable minute difference is unchanged. Restoring a saved game does not redraw its plan. Random draws can repeat; there is no cross-game participation history.
- Minimize the maximum-minus-minimum field-player minutes. The full-game keeper is excluded. Automatic position variety is secondary.
- Carry intervals across halftime. Apply an exchange due exactly at halftime at the second-half start. Never exchange at full time.
- Preview any scheduled lineup, bench, exchange, and minute total. The live view automatically follows the schedule and explicitly shows estimated rather than verified actual participation.

## Local Data and Offline Use

Only one game is kept under `cancha-justa.game.v1` in local browser storage, including after full time. New Game explicitly deletes and replaces the previous details. There is no match history. Fonts and optimization resources are bundled locally; player data is never transmitted.

The requested default nicknames and numbers are included in the application bundle. They populate first visits, new games, and saved empty pregame setups; a non-empty saved squad is recovered unchanged. Each new game gets a separate editable copy, with no goalkeeper preselected.

Wait for offline readiness after the first online production load. The app can then load and recover the same game offline, provided the browser retains its cached application and local data. Clearing browser data, private browsing, or storage eviction can prevent recovery. Others using the same browser can access the saved game.

Deploy the contents of the generated production bundle to an HTTPS static host. Offline functionality requires HTTPS or localhost; ordinary HTTP over a LAN address does not provide equivalent service-worker support. Keep the service worker at the application root and do not cache its script indefinitely at the host. A root-path deployment is configured by default.

## Limits

- The optimizer runs in a browser Web Worker. It must prove the best minute difference before a plan can be started. A twenty-five-second solve limit produces a clear error rather than silently presenting an unproven plan as optimal. Large squads or very short intervals may need different settings.
- Elapsed state is reconstructed after interruptions. Background notifications are not guaranteed, and the second half never starts automatically.
- Clock recovery assumes a reasonably accurate device clock. A detected clock reversal is reported; changing the system time can affect elapsed-time reconstruction.
- No injuries, late arrivals, early departures, goalkeeper changes, or manual position changes are supported after kickoff.
- The runtime dependency audit reports no known vulnerabilities at implementation time. The PWA build-tool dependency chain still reports six low/moderate advisories; review upstream fixes before production deployment.
- `glpk.js` is GPL-3.0 licensed. Review its redistribution and corresponding-source obligations before distributing the bundled application. This repository does not assign a license to the coach's own code or data.

The approved planning documents are in [docs/specs/youth-football/equal-playing-time/spec.md](docs/specs/youth-football/equal-playing-time/spec.md).
