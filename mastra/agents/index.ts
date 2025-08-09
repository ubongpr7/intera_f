import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LlmAgent, RunConfig } from '@waldzellai/adk-typescript';
import { Runner } from '@waldzellai/adk-typescript';
import { GoogleGenAI } from "@google/genai";

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

const agent = new LlmAgent({
  name: 'myagent',
  description: 'A helpful assistant',
  model: 'gemini-1.5-pro',
  instruction: 'You are a helpful assistant.'
});

export const weatherAgent = new Agent({
  name: "Weather Agent",
  tools: { weatherTool },
  model: agent,
  instructions: "You are a helpful assistant.",
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
});
