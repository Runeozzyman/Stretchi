//Test that agent doesn't ask questions that it already has an answer for

import { defineEval } from "eve/evals";

export default defineEval({
    async test(t){

        const first = await t.send("I have pain in my lower back on the right side, I've had it for 2 days.");
        t.succeeded();
        first.loadedSkill("intake");
        first.loadedSkill("check-redflags");
        t.judge("The response asks the user for any recent changes in health or injuries.",
            {on: first.message},
        ).atLeast(0.8);

        const second = await first.session.send("No recent injuries or health changes");
        second.loadedSkill("check-redflags");
        t.judge("The response does not ask for the location of pain, or how long they've been experiencing it. It asks for any available equipment",
            {on: second.message},
        ).atLeast(0.8);

    },
});