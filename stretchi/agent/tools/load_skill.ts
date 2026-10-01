import {defineTool} from "eve/tools";
import {loadSkill} from "eve/tools/load_skill";
import {prescribeRoutineLoaded} from "../lib/prescribe-routine-loaded";

export default defineTool({
    ...loadSkill,
    async execute(input, ctx) {
        const result = await loadSkill.execute(input, ctx);
        if ((input as {skill?: string}).skill === "prescribe-routine") {
            prescribeRoutineLoaded.update(() => true);
        }
        return result;
    },
});
