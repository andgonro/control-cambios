# Spec: Equal Playing Time

## Overview

Provide Cancha Justa, a Spanish-language, phone-first single-page football rotation planner for a coach of seven-year-old children. Each game has five field players and one fixed goalkeeper, two twenty-five-minute halves, and a variable number of participants. The coach adjusts the default squad, selects a goalkeeper, chooses the field-player swap count and an explicit minute-and-second interval, reviews a randomized fair rotation plan, and follows an automatic live schedule. Continuing field players retain their positions at exchanges.

Equal playing time applies only to the non-goalkeeper participants in the current game. Live totals represent estimated participation under the schedule, not confirmed actual minutes. Fairness is measured within a game, not across a season.

This specification describes the current repository behavior, including the latest local position-continuity change. The hosted site follows successful deployments of pushed commits, not uncommitted local changes. Requirement IDs remain stable as behavior evolves. Verification limitations and outstanding review findings are recorded below rather than treated as completed features.

## Default Squad

Use the following order, nicknames, and shirt numbers for first visits and fresh games. Ten is the initial squad size, not a participant cap.

| Shirt Number | Nickname |
| ------------ | -------- |
| 1            | Ibai A   |
| 16           | Ibai G   |
| 5            | Einar    |
| 2            | Rayan    |
| 4            | Lier     |
| 7            | Amir     |
| 10           | Jon      |
| 3            | Tomas    |
| 6            | Telmo    |
| 15           | Beñat    |

The initial formation is 2-2-1, the interval is five minutes and zero seconds, and the exchange count is two. No goalkeeper or rotation plan is preselected. Default player records are copied for each fresh game so editing one game does not change the bundled template.

## Functional Requirements

### Game Setup and Pregame Editing

- FR-1.1: Prefill the default squad for each fresh game and allow nickname and shirt-number edits. Do not request full names, photographs, dates of birth, contact information, or other player identity details.
- FR-1.2: Allow participants to be added, removed, and edited before kickoff. Support changing attendance between games without a fixed ten-player limit or an editable season-roster database; bundled defaults are a starting template, not a saved attendance history.
- FR-1.3: Require at least six participants to start. Identify participants distinctly in the lineup and bench, including when nicknames are the same.
- FR-1.4: Require the coach to select exactly one participating child as goalkeeper before calculating a plan. The selected goalkeeper remains in goal for the entire game and is not included in field-player fairness calculations or substitutions.
- FR-1.5: Offer formations of two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; and three defenders, one midfielder, and one forward.
- FR-1.6: Let the coach choose a positive substitution interval through separate whole-minute and whole-second inputs, and an exact whole-number swap count. Seconds must be from zero to fifty-nine; minutes must be nonnegative and total duration must be at least one second. Do not force the coach to exchange the whole bench.
- FR-1.7: With a bench, require at least one player per exchange and reject a count exceeding either the five field places or the available substitutes. With exactly six participants, use no bench substitutions.
- FR-1.8: Permit any otherwise valid interval that produces no substitutions before full time, but explicitly show that result and its effect on minutes before kickoff.
- FR-1.9: Allow the coach to change participants, goalkeeper, formation, interval, and swap count at any time before kickoff and recalculate the complete plan and individual totals.
- FR-1.10: After any planning-relevant change, do not present the previous plan as current. Require a recalculated valid plan before kickoff.
- FR-1.11: Lock participants, goalkeeper, formation, interval, and swap count when the first half starts. Do not offer in-game squad changes or manual position overrides.
- FR-1.12: Preserve a valid, non-empty saved squad and game on load instead of replacing it with defaults. First visits, fresh games, and saved empty pregame setups receive an independent copy of the default squad with no goalkeeper selected.
- FR-1.13: Reject invalid minute or second edits with a clear message without silently treating 6.15 as six minutes and fifteen seconds. Entering six minutes and fifteen seconds creates a 375-second interval. Both interval inputs lock at kickoff.

### Fairness and Position Assignment

