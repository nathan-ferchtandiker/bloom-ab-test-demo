"use client";
import React, { useState } from 'react';

interface ChatProps {
  onSendMessage: (message: string) => void;
}

export default function Chat({ onSendMessage }: ChatProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, input]);
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Chat History */}
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2 flex justify-end">
            <p className="text-gray-700 mb-2 text-right">{msg}</p>
          </div>
        ))}
      </div>
      <form className="p-4 border-t border-gray-200" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask Bloom..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700 placeholder-gray-400"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </form>
    </>
  );
} 