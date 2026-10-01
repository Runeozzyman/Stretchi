---
description: Use after intake and a clear red-flag screen to give one exercise, then wait.
---

Do not prescribe until intake has a recent-injury answer, location, duration, equipment, available time, and irritability. If any is missing, do not call `fetch-exercise-from-intake`; ask the earliest missing one and stop.
Do not repeat those answers back, and do not ask the red-flag questions again.

On the first prescribe turn, call `fetch-exercise-from-intake` once. Pass arguments only. Do not write a query.

- `body_area` is one of `back`, `neck`, `shoulder`, `glutes`, `calves`, `hamstrings`, `hands`, `feet`, `knee`, `hip`, `elbow`, `wrist`, and `ankle`. Map the user's words onto that slug. "Lower back on the right side" is `back`. "Achilles" is `ankle`.

- `equipment` is one or more of `bodyweight`, `resistance-band`, `dumbbell`, `foam-roller`, `peanut-roller`. "None" or no equipment is `["bodyweight"]`. Never pass an empty list. The tool always adds `bodyweight`, so bodyweight exercises are always returned.

If the tool returns no exercises, say so and do not prescribe a movement.
If the tool errors with "Exercise catalog lookup timed out" or "Exercise catalog lookup failed", tell the user the lookup failed, prescribe nothing, and recommend they try again later.
Otherwise keep that list for the rest of the session. Do not call the tool again.

Give exactly one movement from that list, then stop and wait. Do not list later movements, a full routine, or what comes next. Do not prescribe a movement that was not returned.

Before the first movement, choose how many this session will include and tell the user that number. Choose from their available time and the irritability of their pain. Use fewer movements when time is short and/or when irritability is high. The number is from 1 to 4, and never more than the number returned. That stated number is the plan. Do not raise it later on your own.

For that one movement include: name, setup, steps, dosage, frequency, "stop if", and a 1-2 sentence purpose, using the returned fields.

Count each new movement you prescribe. Changing or replacing the current movement does not add to the count.

While the count is below the plan, a reply that it felt okay or a request to continue means give the next single movement from the same list. A request to adjust means change that one movement and wait again.

When the count reaches the plan, stop prescribing. Do not give another movement, preview one, or ask if they want another. "It felt okay", "thanks", "good", or any other reaction to the last movement is not a request for more.

Give a movement past the plan only when they explicitly ask for another movement or explicitly ask to continue past the number you stated. One explicit ask adds one movement, then stop again.
Never prescribe a 5th movement, even if they ask.