- FR-2.1: Share the five field places among all participating children except the fixed goalkeeper.
- FR-2.2: Among schedules satisfying the selected interval and exact swap count, select a schedule with the smallest achievable difference between the greatest and least total planned field-player minutes over the whole game.
- FR-2.3: Do not silently alter the interval, swap count, goalkeeper, or formation to improve equality.
- FR-2.4: Show each child's planned minutes and clearly disclose the difference between the most and least field-player minutes. Display the goalkeeper separately from that comparison.
- FR-2.5: Prioritize keeping continuing field players in their existing positions at substitution rounds. Assign incoming players to the vacated positions, pursuing variety within those available slots without worsening the best achievable minute difference. Do not promise equal minutes in every position.
- FR-2.6: Assign exactly one child to each of the five named field positions and exactly one child to goal in every planned and live lineup. List every other participant on the bench.
- FR-2.7: At every scheduled exchange, exactly the selected number of field players leave and the same number of bench players enter. Do not substitute the goalkeeper or assign a child to multiple places.
- FR-2.8: At a rotation boundary, keep each continuing field player in the same position index, and assign incoming players only to positions vacated by outgoing players. Favor variety among those vacancies; do not move continuing players merely to increase variety. Do not change assignments midway through a segment.
- FR-2.9: Randomly shuffle the non-goalkeeper participants for every successful calculation or recalculation, using the resulting first five as the initial field lineup. The random draw must not change the roster's displayed order, selected keeper, exchange count, interval, or optimal minute difference. The no-substitution case must also use a random starting five when there are substitutes available.
- FR-2.10: Permit repeated draws by chance. Do not promise different starters or finishers on every calculation, or balanced starts across a season without historical records. A restored saved plan must not be redrawn automatically.
- FR-2.11: After finding the smallest achievable final field-player minute difference, try to reduce the sum of players' absolute deviations from the field-player mean at scheduled segment boundaries. Never worsen the best achievable final difference; if the bounded secondary optimization cannot produce a feasible plan, retain the final-optimal plan.

### Match Timing

- FR-3.1: Provide two halves of twenty-five playing minutes each. Halftime does not contribute to any child's playing minutes or to the substitution interval.
- FR-3.2: Start each half only when the coach explicitly starts it. Each half then runs continuously without a pause control and stops automatically at its end.
- FR-3.3: Carry substitution intervals across halftime rather than restarting them. With ten-minute intervals, exchange at first-half minutes ten and twenty and second-half minutes five and fifteen.
- FR-3.4: If a round falls exactly at the end of the first half, keep it pending during halftime and apply it once when the coach starts the second half.
- FR-3.5: Otherwise preserve the lineup across halftime until the next due round. Do not make an additional fairness-driven exchange during the break.
- FR-3.6: Do not perform a substitution at full time, even if an interval ends at that instant.
- FR-3.7: Prevent repeated starts or recovery from applying a halftime exchange or any scheduled round more than once.
- FR-3.8: Never infer a second-half start from elapsed wall-clock time while the coach is away.
- FR-3.9: With a six-minute, fifteen-second interval, exchange at total playing times 06:15, 12:30, 18:45, 25:00, 31:15, 37:30, and 43:45. Apply the 25:00 exchange at second-half kickoff and omit any full-time exchange.

### Preview and Live Match View

- FR-4.1: Before kickoff, show the selected formation, all position assignments, bench players, complete substitution timeline, per-player planned minutes, and fairness difference.
- FR-4.2: Allow the coach to inspect the lineup for any scheduled part of the game, including both halves, without losing the live match state.
- FR-4.3: During play, show the current scheduled pitch lineup, bench, half, clock, next substitution time, and incoming and outgoing children.
- FR-4.4: Advance the displayed lineup and estimated minutes automatically at the scheduled times, without requiring substitution confirmation.
- FR-4.5: Clearly distinguish planned totals and estimated elapsed minutes from verified actual participation. Do not label automatic totals as confirmed actual minutes.
- FR-4.6: At halftime, show that play is stopped and offer a deliberate second-half start. At full time, stop all playing-time accumulation and retain the final schedule-based summary.
- FR-4.7: After returning from inactivity, display the correct scheduled lineup and estimated totals, including rounds that elapsed while inactive. Make clear that recovery does not verify physical swaps.
- FR-4.8: Do not promise audible, visible, or timely alerts while the browser is suspended or closed.
- FR-4.9: Present interval summaries and round timestamps as minutes and seconds, not as decimal-minute values. Align the minute, second, and swap-count inputs; keep visible unit labels from shifting their input rows or overlapping neighboring controls.
- FR-4.10: Provide squad setup, pitch, rotation timeline, and minute views within one SPA, with phone navigation between views and a route back from previewing a lineup to the live scheduled state.

