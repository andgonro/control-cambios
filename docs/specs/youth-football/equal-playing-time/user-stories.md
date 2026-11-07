# User Stories: Equal Playing Time

These stories reflect the current local implementation and approved follow-up changes. Acceptance checkboxes remain a verification checklist, not a claim that every criterion has been audited on physical devices or is already deployed. See [spec.md](spec.md) for the exact default roster, technical limits, and known gaps.

## US-1: Set Up the Game Participants and Goalkeeper

As a youth-football coach, I want to start from my editable default squad, adjust who is attending, and select the goalkeeper, so that setup is quick and calculations reflect this game's actual participants.

### Acceptance Criteria

- [ ] I can enter nicknames and shirt numbers without supplying other player identity details.
- [ ] First visits and fresh games start with the ten nicknames and shirt numbers in the specification's Default Squad table, in the specified order, without treating ten as a maximum.
- [ ] A non-empty saved squad is recovered unchanged rather than overwritten with defaults; a saved empty pregame setup receives the defaults.
- [ ] Editing or removing a default player changes only the current game, not the default template used for the next new game.
- [ ] I can add, remove, and edit participants before kickoff, including squads smaller or larger than ten.
- [ ] I cannot start with fewer than six participants.
- [ ] I select exactly one participating goalkeeper before a plan is calculated.
- [ ] No goalkeeper or rotation plan is preselected when a fresh game starts.
- [ ] The goalkeeper stays in goal throughout the plan and is excluded from the field-player fairness comparison.
- [ ] Children with the same nickname remain distinct in the lineup and minute totals.
- [ ] With exactly six children, the five field players play throughout and there are no bench swaps.

## US-2: Choose Formation and Exchange Settings

As a coach, I want to choose a formation, swap count, and interval, so that the schedule fits how I want to run the game.

### Acceptance Criteria

- [ ] I can choose two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; or three defenders, one midfielder, and one forward.
- [ ] I choose the interval with separate whole-minute and whole-second fields; minutes are nonnegative, seconds are from zero to fifty-nine, and the combined duration is positive.
- [ ] Entering six minutes and fifteen seconds schedules 375-second rounds and displays 06:15, without asking me to calculate decimal minutes.
- [ ] Zero duration, fractional input components, negative values, and seconds of sixty or more are rejected with a clear explanation.
- [ ] Previously saved durations are preserved: a legacy 6.15-minute value is shown as six minutes and nine seconds, not reinterpreted as six minutes and fifteen seconds.
- [ ] I can choose an exact whole-number exchange count that fits both the bench and the five field places.
- [ ] Four children on the bench do not force four-player exchanges; I can choose two exchanges every five minutes.
- [ ] An invalid interval or exchange count produces a clear explanation and prevents kickoff until corrected.
- [ ] If the interval produces no substitutions before full time, the preview explicitly shows that consequence and the resulting minutes.

## US-3: Review the Fairest Feasible Plan

As a coach, I want to inspect a fair plan and each child's minutes before kickoff, so that I understand and can explain any unavoidable differences.

### Acceptance Criteria

- [ ] Every segment has five distinct field players and the selected goalkeeper, with all other participants on the bench.
- [ ] The plan minimizes the difference between the greatest and least total field-player minutes under my selected settings.
- [ ] After finding the best achievable final minute difference, the app tries to reduce cumulative minute imbalance at scheduled rounds, so a recently substituted player is not sent back to the bench early while others continue building a larger lead.
- [ ] Improving cumulative balance during the game never worsens the best achievable final minute difference.
- [ ] If the short in-game-balance optimization cannot find a feasible improvement, the app still provides the proven best-final-minute plan.
- [ ] The app does not silently change the interval or exact swap count to obtain a better balance.
- [ ] Each round exchanges exactly the chosen number of field players with the same number of substitutes.
- [ ] The goalkeeper never enters the substitution pool.
- [ ] The preview shows each child's planned minutes, the goalkeeper separately, and the remaining field-player minute difference.
- [ ] Minutes reflect segment lengths, including shorter final segments, rather than only appearance counts.
- [ ] Continuing field players retain their positions at each exchange. Incoming players fill only the positions vacated by outgoing players, favoring variety among those vacancies without changing the best achievable minute balance.
- [ ] A calculation that cannot prove optimality within the twenty-five-second solver limit reports a clear failure instead of presenting an unproven plan as the best possible result.

