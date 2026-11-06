# Title: Proposal - Equal Playing Time

## Summary

Create a Spanish-language, phone-first web app that helps a coach of seven-year-old footballers plan fair field-player minutes and see who plays in every position throughout a game. Combine an editable pregame rotation plan with an automatic live schedule and recoverable local game data.

## Context

Games are six against six: five field players and one goalkeeper. The squad may have around ten children, but attendance varies and must not be restricted to ten.

The coach currently needs to coordinate substitutions, positions, and equal participation together. A predetermined substitution count and interval can make perfectly equal minutes impossible, so the app must disclose the resulting differences rather than promise equality it cannot deliver.

The coach selects one goalkeeper for the entire game. That child is excluded from field-player minute balancing. The remaining children share the five field places.

The primary stakeholder is the coach using a phone beside the pitch. The children benefit from fair participation and varied field positions. Player information is limited to nicknames and shirt numbers and remains on the coach's device.

## High-Level Approach

- Enter the participants afresh for each game and select the goalkeeper before calculating a plan.
- Allow changes to participants, goalkeeper, formation, substitution interval, and swap count at any time before kickoff, followed by full recalculation. Clearly identify an outdated plan until recalculated.
- Offer formations of two defenders, two midfielders, and one forward; two defenders, one midfielder, and two forwards; one defender, three midfielders, and one forward; or three defenders, one midfielder, and one forward.
- Use two twenty-five-minute halves. Start each half manually, run it continuously, and exclude halftime from playing time.
- Let the coach choose a positive substitution interval and an exact number of field players exchanged per round. Do not equate the swap count with the entire bench.
- Carry substitution timing across halftime. Apply a round due exactly at halftime at second-half kickoff, and do not exchange players at full time.
- Minimize the difference between the greatest and least planned field-player minutes under the chosen settings. Treat position variety as a secondary objective.
- Show a pitch, bench, complete rotation timeline, individual minute totals, and the remaining minute difference before kickoff.
- Lock game settings at kickoff. Automatically advance the live scheduled lineup and show the clock and next substitution.
- Label live participation totals as estimates based on scheduled swaps, not verified actual play.
- Retain one recoverable game locally, including after full time, until the coach explicitly starts a new game and clears the previous details.
- Support offline use and refresh after initial online loading and confirmed offline readiness. Restore the appropriate scheduled state after interruptions without starting the second half automatically.

## Deliverables

- A proposal defining the purpose, scope, limitations, and intended experience.
- A full specification covering setup, fairness, rotation timing, positions, live behavior, privacy, recovery, and quality requirements.
- User stories with acceptance criteria for normal workflows, invalid settings, halftime boundaries, and interrupted sessions.
- A documented first-release boundary that a developer agent can use for implementation.

## Notes

- The workspace was empty at discovery; there are no existing application conventions or integrations to preserve.
- With exactly six participants, the five field players stay on the pitch and there are no bench substitutions.
- A swap cannot exceed the available substitutes or the five field places. Four children on the bench may still rotate two at a time every five minutes.
- A ten-minute interval produces exchanges at first-half minutes ten and twenty and second-half minutes five and fifteen. A five-minute interval also has an exchange due at halftime, applied at second-half kickoff.
- Intervals that produce no exchanges before full time are permitted, but the preview must make that outcome and the unequal minutes visible.
- Formation, squad, goalkeeper, interval, and swap count cannot change after kickoff. Injuries, late arrivals, early departures, and manual position overrides are outside the first release.
- Browser suspension or closure can prevent timely alerts. Recovery restores a schedule, not evidence that real substitutions occurred.
- Local storage may be lost through browser-data deletion, storage eviction, or private browsing. Retention until New Game is not a permanent-storage guarantee.
- Current iPhone Safari and Android Chrome are the mobile targets. Browser-specific offline and recovery behavior still requires implementation validation.
- The coach approved local retention after full time until New Game, replacing the earlier idea of automatic deletion when the game ends.
- There are no accounts, cloud player records, sharing, historical analysis, payments, public profiles, or exports in this release.