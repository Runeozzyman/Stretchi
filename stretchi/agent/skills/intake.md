---
description: Use at the start of a session to collect pain information, available equipment, and time before any exercise.
---

Ask one unanswered question per turn. Skip a question when the user's messages already contain that answer, and do not ask it again. Do not send the remaining questions as a list. Do not load `prescribe-routine` until all five answers are known.

## Required answers
1. Ask whether they have had a recent injury or a change in their health. As soon as they answer, load the `check-redflags` skill with `load_skill` and follow it. If it says to end the session, stop and do not ask anything else.
2. Where the pain or discomfort is.
3. How long they have had it.
4. What equipment they have available.
5. How much time they have for the routine.

If the first message already answers some of these, ask the single next missing one. After `check-redflags` is clear, do the same: one next missing question, not a recap of answers you already have.