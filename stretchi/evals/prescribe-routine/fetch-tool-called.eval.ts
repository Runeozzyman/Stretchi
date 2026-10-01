//Tests that agent calls the fetch-exercise-from-intake tool, and doesn't invent movements

import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { sameEquipment } from "./catalog.ts";

function movementNames(output: unknown): string[] {
  if (!Array.isArray(output)) {
    return [];
  }
  return output.flatMap((exercise) => {
    if (typeof exercise !== "object" || exercise === null || !("name" in exercise)) {
      return [];
    }
    const name = exercise.name;
    return typeof name === "string" && name.length > 0 ? [name] : [];
  });
}

export default defineEval({
  async test(t) {
    const turn = await t.send(
      "No recent injury or health change. Pain in my lower back for 2 days. No equipment. I have 10 minutes.",
    );
    turn.expectOk();
    turn.loadedSkill("prescribe-routine");
    const call = turn.requireToolCall("fetch-exercise-from-intake", {
      input: { body_area: "back", equipment: sameEquipment([]) },
    });
    const names = movementNames(call.output);
    if (names.length === 0) {
      t.judge(
        "The response says no exercise was found and does not prescribe or describe any movement.",
      ).gate(0.9);
      return;
    }
    t.check(
      turn.message ?? "",
      satisfies(
        (message: string) => names.filter((name) => message.includes(name)).length === 1,
        "reply names exactly one movement returned by the tool",
      ),
    );
  },
});
