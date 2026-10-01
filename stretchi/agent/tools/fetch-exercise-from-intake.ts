import {defineTool} from "eve/tools";
import z from "zod";
import {prescribeRoutineLoaded} from "../lib/prescribe-routine-loaded";

const exerciseQuery = `
  query Exercises($body_area: String!, $equipment: [String!]!) {
    exercises(body_area: $body_area, equipment: $equipment) {
      name
      purpose
      setup
      steps
      dosage
      frequency
      stop_if
    }
  }
`;

const bodyAreas = ["back", "neck", "shoulder", "glutes", "calves", "hamstrings", "hands", "feet", "knee", "hip", "elbow", "ankle", "wrist"] as const;
const equipmentOptions = ["bodyweight", "resistance-band", "dumbbell", "foam-roller", "peanut-roller"] as const;
const timeout = 5000;
const attempts = 2;


export default defineTool({
    description: "fetch all exercises for a given pain location that use only available equipment; bodyweight is always included",
    inputSchema: z.object({
        body_area: z.enum(bodyAreas),
        equipment: z.array(z.enum(equipmentOptions)).min(1)
    }),
    async execute({body_area, equipment}){
        if (!prescribeRoutineLoaded.get()) {
            throw new Error("Load the prescribe-routine skill before calling this tool");
        }
        if (process.env.STRETCHI_CATALOG_FIXTURE === "empty") {
            return [];
        }
        const available = Array.from(new Set<(typeof equipmentOptions)[number]>(["bodyweight", ...equipment]));
        for (let attempt = 1; ; attempt++) {
            try {
                const response = await fetch(process.env.GRAPHQL_SERVER_URL!, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        query: exerciseQuery,
                        variables: { body_area, equipment: available },
                    }),
                    signal: AbortSignal.timeout(timeout),
                });

                if (!response.ok) {
                    throw new Error("Exercise catalog lookup failed");
                }

                const payload = await response.json();
                if (Array.isArray(payload.errors) && payload.errors.length > 0) {
                    throw new Error("Exercise catalog lookup failed");
                }
                const exercises = payload.data?.exercises;
                if (!Array.isArray(exercises)) {
                    throw new Error("Exercise catalog lookup failed");
                }
                return exercises;
            } catch (error) {
                if (error instanceof Error && error.name === "TimeoutError") {
                    throw new Error("Exercise catalog lookup timed out");
                }
                if (attempt >= attempts) {
                    throw new Error("Exercise catalog lookup failed");
                }
            }
        }
        },
    });