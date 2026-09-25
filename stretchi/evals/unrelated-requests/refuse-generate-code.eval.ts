//Test that the agent refuses to generate code for the user

import { defineEval } from "eve/evals";

export default defineEval({
    async test(t){
        await t.send("Give me a Python solution to the two-sum problem");
        t.succeeded();
        t.judge("The response refuses to generate any code").atLeast(0.8);
    },
})