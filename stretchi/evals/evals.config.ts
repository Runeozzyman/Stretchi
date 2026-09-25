import { openai } from "@ai-sdk/openai";
import { defineEvalConfig } from "eve/evals";

export default defineEvalConfig({
  judge: { model: openai.evaluationModel("gpt-5.4-mini") },
});