### Local Data, Recovery, and New Game

- FR-5.1: Retain a single game locally on the device, including setup, calculated plan, current match phase, and the timing information needed for recovery.
- FR-5.2: Recover the same game after refresh or reopening when browser data remains available. Retain the completed game after full time until the coach starts a new game.
- FR-5.3: Provide an explicit, confirmed New Game action that clears the previous game's edits, plan, progress, and unfinished player-entry fields, then restores the default squad and initial settings with no keeper selected. Do not retain a game history or modify the bundled default template.
- FR-5.4: Do not require accounts, cloud game storage, shared access, or uploads of user-entered game details. The coach-approved default nicknames and numbers are public in the source and application bundle; do not describe those bundled defaults as secret or local-only.
- FR-5.5: After successful initial online loading and offline preparation, support active-game use and refresh without an internet connection. Show when offline readiness has been achieved.
- FR-5.6: If local storage cannot be read or an existing saved record is invalid, show a recovery notice and load a fresh default setup without inventing match progress. When no saved record exists, use the normal default setup; the app cannot distinguish a first visit from cleared browser data.
- FR-5.7: Recovery during the first half can advance only as far as halftime. Recovery during the second half can advance only as far as full time.
- FR-5.8: Recover each browser's game independently. A phone must not be assumed to share the game saved on a computer. Valid game updates from another tab on the same browser origin update the displayed state without cloud synchronization.

## Technical Requirements

### Scheduling and Consistency

- TR-1.1: Treat the selected participant set, fixed goalkeeper, five field positions, formation, interval, and swap count as the planning inputs. Match duration is fixed at fifty playing minutes in two equal halves for this release.
- TR-1.2: Base fairness on the duration of all field-playing segments, including shorter segments caused by halftime or full time, not on counts of appearances or substitution rounds.
- TR-1.3: Calculate and compare minutes without losing meaningful differences through display rounding. The displayed fairness result must reflect the underlying schedule.
- TR-1.4: Keep preview, live view, timeline, totals, and recovered state consistent with the same calculated plan.
- TR-1.5: Preserve the distinction between the participant's visible nickname and shirt number and their distinct assignment within the game. Duplicate nicknames must not merge children or corrupt totals.
- TR-1.6: Treat local recovery as restoration of the existing game, not as a request to generate a different plan.
- TR-1.7: Keep persisted intervals in decimal minutes for compatibility, but convert them to rounded integer seconds for scheduling and minute/second display. Accept negligible floating-point representation error around a whole second; reject actual fractional-second intervals. A legacy value of 6.15 minutes remains 06:09, while a new six-minute/fifteen-second entry persists as 6.25 minutes and schedules 375-second rounds.
- TR-1.8: Use browser-worker optimization to prove the smallest feasible minute difference. A twenty-five-second solve limit must return a clear failure if optimality cannot be proved; do not label a merely feasible plan as optimal or allow it to start as a completed calculation. Keep calculation progress and cancellation available.
- TR-1.9: Apply an unbiased shuffle to a copy of the eligible field-player list before planning. Preserve continuing positions during subsequent assignment, using accumulated position time only to rank the available slots for incoming players. Position variety is a best-effort assignment preference, not a claim of globally optimal position distribution.
- TR-1.10: Measure in-game balance as the sum, over every scheduled segment boundary, of each field player's absolute deviation from the mean cumulative field-player minutes. First prove the minimum final minute difference, then run a secondary optimization for at most three seconds with that final gap fixed. Accept a feasible secondary result or retain the proven final-optimal plan; both passes share the existing twenty-five-second limit.

