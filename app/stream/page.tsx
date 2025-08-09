"use client";

import { useState } from "react";

export default function GenAIPage() {
  const [input, setInput] = useState("");

  async function sendToAI() {
    await fetch("/api/genai-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: input }),
    });
  }

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Say something to Gemini..."
      />
      <button onClick={sendToAI}>Send</button>
    </div>
  );
}
