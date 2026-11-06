# Title: Proposal - Equal Playing Time

## Summary

Provide Cancha Justa, a Spanish-language, phone-first single-page application that helps a coach of seven-year-old footballers plan fair field-player minutes and see who plays in every position throughout a game. Combine an editable default squad, randomized starting lineups, explicit minute-and-second substitution intervals, an automatic live schedule, and recoverable local game data. Preserve the positions of children who remain on the pitch during substitutions.

This proposal describes the current repository implementation rather than only the original discovery scope. The hosted app is available at https://andgonro.github.io/control-cambios/; its version follows the most recent successful deployment from `main`.

## Context

Games are six against six: five field players and one goalkeeper. The squad may have around ten children, but attendance varies and must not be restricted to ten.

The coach currently needs to coordinate substitutions, positions, and equal participation together. A predetermined substitution count and interval can make perfectly equal minutes impossible, so the app must disclose the resulting differences rather than promise equality it cannot deliver.

The coach selects one goalkeeper for the entire game. That child is excluded from field-player minute balancing. The remaining children share the five field places.

The primary stakeholder is the coach using a phone beside the pitch. The children benefit from fair participation and predictable field positions. Player information is limited to nicknames and shirt numbers. The coach-approved defaults are included in the public source and downloaded application; user-entered game edits and progress remain in the local browser and are not uploaded or synchronized across devices.

## High-Level Approach

- Start fresh games with an independent, editable copy of the coach's ten default players: Ibai A (1), Ibai G (16), Einar (5), Rayan (2), Lier (4), Amir (7), Jon (10), Tomas (3), Telmo (6), and Beñat (15). A non-empty saved squad takes precedence. Select the goalkeeper explicitly before calculating; no goalkeeper is preselected.
- Allow changes to participants, goalkeeper, formation, substitution interval, and swap count at any time before kickoff, followed by full recalculation. Clearly identify an outdated plan until recalculated.
- Offer formations of two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; or three defenders, one midfielder, and one forward.
- Use two twenty-five-minute halves. Start each half manually, run it continuously, and exclude halftime from playing time.
- Let the coach choose a positive substitution interval using separate whole-minute and whole-second inputs, with seconds from zero to fifty-nine. Six minutes plus fifteen seconds means 06:15, not 6.15 decimal minutes. Choose an exact number of field players exchanged per round without equating it with the entire bench.
- Carry substitution timing across halftime. Apply a round due exactly at halftime at second-half kickoff, and do not exchange players at full time.
- Randomly draw the starting five from the non-goalkeeper participants on every calculation or recalculation before kickoff. Randomize player identities throughout the resulting plan without worsening its best achievable minute difference. Random draws may repeat; this is not historical fairness tracking.
- Minimize the difference between the greatest and least planned field-player minutes under the chosen settings. At each exchange, keep continuing children in their existing positions. Assign incoming children to the vacated positions, favoring variety among those available slots.
- Show a pitch, bench, complete rotation timeline, individual minute totals, and the remaining minute difference before kickoff.
- Lock game settings at kickoff. Automatically advance the live scheduled lineup and show the clock and next substitution.
- Label live participation totals as estimates based on scheduled swaps, not verified actual play.
- Retain one recoverable game locally, including after full time, until the coach explicitly starts a new game, clears the previous plan and progress, and restores the default squad with no selected goalkeeper. Refreshing an existing game restores its exact plan rather than drawing new starters.
- Support offline use and refresh after initial online loading and confirmed offline readiness. Restore the appropriate scheduled state after interruptions without starting the second half automatically.
- Deliver setup, pitch, rotation timeline, minute totals, and live match controls within one responsive page, with phone navigation and no account or separate installation requirement.
- Publish the static production build through GitHub Pages over HTTPS. Keep assets, manifest, and offline scope under `/control-cambios/`, while normal local development uses `/`.

## Deliverables

- A working React and TypeScript SPA, built with Vite, with local-only game storage and a browser-worker optimization engine.
- A public GitHub repository at https://github.com/andgonro/control-cambios and an Actions workflow that tests, builds, and deploys `main` to GitHub Pages.
- This proposal defining the purpose, scope, limitations, and intended experience.
- A full specification covering setup, fairness, rotation timing, positions, live behavior, privacy, recovery, and quality requirements.
- User stories with acceptance criteria for normal workflows, invalid settings, halftime boundaries, and interrupted sessions.
- Automated unit and browser regression coverage, together with a documented first-release boundary and known limitations.

## Notes

- The initial empty workspace has become a React/TypeScript application. These documents track the local implementation; unpushed changes are not automatically present on the hosted site.
- With exactly six participants, the five field players stay on the pitch and there are no bench substitutions.
- A swap cannot exceed the available substitutes or the five field places. Four children on the bench may still rotate two at a time every five minutes.
- A ten-minute interval produces exchanges at first-half minutes ten and twenty and second-half minutes five and fifteen. A five-minute interval also has an exchange due at halftime, applied at second-half kickoff.
- A 06:15 interval produces exchanges at total playing times 06:15, 12:30, 18:45, 25:00, 31:15, 37:30, and 43:45. The 25:00 round remains pending during the break and takes effect at second-half kickoff; there is no 50:00 exchange.
- Intervals that produce no exchanges before full time are permitted, but the preview must make that outcome and the unequal minutes visible.
- Formation, squad, goalkeeper, interval, and swap count cannot change after kickoff. Injuries, late arrivals, early departures, and manual position overrides are outside the first release.
- Browser suspension or closure can prevent timely alerts. Recovery restores a schedule, not evidence that real substitutions occurred.
- The optimizer must prove the best minute difference before kickoff. A twenty-five-second solve limit returns a clear error instead of presenting an unproven plan as optimal; large squads or very short intervals may require different settings.
- Local storage may be lost through browser-data deletion, storage eviction, or private browsing. Retention until New Game is not a permanent-storage guarantee.
- Current iPhone Safari and Android Chrome are the mobile targets. Chromium and WebKit phone emulation cover planning, recovery, offline use, interval inputs, and position continuity. Physical-device validation remains separate from automated browser coverage.
- The public repository and bundled default names and numbers are an explicit coach-approved exception to local-only user-entered game storage. A phone and a computer have independent local games.
- Offline readiness visibility on small screens, remaining contrast issues, and zero-substitution round labels are documented review gaps, not completed accessibility claims. See the specification's verification notes.
- The browser solver uses `glpk.js`, which is GPL-3.0 licensed. Distribution obligations and remaining build-tool dependency advisories require review before broader redistribution.
- The coach approved local retention after full time until New Game, replacing the earlier idea of automatic deletion when the game ends.
- There are no accounts, cloud player records, sharing, historical analysis, payments, public profiles, or exports in this release.