### Browser Timing and Offline Operation

- TR-2.1: Recover elapsed time and due rotations after browser throttling, backgrounding, refresh, or reopening rather than relying on every scheduled screen update having executed.
- TR-2.2: Store enough local timing and match-phase information to stop at the correct half boundary and require an explicit second-half start.
- TR-2.3: Prepare the application itself for offline loading as well as preserving game details locally. Availability of local game details alone does not satisfy offline refresh.
- TR-2.4: Do not report offline readiness until the resources required for the specified offline experience are available.
- TR-2.5: Keep the pending halftime round and manual second-half start consistent through refresh and repeated recovery.
- TR-2.6: Do not require a separate installation or an account to satisfy the browser-based experience.
- TR-2.7: Register the offline service worker in production builds, not the normal development server. Offline operation requires HTTPS or localhost and completed application precaching.
- TR-2.8: Reconstruct elapsed time from stored start timestamps. Report a detected clock reversal; changing the device clock can affect recovery, so correct elapsed time is not guaranteed after arbitrary system-time changes.

### Privacy and Data Lifecycle

- TR-3.1: Store no player identity details beyond nicknames and shirt numbers. Other locally retained information is limited to the active game's configuration, assignments, plan, and progress.
- TR-3.2: Exclude user-entered player edits and game progress from outgoing requests, addresses, analytics, and diagnostic reports. The initial default nicknames and numbers are distributed as static application content, not uploaded as game records. Ordinary application hosting must not become a collection path for local game changes.
- TR-3.3: Clear all prior per-game details when New Game is confirmed; do not retain hidden histories or backups. Repopulating the public default template is not retention of the previous game's attendance, edits, or progress.
- TR-3.4: Explain local-only retention and its limits, including access by others using the same browser and loss after browser-data deletion, private browsing, or storage eviction.
- TR-3.5: Do not claim that nicknames and numbers make children's data anonymous or establish legal compliance. No jurisdiction-specific legal certification is part of the approved scope.

### Application and Deployment

- TR-4.1: Implement the SPA with React and TypeScript, built by Vite, using local browser storage for one recoverable game and `glpk.js` for browser-worker optimization. Bundle fonts and runtime resources locally rather than requiring external asset providers for offline operation.
- TR-4.2: Maintain the repository at https://github.com/andgonro/control-cambios and the HTTPS app at https://andgonro.github.io/control-cambios/. The repository is public by explicit coach approval, including the bundled default roster.
- TR-4.3: On pushes to `main` or a manual dispatch, GitHub Actions installs dependencies, runs unit tests, builds the app, uploads the production artifact, and deploys it to GitHub Pages after the build succeeds.
- TR-4.4: Use `/control-cambios/` as the base path in GitHub Actions, including asset URLs, icon links, manifest start URL, and service-worker scope. Keep normal local development and builds at `/` unless a base override is supplied. The hosted version reflects successful pushed deployments, not local working-tree edits.
- TR-4.5: Account for the GPL-3.0 license of `glpk.js` when distributing the bundled app, including applicable corresponding-source obligations. Review outstanding build-tool dependency advisories before broader redistribution; the architecture does not itself certify security or legal compliance.

## Non-Functional Requirements

### Usability and Accessibility

- NFR-1.1: Prioritize one-handed phone use beside a pitch, with large touch controls and readable player assignments.
- NFR-1.2: Keep pitch labels, timeline details, and controls usable without overlap or clipped essential text on phone screens, and remain usable on tablets and desktops.
- NFR-1.3: Use Spanish for all coach-facing controls, position names, errors, timing labels, recovery messages, and privacy notices.
- NFR-1.4: Provide accessible control names, sufficient contrast, visible focus, and alternatives to color-only indications. Do not require drag-and-drop to complete core tasks.
- NFR-1.5: Make setup errors and outdated calculations explicit, with enough context for the coach to correct them.
- NFR-1.6: Give the minute and second inputs distinct accessible names, numeric whole-value controls, visible unit labels, and stable aligned dimensions alongside the swap-count input on desktop and phone layouts.

### Reliability and Compatibility

