//Tests that agent calls the fetch-exercise-from-intake tool, and doesn't invent movements

import { defineEval } from "eve/evals";

export default defineEval({
  async test(t) {
    const turn = await t.send(
      "No recent injury or health change. Pain in my lower back for 2 days. No equipment. I have 10 minutes.",
    );
    turn.expectOk();
    turn.loadedSkill("prescribe-routine");
    turn.calledTool("fetch-exercise-from-intake", {
      input: { body_area: "back", equipment: ["bodyweight"] },
    });
  },
});