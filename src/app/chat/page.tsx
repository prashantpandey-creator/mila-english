'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 animate-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-900">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-center">AI Tutor Chat</h1>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-xl shadow-inner border">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Start a conversation! For example, say "Hello, how are you today?"</p>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              m.role === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border text-gray-500 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm italic">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something in English..."
          className="flex-1 p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
