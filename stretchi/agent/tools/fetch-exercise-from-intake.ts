import {defineTool} from "eve/tools";
import z from "zod";

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

export default defineTool({
    description: "fetch all exercises for a given pain location that use only available equipment",
    inputSchema: z.object({
        body_area: z.string(),
        equipment: z.array(z.string()).min(1)
    }),
    async execute({body_area, equipment}){
        const response = await fetch(process.env.GRAPHQL_SERVER_URL!, {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({
                query: exerciseQuery,
                variables: { body_area, equipment },
            }),
        });

        if (!response.ok){
            throw new Error("Exercise request failed")
        }

        const payload = await response.json();
        return payload.data.exercises;

        },
    });