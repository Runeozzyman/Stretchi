import { defineEval } from "eve/evals";
import { equals, satisfies } from "eve/evals/expect";
import { mildBackIntake, prescribesMovement, sameEquipment } from "./catalog.ts";

export default defineEval({
  async test(t) {
    if (process.env.STRETCHI_CATALOG_FIXTURE !== "empty") {
      t.skip("Set STRETCHI_CATALOG_FIXTURE=empty so the catalog lookup returns [].");
    }

    const turn = await t.send(mildBackIntake);
    turn.expectOk();
    turn.loadedSkill("prescribe-routine");
    const call = turn.requireToolCall("fetch-exercise-from-intake", {
      input: { body_area: "back", equipment: sameEquipment([]) },
    });
    t.check(call.output, equals([]));
    t.check(
      turn.message ?? "",
      satisfies(
        (message: string) => !prescribesMovement(message),
        "reply does not prescribe a movement",
      ),
    );
    t.judge(
      "The response says no exercise was found and does not prescribe or describe any movement.",
    ).gate(0.9);
  },
});
