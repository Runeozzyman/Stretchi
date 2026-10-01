# Stretchi

Stretchi is an agent built with Vercel's Eve framework, directed to give users movements and exercises to help relieve any pains they may have. It asks a set of initial intake questions, screens for reasons to stop the session, and then prescribes one catalog movement at a time.

If something sounds like it needs a doctor, Stretchi says so and stops. Otherwise it walks you through one movement, then waits to hear how that one felt before offering another. It will not diagnose you, and it is not a stand-in for a physiotherapist. It is a careful session you can start when you have a few minutes and want to help manage or relieve some of the pain you're feeling.

## Supported Target Areas

Currently, Stretchi supports guidance for movements in the following target areas:
- Neck
- Back
- Shoulder
- Elbow
- Wrist
- Hands
- Hip
- Glutes
- Hamstrings
- Knee
- Calves
- Ankle
- Feet

## Session flow

1. **Intake.** Stretchi learns where the pain is, how long it has lasted, what equipment is available, and how much time they have. It also asks about a recent injury or health change. It asks only for what it does not already know, one question at a time.
2. **Safety check.** Before any exercise, it screens for reasons to stop, including an emergency, worsening pain, recent surgery, or a new diagnosis. If it finds one, it gives no exercises and ends the session.
3. **Exercises.** It chooses a short routine from the time they have, then gives one movement and waits. It continues only if they want another, and it never gives more than four exercises.
4. **Close.** It offers to save the routine. Saving is not available yet.

![Stretchi Session Flow](docs/stretchi-diagram.png)

## Layout

- `stretchi/agent/instructions.md` — identity, hard rules, and session order
- `stretchi/agent/skills/` — `intake`, `check-redflags`, and `prescribe-routine`
- `stretchi/agent/tools/fetch-exercise-from-intake.ts` — GraphQL catalog lookup, limited to catalog slugs
- `stretchi/evals/` — intake continuity, red-flag refusal, catalog lookup, and off-topic refusal

The exercise catalog is served by a separate GraphQL backend. This agent calls it with `GRAPHQL_SERVER_URL`.

## Run

From `stretchi/`:

```bash
npm run dev
npx eve eval
```

`npm run dev` opens a local session. `npx eve eval` runs the suite. Pass an eval id to run one case, for example `npx eve eval intake/no-repeated-questions`. Set `OPENAI_API_KEY` and `GRAPHQL_SERVER_URL` in `stretchi/.env.local`. Eval judging uses that OpenAI key.
