import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

// Load environment variables (use a backend proxy in production to avoid exposing keys)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "your-google-api-key";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "your-tavily-api-key";

// Define the tools for the agent to use
const agentTools = [new TavilySearchResults({ maxResults: 3 })];

// Initialize the Gemini model
const agentModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // or "gemini-1.5-pro" if preferred
  temperature: 0.7,
  apiKey: GOOGLE_API_KEY,
});

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();

// Create the agent using createReactAgent
const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentCheckpointer,
});

// Function to invoke the agent
async function invokeAgent(input: string, threadId: string) {
  try {
    const agentFinalState = await agent.invoke(
      { messages: [new HumanMessage(input)] },
      { configurable: { thread_id: threadId } }
    );

    // Print the latest message content
    console.log(
      agentFinalState.messages[agentFinalState.messages.length - 1].content
    );

    return agentFinalState.messages[agentFinalState.messages.length - 1].content;
  } catch (error) {
    console.error("Error invoking agent:", error);
    throw error;
  }
}

// Example usage
(async () => {
  // Initial message
  await invokeAgent("Hi! I'm using Gemini with langgraph.", "1");

  // Follow-up message in the same thread
  await invokeAgent("What is the current weather in SF?", "1");
})();