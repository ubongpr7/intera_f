import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Define the ChatMessage interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Initialize the LLM with your API key (securely managed)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY as string, // Ensure this is securely handled
});

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');

  const sendMessage = async () => {
    if (!input) return;
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Prepare conversation history
    const fullHistory = [...messages, userMessage].map(msg =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    try {
      const stream = await llm.stream(fullHistory);
      let assistantContent: string = '';
      for await (const chunk of stream) {
        assistantContent += chunk.message.content;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            return prev.map((msg, index) =>
              index === prev.length - 1 ? { ...msg, content: assistantContent } : msg
            );
          } else {
            return [...prev, { role: 'assistant', content: assistantContent }];
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error.' }]);
    }
  };

  return (
    <>
      {/* Icon at bottom right corner */}
      <div className="fixed bottom-5 right-5 cursor-pointer">
        <MessageCircle size={40} className="text-blue-600 hover:text-blue-800 transition-colors" onClick={() => setIsOpen(true)} />
      </div>

      {/* Chat dialog */}
      {isOpen && (
        <div className="fixed bottom-16 right-5 w-[350px] h-[500px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-green-100 self-end' : 'bg-blue-50 self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="flex p-4 border-t border-gray-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="self-end m-2 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default ChatWidget;