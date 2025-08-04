import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Define the A2A agent base URL from environment variables
const A2A_AGENT_BASE_URL = process.env.A2A_AGENT_BASE_URL || "http://localhost:10001"

export async function POST(request: Request) {
  try {
    const { messages, sessionId: clientSessionId } = await request.json()

    const lastUserMessage = messages[messages.length - 1]?.content

    if (!lastUserMessage) {
      return NextResponse.json({ message: "No user message found." }, { status: 400 })
    }

    // Get headers from the incoming request
    const authorizationHeader = request.headers.get("Authorization")
    const xProfileIdHeader = request.headers.get("X-Profile-ID") // Assuming this is passed from client

    // Generate a session ID if not provided by the client, or use the client's session ID
    const sessionId = clientSessionId || uuidv4()

    // Prepare headers for the A2A agent request
    const agentHeaders: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (authorizationHeader) {
      agentHeaders["Authorization"] = authorizationHeader
    }
    if (xProfileIdHeader) {
      agentHeaders["X-Profile-ID"] = xProfileIdHeader
    }

    // Construct the payload for the A2A agent
    // The Python script uses `connector.send_task(message=prompt, session_id=session_id)`
    // We'll assume the agent has a /message or /chat endpoint that accepts this structure.

    // const agentPayload = {
    //   message: lastUserMessage,
    //   session_id: sessionId,
    // }
const agentPayload = {
      jsonrpc: "2.0",
      method: "send_task", // Inferred method name from Python's AgentConnector.send_task
      params: {
        message: lastUserMessage,
        session_id: sessionId,
      },
      id: uuidv4(), // Unique request ID for JSON-RPC
    }
    console.log("Forwarding request to A2A agent:", `${A2A_AGENT_BASE_URL}/`)
    console.log("Agent Headers:", agentHeaders)
    console.log("Agent Payload:", agentPayload)

    // Make the request to the A2A agent
    const agentResponse = await fetch(`${A2A_AGENT_BASE_URL}/`, {
      method: "POST",
      headers: agentHeaders,
      body: JSON.stringify(agentPayload),
      // Consider adding a timeout if the agent can be slow
      // signal: AbortSignal.timeout(300000) // 5 minutes timeout, similar to Python's 300.0
    })

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text()
      console.error("A2A Agent responded with an error:", agentResponse.status, errorText)
      return NextResponse.json({ message: `Agent error: ${errorText}` }, { status: agentResponse.status })
    }

    const agentData = await agentResponse.json()
    console.log("A2A Agent Response:", agentData)

    // Return the agent's response to the frontend
    return NextResponse.json({ message: agentData.response || "No response from agent." })
  } catch (error) {
    console.error("Error in /api/agent:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
