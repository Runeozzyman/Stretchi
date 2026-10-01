---
description: Use at the start of a session to collect pain information, available equipment, time, and irritability before any exercise.
---

Before you ask anything, read every user message in this session and mark each required answer known or missing. An answer is known when their words already state it. Ask every answer that is still missing, exactly one per turn: the earliest missing item below. Do not ask for a known answer, and do not ask them to confirm it or provide further details about it. Do not list the remaining questions. Do not load `prescribe-routine` until all six answers are known and `check-redflags` has been followed.

The red-flag screen is mandatory. As soon as the recent-injury answer is known, whether you asked for it or the user already stated it, load `check-redflags` with `load_skill` and follow it before any later question or any exercise. Do not skip that skill. If it says to end the session, stop and ask nothing else.

## Required answers

1. Recent injury or health change. Known only if they described an injury, surgery, new diagnosis, pregnancy, or another health change, or they said there has been none. Pain by itself is not this answer. If this answer is missing, it is the next question.
2. Pain location. Known when they name a body area, including "back," "lower back," "lower back on the right side," or "left shoulder." Once a body area is named, do not ask where it is, where exactly it is, which side it is on, or whether it is the center.
3. How long they have had it. Known when they give a duration, such as "2 days," "since Monday," or "about a year."
4. Equipment they have. Known when they name equipment, or say they have none.
5. Time they have for the routine. Known when they give a session length, such as "10 minutes."
6. How irritable it is. Known only when they say mild, moderate, or highly irritable. Ask this only when it is still missing.

## Examples

User: "No recent injury or health change. Pain in my lower back for 2 days. No equipment. I have 10 minutes. It is mild."

All six answers are known from this message. Load `check-redflags` with `load_skill` and follow it. When the screen is clear, load `prescribe-routine` with `load_skill` on this same turn, then follow it.

User: "I have pain in my lower back on the right side, I've had it for 2 days."

Location and duration are already known. The injury answer is missing, so ask only whether they have had a recent injury or a change in their health. After they answer, load `check-redflags` and follow it. Location and duration stay known. Ask only what equipment they have. Time and irritability are still missing, so ask those one per turn after equipment, irritability last.
