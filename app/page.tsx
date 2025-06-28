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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch('/api/app', {
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

  const handleSelectApp = async (selectedId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const res = await fetch(`/api/app/selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_id: selectedId,
          choices: apps.map(app => app.id),
          user_id: 'demo-user',
        }),
      });
      if (!res.ok) throw new Error('Failed to send selection');
      // Optionally, you can check the response here
      setApps(apps => apps.filter(app => app.id === selectedId));
    } catch (err) {
      console.error(err);
      // Optionally, handle error (e.g., show notification)
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">     
      <section className="w-full max-w-md flex flex-col border-r border-gray-200 bg-white h-screen">
        <header className="px-6 py-4 border-b border-gray-200 text-2xl font-semibold flex items-center">Chat</header>
        <Chat onSendMessage={handleSendMessage} />
      </section>

      <section className="flex-1 flex items-center justify-center bg-gray-50">
        <PhonePreviewContainer apps={apps} a_b_test={true} onSelectApp={handleSelectApp} />
      </section>
    </main>
  );
}
