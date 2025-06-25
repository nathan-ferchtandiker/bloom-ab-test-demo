"use client"
// @ts-nocheck
import React, { useState } from 'react';
import PhonePreviewContainer from './components/PhonePreviewContainer';
import Chat from './components/Chat';
import type { BloomApp } from './components/types';

const getDefaultApp = (): BloomApp => ({ id: 'default', image: null});

export default function Home() {
  const [apps, setApps] = useState<BloomApp[]>([getDefaultApp()]);

  const handleSendMessage = async (message: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to fetch apps');
      const data = await res.json();
      if (Array.isArray(data.apps)) {
        setApps(data.apps);
      } else {
        setApps([getDefaultApp()]);
      }
    } catch (err) {
      console.error(err);
      setApps([getDefaultApp()]);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">     
      <section className="w-full max-w-md flex flex-col border-r border-gray-200 bg-white h-screen">
        <header className="px-6 py-4 border-b border-gray-200 text-2xl font-semibold flex items-center">Chat</header>
        <Chat onSendMessage={handleSendMessage} />
      </section>

      <section className="flex-1 flex items-center justify-center bg-gray-50">
        <PhonePreviewContainer apps={apps} a_b_test={true} />
      </section>
    </main>
  );
}
