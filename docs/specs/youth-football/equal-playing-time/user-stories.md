# User Stories: Equal Playing Time

## US-1: Set Up the Game Participants and Goalkeeper

As a youth-football coach, I want to enter the children attending this game and select its goalkeeper, so that calculations reflect the actual squad rather than an assumed team of ten.

### Acceptance Criteria

- [ ] I can enter nicknames and shirt numbers without supplying other player identity details.
- [ ] I can add, remove, and edit participants before kickoff, including squads smaller or larger than ten.
- [ ] I cannot start with fewer than six participants.
- [ ] I select exactly one participating goalkeeper before a plan is calculated.
- [ ] The goalkeeper stays in goal throughout the plan and is excluded from the field-player fairness comparison.
- [ ] Children with the same nickname remain distinct in the lineup and minute totals.
- [ ] With exactly six children, the five field players play throughout and there are no bench swaps.

## US-2: Choose Formation and Exchange Settings

As a coach, I want to choose a formation, swap count, and interval, so that the schedule fits how I want to run the game.

### Acceptance Criteria

- [ ] I can choose two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; or three defenders, one midfielder, and one forward.
- [ ] I can choose a positive substitution interval instead of being restricted to the ten-minute example.
- [ ] I can choose an exact whole-number exchange count that fits both the bench and the five field places.
- [ ] Four children on the bench do not force four-player exchanges; I can choose two exchanges every five minutes.
- [ ] An invalid interval or exchange count produces a clear explanation and prevents kickoff until corrected.
- [ ] If the interval produces no substitutions before full time, the preview explicitly shows that consequence and the resulting minutes.

## US-3: Review the Fairest Feasible Plan

As a coach, I want to inspect a fair plan and each child's minutes before kickoff, so that I understand and can explain any unavoidable differences.

### Acceptance Criteria

- [ ] Every segment has five distinct field players and the selected goalkeeper, with all other participants on the bench.
- [ ] The plan minimizes the difference between the greatest and least total field-player minutes under my selected settings.
- [ ] The app does not silently change the interval or exact swap count to obtain a better balance.
- [ ] Each round exchanges exactly the chosen number of field players with the same number of substitutes.
- [ ] The goalkeeper never enters the substitution pool.
- [ ] The preview shows each child's planned minutes, the goalkeeper separately, and the remaining field-player minute difference.
- [ ] Minutes reflect segment lengths, including shorter final segments, rather than only appearance counts.
- [ ] Position variety is automatic and secondary to the best achievable minute balance, without manual position overrides.

## US-4: Change Settings and Recalculate Before Kickoff

As a coach, I want to adjust any planning choice before the game starts, so that I can respond to attendance or tactical changes without starting a new game.

### Acceptance Criteria

- [ ] Before kickoff I can change participants, goalkeeper, formation, interval, and swap count.
- [ ] I can select a different goalkeeper before recalculating; only the newly selected goalkeeper is excluded from field-player balancing.
- [ ] Changing any planning input makes an old calculation visibly outdated until recalculation is complete.
- [ ] Recalculation updates all lineups, the timeline, bench assignments, individual minutes, and fairness difference together.
- [ ] I cannot start with invalid settings, an incomplete calculation, or an outdated plan.
- [ ] Starting the first half locks all planning settings for that game.

## US-5: Inspect Positions Throughout the Game

As a coach, I want to see where every child is scheduled to be at any point, so that I can organize the pitch and bench confidently.

### Acceptance Criteria

- [ ] The pitch names each occupied position and identifies its assigned child.
- [ ] The bench identifies all participants who are not currently scheduled on the pitch.
- [ ] I can inspect the complete rotation timeline across both halves, not just the next substitution.
- [ ] Inspecting a future or past segment does not alter the live clock or current game state.
- [ ] Positions remain consistent within a segment and change automatically only at scheduled boundaries.
- [ ] Pitch labels and essential controls remain readable on a phone without overlapping.

## US-6: Run the Two Halves with Correct Substitution Timing

As a coach, I want the match clock and exchange schedule to respect halftime, so that the displayed lineup remains predictable.

### Acceptance Criteria

