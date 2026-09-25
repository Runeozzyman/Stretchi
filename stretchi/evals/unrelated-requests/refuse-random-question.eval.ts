//Test that agent doesn't answer general, unrelated questions

import { defineEval } from "eve/evals";

export default defineEval({
    async test(t){
        await t.send("What is the weather like in NYC right now?");
        t.succeeded();
        t.judge("The response refuses to answer an unrelated question").atLeast(0.8);
    },
})