## US-4: Change Settings and Recalculate Before Kickoff

As a coach, I want to adjust any planning choice before the game starts, so that I can respond to attendance or tactical changes without starting a new game.

### Acceptance Criteria

- [ ] Before kickoff I can change participants, goalkeeper, formation, interval, and swap count.
- [ ] I can select a different goalkeeper before recalculating; only the newly selected goalkeeper is excluded from field-player balancing.
- [ ] Changing any planning input makes an old calculation visibly outdated until recalculation is complete.
- [ ] Recalculation updates all lineups, the timeline, bench assignments, individual minutes, and fairness difference together.
- [ ] Every successful recalculation makes a new random draw of the starting field players while retaining my selected keeper and settings; repeats remain possible by chance.
- [ ] I can cancel an in-progress calculation. Changing a planning input cancels or invalidates its pending result so an old result cannot replace the current settings.
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
- [ ] Inspecting the lineup after an exchange shows continuing children in the same named positions as before the exchange, with substitutes occupying the vacated positions.
- [ ] Pitch labels and essential controls remain readable on a phone without overlapping.

## US-6: Run the Two Halves with Correct Substitution Timing

As a coach, I want the match clock and exchange schedule to respect halftime, so that the displayed lineup remains predictable.

### Acceptance Criteria

- [ ] I start the first half manually, and its continuous twenty-five-minute clock stops automatically at halftime.
- [ ] I start the second half manually, and its continuous twenty-five-minute clock stops automatically at full time.
- [ ] There is no pause control during a half, and halftime contributes no playing minutes.
- [ ] With ten-minute intervals, swaps occur at first-half minutes ten and twenty and second-half minutes five and fifteen.
- [ ] With five-minute intervals, a round due at the end of the first half is pending during halftime and takes effect once at second-half kickoff.
- [ ] With a 06:15 interval, rounds are at total playing times 06:15, 12:30, 18:45, 25:00, 31:15, 37:30, and 43:45; the 25:00 round waits for the second-half start.
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
- [ ] Refreshing does not redraw starters or change saved position assignments, minute totals, or the next round.
- [ ] A saved minute-and-second duration restores to the same two input values without changing its scheduled seconds.
- [ ] A running half does not pause merely because I background or close the browser.
- [ ] Returning restores the scheduled lineup and estimated minutes for elapsed play, including rounds missed while inactive.
- [ ] A first-half interruption extending beyond its end restores halftime, not an automatically started second half.
- [ ] A second-half interruption extending beyond its end restores full time without counting extra minutes.
- [ ] Recovery preserves whether the halftime round is still pending or has already taken effect.
- [ ] The recovered display does not imply that actual substitutions were verified.
- [ ] If an existing record is invalid or local storage cannot be read, I receive a clear message and a fresh default setup rather than invented match progress.
- [ ] If there is no saved record, I get the normal default setup; the app does not claim to know whether the browser data was cleared or this is my first visit.
- [ ] The app does not promise alerts while the browser is suspended or closed.

## US-9: Continue Offline

As a coach, I want the loaded app to work without a connection, so that unreliable pitch-side internet does not interrupt the game.

### Acceptance Criteria

- [ ] After initial online loading and completed offline preparation, I can see that the app is ready for offline use.
- [ ] Losing the connection does not prevent viewing the plan, running a half, or advancing scheduled exchanges.
- [ ] Refreshing offline restores the app and current game when the necessary local resources and game data remain available.
- [ ] Offline recovery preserves the manual second-half start and the halftime boundary.
- [ ] No account, separate installation, or server connection is required to continue an offline-ready game.
- [ ] Automated offline scenarios cover Chromium and WebKit phone emulation. Physical iPhone Safari and Android Chrome validation is tracked separately and is not implied by those results.

## US-10: Keep One Local Game and Start Fresh Explicitly

As a coach, I want my game edits and progress to remain only in my browser until I start a new game, so that recovery is possible without creating a stored team history or uploading participation records.

### Acceptance Criteria

