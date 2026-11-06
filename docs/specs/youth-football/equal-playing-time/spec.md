# Spec: Equal Playing Time

## Overview

Provide a Spanish-language, phone-first football rotation planner for a coach of seven-year-old children. Each game has five field players and one fixed goalkeeper, two twenty-five-minute halves, and a variable number of participants. The coach chooses the field-player swap count and interval, reviews a fair rotation plan, and follows an automatic live schedule.

Equal playing time applies only to the non-goalkeeper participants in the current game. Live totals represent estimated participation under the schedule, not confirmed actual minutes. Fairness is measured within a game, not across a season.

## Functional Requirements

### Game Setup and Pregame Editing

- FR-1.1: Enter participant nicknames and shirt numbers for each new game. Do not request full names, photographs, dates of birth, contact information, or other player identity details.
- FR-1.2: Allow participants to be added, removed, and edited before kickoff. Support changing attendance between games without a fixed ten-player limit or a persistent season roster.
- FR-1.3: Require at least six participants to start. Identify participants distinctly in the lineup and bench, including when nicknames are the same.
- FR-1.4: Require the coach to select exactly one participating child as goalkeeper before calculating a plan. The selected goalkeeper remains in goal for the entire game and is not included in field-player fairness calculations or substitutions.
- FR-1.5: Offer formations of two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; and three defenders, one midfielder, and one forward.
- FR-1.6: Let the coach choose a positive substitution interval and an exact whole-number swap count. Do not force the coach to exchange the whole bench.
- FR-1.7: With a bench, require at least one player per exchange and reject a count exceeding either the five field places or the available substitutes. With exactly six participants, use no bench substitutions.
- FR-1.8: Permit any otherwise valid interval that produces no substitutions before full time, but explicitly show that result and its effect on minutes before kickoff.
- FR-1.9: Allow the coach to change participants, goalkeeper, formation, interval, and swap count at any time before kickoff and recalculate the complete plan and individual totals.
- FR-1.10: After any planning-relevant change, do not present the previous plan as current. Require a recalculated valid plan before kickoff.
- FR-1.11: Lock participants, goalkeeper, formation, interval, and swap count when the first half starts. Do not offer in-game squad changes or manual position overrides.

### Fairness and Position Assignment

- FR-2.1: Share the five field places among all participating children except the fixed goalkeeper.
- FR-2.2: Among schedules satisfying the selected interval and exact swap count, select a schedule with the smallest achievable difference between the greatest and least total planned field-player minutes over the whole game.
- FR-2.3: Do not silently alter the interval, swap count, goalkeeper, or formation to improve equality.
- FR-2.4: Show each child's planned minutes and clearly disclose the difference between the most and least field-player minutes. Display the goalkeeper separately from that comparison.
- FR-2.5: Pursue variety in field positions as a secondary objective without worsening the best achievable minute difference. Do not promise equal minutes in every position.
- FR-2.6: Assign exactly one child to each of the five named field positions and exactly one child to goal in every planned and live lineup. List every other participant on the bench.
- FR-2.7: At every scheduled exchange, exactly the selected number of field players leave and the same number of bench players enter. Do not substitute the goalkeeper or assign a child to multiple places.
- FR-2.8: Change field-position assignments automatically at rotation boundaries as needed for position variety. Do not change assignments midway through a scheduled segment.

### Match Timing

- FR-3.1: Provide two halves of twenty-five playing minutes each. Halftime does not contribute to any child's playing minutes or to the substitution interval.
- FR-3.2: Start each half only when the coach explicitly starts it. Each half then runs continuously without a pause control and stops automatically at its end.
- FR-3.3: Carry substitution intervals across halftime rather than restarting them. With ten-minute intervals, exchange at first-half minutes ten and twenty and second-half minutes five and fifteen.
- FR-3.4: If a round falls exactly at the end of the first half, keep it pending during halftime and apply it once when the coach starts the second half.
- FR-3.5: Otherwise preserve the lineup across halftime until the next due round. Do not make an additional fairness-driven exchange during the break.
- FR-3.6: Do not perform a substitution at full time, even if an interval ends at that instant.
- FR-3.7: Prevent repeated starts or recovery from applying a halftime exchange or any scheduled round more than once.
- FR-3.8: Never infer a second-half start from elapsed wall-clock time while the coach is away.

### Preview and Live Match View

- FR-4.1: Before kickoff, show the selected formation, all position assignments, bench players, complete substitution timeline, per-player planned minutes, and fairness difference.
- FR-4.2: Allow the coach to inspect the lineup for any scheduled part of the game, including both halves, without losing the live match state.
- FR-4.3: During play, show the current scheduled pitch lineup, bench, half, clock, next substitution time, and incoming and outgoing children.
- FR-4.4: Advance the displayed lineup and estimated minutes automatically at the scheduled times, without requiring substitution confirmation.
- FR-4.5: Clearly distinguish planned totals and estimated elapsed minutes from verified actual participation. Do not label automatic totals as confirmed actual minutes.
- FR-4.6: At halftime, show that play is stopped and offer a deliberate second-half start. At full time, stop all playing-time accumulation and retain the final schedule-based summary.
- FR-4.7: After returning from inactivity, display the correct scheduled lineup and estimated totals, including rounds that elapsed while inactive. Make clear that recovery does not verify physical swaps.
- FR-4.8: Do not promise audible, visible, or timely alerts while the browser is suspended or closed.

