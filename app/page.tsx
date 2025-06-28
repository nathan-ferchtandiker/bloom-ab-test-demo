"use client"
// @ts-nocheck
import React, { useState } from 'react';
import PhonePreviewContainer from './components/PhonePreviewContainer';
import Chat from './components/Chat';
import type { BloomApp } from './components/types';

// Add PostHog type declaration
declare global {
  interface Window {
    posthog: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

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

  const handleSelectApp = async (allApps: BloomApp[], selectedId: string) => {
    try {
      // Send selection to PostHog for A/B testing analysis
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('ab_test_selection', {
          selected_id: selectedId,
          choices: allApps.map(app => app.id),
          user_id: 'demo-user',
          timestamp: new Date().toISOString(),
          // A/B testing specific properties
          experiment_name: 'origin_pipeline_test',
          variant: selectedId, // The selected pipeline variant
          all_variants: allApps.map(app => app.id), // All available variants
          conversion: true, // This represents a successful selection/conversion
          // Additional context for analysis
          total_choices: allApps.length,
          selection_index: allApps.findIndex(app => app.id === selectedId)
        });
      }
      
      // Update the apps state to show only the selected app
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
        <PhonePreviewContainer apps={apps} a_b_test={true} onSelectApp={(selectedId) => handleSelectApp(apps, selectedId)} />
      </section>
    </main>
  );
}
