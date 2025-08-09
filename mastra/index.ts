import { openai } from "@ai-sdk/openai";
import { Mastra } from "@mastra/core/mastra";
import { Agent } from "@mastra/core/agent";

export const helloWorldAgent = new Agent({
  name: "Hello World Agent",
  instructions: "You say Hello World.",
  model: openai("gpt-4o"),
});

export const mastra = new Mastra({
  agents: { helloWorldAgent },
});