- [ ] Player identity details are limited to nicknames and shirt numbers. User-entered game edits and progress are not uploaded to servers, analytics, or diagnostic reports.
- [ ] I understand that the coach-approved default names and numbers are included in the public source and downloaded app; this does not make my local attendance edits or game progress public.
- [ ] The app requires no account and provides no cloud synchronization or shared access.
- [ ] The completed game remains locally recoverable after full time until I choose New Game.
- [ ] Choosing New Game requires confirmation, removes the previous edits, assignments, schedule, and progress, clears unfinished player-entry fields, and restores the default squad and settings with no keeper selected.
- [ ] No previous-game history, season roster, or hidden prior-game backup is retained by the application.
- [ ] The app explains that others using the same browser may access the local game and that browser-data deletion or private browsing may prevent recovery.
- [ ] My phone and computer have independent saved games. Updates between tabs on the same browser origin do not imply cross-device or cloud synchronization.

## US-11: Use a Spanish Phone-First Interface

As a coach using a phone beside the pitch, I want clear Spanish controls and readable match information, so that I can check the game quickly.

### Acceptance Criteria

- [ ] Labels, positions, validation messages, clock states, recovery messages, and privacy notices are in Spanish.
- [ ] Essential actions have large touch targets and accessible names.
- [ ] Contrast and focus states support readability, and meaning does not depend on color alone.
- [ ] Setup and match use do not require drag-and-drop.
- [ ] The pitch, bench, totals, and controls do not overlap or hide essential text on supported phones.
- [ ] The layout remains usable on larger screens.
- [ ] The minute, second, and swap-count fields align on desktop and phone layouts; the visible `min` and `s` labels do not shift the input row or overlap the calculation controls.
- [ ] If recalculation is not immediate, progress is apparent and kickoff remains unavailable until the current plan is ready.

## US-12: Draw a Fair Random Starting Lineup

As a coach, I want each calculation to draw the starting field players randomly, so that roster order does not always determine who starts or finishes when the settings are unchanged.

### Acceptance Criteria

- [ ] The selected full-game goalkeeper is excluded from the draw.
- [ ] Five distinct eligible children start on the field, with all other field players on the bench.
- [ ] Different controlled random draws can produce different starters and finishers while retaining the same optimal minute difference and exact exchange counts.
- [ ] The draw does not reorder my displayed squad or silently change the keeper, formation, interval, or swap count.
- [ ] A no-substitution game also draws its starting five when more than five field players are available.
- [ ] With exactly six total participants, all five field players play; randomness cannot create different starting membership when there is no bench.
- [ ] Random draws can repeat, and there is no claim of guaranteed alternation or historical fairness across games.
- [ ] Reloading an existing plan preserves the original draw until I explicitly recalculate before kickoff.

## US-13: Keep Continuing Players in Position

As a coach, I want substitutions to leave continuing players in their existing positions, so that children do not need to reorganize the entire field at every exchange.

### Acceptance Criteria

- [ ] At each exchange, every child present in both adjacent field lineups keeps the same position index and named position.
- [ ] Incoming children occupy exactly the positions vacated by outgoing children.
- [ ] Position variety is considered only when assigning incoming children among the available vacancies.
- [ ] A zero-substitution round does not move the five field players between positions.
- [ ] When all five field players are exchanged, every field position is available for incoming-player assignment.
- [ ] Position continuity does not alter field-player totals, the best achievable minute gap, exchange times, or the fixed goalkeeper.
- [ ] The pitch preview, live schedule, and saved/recovered plan use the same assignments. Previously saved plans are not silently rewritten; the updated rule applies when a plan is calculated again.

## US-14: Open the App from My Phone

As a coach, I want a stable HTTPS link to the app, so that I can use it from my phone without running a development server on my computer.

### Acceptance Criteria

- [ ] I can open https://andgonro.github.io/control-cambios/ as the SPA on my phone without a user account or mandatory installation.
- [ ] Application assets, the icon, manifest start URL, and offline service-worker scope work under `/control-cambios/`.
- [ ] After a successful first load and offline preparation, the hosted app can refresh and recover the same browser's game offline, subject to browser storage limits.
- [ ] The repository is public by explicit coach approval, including the bundled default nicknames and numbers; user-entered game changes remain local.
- [ ] Pushing `main` or manually starting the deployment workflow runs unit tests and the production build before deploying to Pages. Browser tests remain a separate validation step.
- [ ] Local changes do not become live until committed, pushed, and successfully deployed. Normal local development still uses the root path.