### Local Data, Recovery, and New Game

- FR-5.1: Retain a single game locally on the device, including setup, calculated plan, current match phase, and the timing information needed for recovery.
- FR-5.2: Recover the same game after refresh or reopening when browser data remains available. Retain the completed game after full time until the coach starts a new game.
- FR-5.3: Provide an explicit New Game action that clears the previous game's nicknames, numbers, plan, and progress before fresh setup. Do not retain a game history.
- FR-5.4: Do not require accounts, cloud storage, shared access, or transmission of player details to a server.
- FR-5.5: After successful initial online loading and offline preparation, support active-game use and refresh without an internet connection. Show when offline readiness has been achieved.
- FR-5.6: If recovery is unavailable because local data has been cleared or cannot be read, communicate that condition rather than inventing players, minutes, or progress.
- FR-5.7: Recovery during the first half can advance only as far as halftime. Recovery during the second half can advance only as far as full time.

## Technical Requirements

### Scheduling and Consistency

- TR-1.1: Treat the selected participant set, fixed goalkeeper, five field positions, formation, interval, and swap count as the planning inputs. Match duration is fixed at fifty playing minutes in two equal halves for this release.
- TR-1.2: Base fairness on the duration of all field-playing segments, including shorter segments caused by halftime or full time, not on counts of appearances or substitution rounds.
- TR-1.3: Calculate and compare minutes without losing meaningful differences through display rounding. The displayed fairness result must reflect the underlying schedule.
- TR-1.4: Keep preview, live view, timeline, totals, and recovered state consistent with the same calculated plan.
- TR-1.5: Preserve the distinction between the participant's visible nickname and shirt number and their distinct assignment within the game. Duplicate nicknames must not merge children or corrupt totals.
- TR-1.6: Treat local recovery as restoration of the existing game, not as a request to generate a different plan.

### Browser Timing and Offline Operation

- TR-2.1: Recover elapsed time and due rotations after browser throttling, backgrounding, refresh, or reopening rather than relying on every scheduled screen update having executed.
- TR-2.2: Store enough local timing and match-phase information to stop at the correct half boundary and require an explicit second-half start.
- TR-2.3: Prepare the application itself for offline loading as well as preserving game details locally. Availability of local game details alone does not satisfy offline refresh.
- TR-2.4: Do not report offline readiness until the resources required for the specified offline experience are available.
- TR-2.5: Keep the pending halftime round and manual second-half start consistent through refresh and repeated recovery.
- TR-2.6: Do not require a separate installation or an account to satisfy the browser-based experience.

### Privacy and Data Lifecycle

- TR-3.1: Store no player identity details beyond nicknames and shirt numbers. Other locally retained information is limited to the active game's configuration, assignments, plan, and progress.
- TR-3.2: Exclude player details from outgoing requests, addresses, analytics, and diagnostic reports. Ordinary application hosting must not become a player-data collection path.
- TR-3.3: Clear all prior game details when New Game is selected; do not retain hidden histories or backups of that game within the application.
- TR-3.4: Explain local-only retention and its limits, including access by others using the same browser and loss after browser-data deletion, private browsing, or storage eviction.
- TR-3.5: Do not claim that nicknames and numbers make children's data anonymous or establish legal compliance. No jurisdiction-specific legal certification is part of the approved scope.

## Non-Functional Requirements

### Usability and Accessibility

- NFR-1.1: Prioritize one-handed phone use beside a pitch, with large touch controls and readable player assignments.
- NFR-1.2: Keep pitch labels, timeline details, and controls usable without overlap or clipped essential text on phone screens, and remain usable on tablets and desktops.
- NFR-1.3: Use Spanish for all coach-facing controls, position names, errors, timing labels, recovery messages, and privacy notices.
- NFR-1.4: Provide accessible control names, sufficient contrast, visible focus, and alternatives to color-only indications. Do not require drag-and-drop to complete core tasks.
- NFR-1.5: Make setup errors and outdated calculations explicit, with enough context for the coach to correct them.

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

## Out of Scope

- Direct implementation as part of these planning deliverables.
- Rotating the goalkeeper or balancing goalkeeper minutes with field-player minutes.
- Short-handed games with fewer than six participants.
- Changing the squad, goalkeeper, formation, interval, or swap count after kickoff.
- Injuries, late arrivals, early departures, and automatic replanning during play.
- Manual position overrides or preferred-position profiles.
- Actual substitution confirmation and verified actual-minute tracking.
- Pausing a running half, added time, extra time, or alternative match durations.
- Accounts, cloud player storage, shared coaching access, and cross-device synchronization.
- Saved season rosters, historical games, cumulative fairness, exports, payments, and public player profiles.
- Languages other than Spanish in the first version.
- Guaranteed alerts while suspended or closed, or recovery after browser data is removed.

## Future Considerations

- In-game availability changes and replanning while preserving already played minutes.
- Confirmed substitutions and actual participation tracking.
- Optional goalkeeper rotation, additional match formats, and coach-directed position changes.
- Optional historical fairness and carefully governed sharing, only after separate privacy and product approval.
- Assess device-clock changes and unusually large squads during technical design; material limits or changes to the accepted behavior require product review.