- [ ] I start the first half manually, and its continuous twenty-five-minute clock stops automatically at halftime.
- [ ] I start the second half manually, and its continuous twenty-five-minute clock stops automatically at full time.
- [ ] There is no pause control during a half, and halftime contributes no playing minutes.
- [ ] With ten-minute intervals, swaps occur at first-half minutes ten and twenty and second-half minutes five and fifteen.
- [ ] With five-minute intervals, a round due at the end of the first half is pending during halftime and takes effect once at second-half kickoff.
- [ ] When no round is due at halftime, the lineup carries through the break unchanged.
- [ ] No exchange occurs at full time, even if a substitution interval ends at that instant.
- [ ] Repeated start actions or recovery do not duplicate a round or start the second half automatically.

## US-7: Follow the Automatic Live Schedule

As a coach, I want automatic lineup updates and clear upcoming exchanges, so that I can follow the plan without confirming every swap on my phone.

### Acceptance Criteria

- [ ] During play I can see the half, clock, scheduled pitch lineup, bench, next exchange time, and incoming and outgoing children.
- [ ] The scheduled exchange updates the lineup and elapsed minute estimates without requiring confirmation.
- [ ] Totals are explicitly described as schedule-based estimates, not verified actual minutes played.
- [ ] A late physical substitution does not falsely become a recorded confirmed event.
- [ ] At halftime, the clock is stopped and the second-half start is available.
- [ ] At full time, accumulation stops and the final estimated totals remain available.
- [ ] In-game participant changes, goalkeeper changes, formation changes, manual position overrides, and interval or count edits are unavailable.

## US-8: Recover After Refresh or Browser Interruption

As a coach, I want the current game to recover on my device, so that refreshing or leaving the browser does not require setting it up again.

### Acceptance Criteria

- [ ] Refreshing restores entered participants, settings, the existing plan, and the correct match phase when local data is available.
- [ ] A running half does not pause merely because I background or close the browser.
- [ ] Returning restores the scheduled lineup and estimated minutes for elapsed play, including rounds missed while inactive.
- [ ] A first-half interruption extending beyond its end restores halftime, not an automatically started second half.
- [ ] A second-half interruption extending beyond its end restores full time without counting extra minutes.
- [ ] Recovery preserves whether the halftime round is still pending or has already taken effect.
- [ ] The recovered display does not imply that actual substitutions were verified.
- [ ] If local data was removed or cannot be recovered, I receive a clear message rather than invented game progress.
- [ ] The app does not promise alerts while the browser is suspended or closed.

## US-9: Continue Offline

As a coach, I want the loaded app to work without a connection, so that unreliable pitch-side internet does not interrupt the game.

### Acceptance Criteria

- [ ] After initial online loading and completed offline preparation, I can see that the app is ready for offline use.
- [ ] Losing the connection does not prevent viewing the plan, running a half, or advancing scheduled exchanges.
- [ ] Refreshing offline restores the app and current game when the necessary local resources and game data remain available.
- [ ] Offline recovery preserves the manual second-half start and the halftime boundary.
- [ ] No account, separate installation, or server connection is required to continue an offline-ready game.
- [ ] Offline behavior is validated on current iPhone Safari and Android Chrome before release.

## US-10: Keep One Local Game and Start Fresh Explicitly

As a coach, I want player details to remain only on my device until I start a new game, so that recovery is possible without creating a stored team history.

### Acceptance Criteria

- [ ] Player details are limited to nicknames and shirt numbers and are not sent to servers, analytics, or diagnostic reports.
- [ ] The app requires no account and provides no cloud synchronization or shared access.
- [ ] The completed game remains locally recoverable after full time until I choose New Game.
- [ ] Choosing New Game removes the old participants, assignments, schedule, and progress before fresh entry.
- [ ] No previous-game history, season roster, or hidden prior-game backup is retained by the application.
- [ ] The app explains that others using the same browser may access the local game and that browser-data deletion or private browsing may prevent recovery.

## US-11: Use a Spanish Phone-First Interface

As a coach using a phone beside the pitch, I want clear Spanish controls and readable match information, so that I can check the game quickly.

### Acceptance Criteria

- [ ] Labels, positions, validation messages, clock states, recovery messages, and privacy notices are in Spanish.
- [ ] Essential actions have large touch targets and accessible names.
- [ ] Contrast and focus states support readability, and meaning does not depend on color alone.
- [ ] Setup and match use do not require drag-and-drop.
- [ ] The pitch, bench, totals, and controls do not overlap or hide essential text on supported phones.
- [ ] The layout remains usable on larger screens.
- [ ] If recalculation is not immediate, progress is apparent and kickoff remains unavailable until the current plan is ready.