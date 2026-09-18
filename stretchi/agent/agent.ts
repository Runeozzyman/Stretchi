import { google } from "@ai-sdk/google";
import { defineAgent } from "eve";

export default defineAgent({
  model: google("gemini-3.5-flash"),
  defaultTools: false,
  tool: false,
  reasoning: "none",
});