- NFR-2.1: Support current iPhone Safari and Android Chrome as the primary mobile browsers, and responsive use on larger screens.
- NFR-2.2: Validate offline loading, offline refresh, halftime recovery, full-time recovery, and resumed schedule timing on the target mobile browsers before release.
- NFR-2.3: Maintain the six-player pitch invariant, unique assignments, exact exchange count, fixed goalkeeper, and fair-minute objective across all valid supported setups.
- NFR-2.4: Remain transparent about estimated minutes and browser limits. Do not imply guaranteed background alerts or permanent local storage.

### Performance and Maintainability

- NFR-3.1: Keep lineup viewing and match controls responsive on target phones. Make recalculation progress visible when calculation is not immediate, and prevent kickoff with an incomplete or outdated plan.
- NFR-3.2: Do not impose an arbitrary ten-player squad cap. Any practical capacity limit discovered during implementation must be disclosed for product review rather than silently dropping participants.
- NFR-3.3: Keep scheduling behavior verifiable against the stated fairness and timing rules, especially fixed swap counts, unequal final segments, and halftime collisions.
- NFR-3.4: Release readiness is judged by schedule correctness, clear unequal-minute disclosure, and successful local/offline recovery. No numeric response-time target or hosting-availability commitment was agreed.

## Verification Notes and Known Gaps

- Automated unit coverage checks squad validation, whole-second interval conversion, optimal final-minute balancing, bounded in-game minute balancing, exact exchanges, randomized draws, continuing-player position indices, clock boundaries, and saved-game consistency. Browser coverage exercises desktop Chromium, phone-sized Chromium, and phone-sized WebKit, including visible pitch positions and interval-control alignment.
- GitHub Actions gates deployment on unit tests and the production build. Browser tests are a separate local verification step; the deployment workflow does not currently run them.
- The hosted repository-path build has been checked for phone rendering, optimization, manifest scope, and offline refresh. Physical iOS/Android hardware validation remains outstanding; browser emulation must not be described as proof for every device.
- Offline-readiness text is currently hidden at phone breakpoints, so the small-screen readiness indication does not yet fully meet FR-5.5. Existing automated checks find the text in the DOM but do not establish that it is visibly readable on a phone.
- Some low-contrast small text remains below normal-text contrast targets. Accessibility requirements above remain acceptance targets, not a claim of a completed accessibility audit.
- With exactly six participants, the planner correctly makes no bench exchanges and preserves the five field positions, but the timeline and next-round display can still show interval rounds with zero substitutions. This is a known labeling gap, not an actual player exchange.
- A missing saved record loads the default setup without a recovery warning. Invalid or unreadable records receive a notice; the app cannot determine whether a missing record was removed or never existed.
- Optimality timeouts, storage eviction, device-clock changes, and suspended-browser alerts remain explicit limits rather than silently relaxed fairness or recovery promises.

## Out of Scope

- Rotating the goalkeeper or balancing goalkeeper minutes with field-player minutes.
- Short-handed games with fewer than six participants.
- Changing the squad, goalkeeper, formation, interval, or swap count after kickoff.
- Injuries, late arrivals, early departures, and automatic replanning during play.
- Manual position overrides or preferred-position profiles.
- Actual substitution confirmation and verified actual-minute tracking.
- Pausing a running half, added time, extra time, or alternative match durations.
- Accounts, cloud player storage, shared coaching access, and cross-device synchronization.
- Coach-editable saved season-roster databases, historical games, cumulative fairness or guaranteed starter alternation, exports, payments, and public player profiles. The bundled default squad is explicitly in scope.
- Languages other than Spanish in the first version.
- Guaranteed alerts while suspended or closed, or recovery after browser data is removed.

## Future Considerations

- In-game availability changes and replanning while preserving already played minutes.
- Confirmed substitutions and actual participation tracking.
- Optional goalkeeper rotation, additional match formats, and coach-directed position changes.
- Optional historical fairness and carefully governed sharing, only after separate privacy and product approval.
- Assess device-clock changes and unusually large squads during technical design; material limits or changes to the accepted behavior require product review.
