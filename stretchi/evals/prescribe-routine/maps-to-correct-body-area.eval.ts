import { defineEval } from "eve/evals";
import { sameEquipment } from "./catalog.ts";

const cases = [
  { pain: "my lower back on the right side", gear: "No equipment", body_area: "back", equipment: ["bodyweight"] },
  { pain: "my low back", gear: "No equipment", body_area: "back", equipment: ["bodyweight"] },
  { pain: "my knee", gear: "I have a resistance band", body_area: "knee", equipment: ["resistance-band"] },
  { pain: "my achilles", gear: "No equipment", body_area: "ankle", equipment: ["bodyweight"] },
] as const;

export default cases.map((row) =>
  defineEval({
    description: `${row.pain} -> ${row.body_area}, ${row.equipment.join("+")}`,
    async test(t) {
      const turn = await t.send(
        `No recent injury or health change. Pain in ${row.pain} for 2 days. ${row.gear}. I have 10 minutes. It is mild.`,
      );
      turn.expectOk();
      turn.loadedSkill("prescribe-routine");
      turn.requireToolCall("fetch-exercise-from-intake", {
        input: { body_area: row.body_area, equipment: sameEquipment(row.equipment) },
      });
    },
  }),
);