"use client"
// @ts-nocheck
import React, { useState } from 'react';
import PhonePreviewContainer from './components/PhonePreviewContainer';
import Chat from './components/Chat';
import type { BloomApp } from './components/types';
import { v4 as uuidv4 } from 'uuid';

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
  const [lastShowId, setLastShowId] = useState<string | null>(null);

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
      if (Array.isArray(data.apps) && data.apps.length > 0) {
        setApps(data.apps);
        // Always generate a unique show_id for this display
        const showId = uuidv4();
        // Send a separate bloom-app-show event for each app
        if (typeof window !== 'undefined' && window.posthog) {
          data.apps.forEach((app: BloomApp, idx: number) => {
            window.posthog.capture('bloom-app-show', {
              show_id: showId,
              app_id: app.id,
              origin_pipeline: app.origin_pipeline,
              all_apps: data.apps.map((a: BloomApp) => a.id),
              all_pipelines: data.apps.map((a: BloomApp) => a.origin_pipeline),
              timestamp: new Date().toISOString(),
              user_id: 'demo-user',
              total_choices: data.apps.length,
              app_index: idx
            });
          });
        }
        setLastShowId(showId);
      } else {
        // No apps returned, still send a bloom-app-show event with app_id: null
        setApps([getDefaultApp()]);
        const showId = uuidv4();
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('bloom-app-show', {
            show_id: showId,
            app_id: null,
            origin_pipeline: null,
            all_apps: [],
            all_pipelines: [],
            timestamp: new Date().toISOString(),
            user_id: 'demo-user',
            total_choices: 0,
            app_index: null
          });
        }
        setLastShowId(showId);
      }
    } catch (err) {
      console.error(err);
      setApps([getDefaultApp()]);
    }
  };

  const handleSelectApp = async (allApps: BloomApp[], selectedId: string) => {
    try {
      if (typeof window !== 'undefined' && window.posthog) {
        const selectedApp = allApps.find(app => app.id === selectedId);
        window.posthog.capture('bloom-app-select', {
          show_id: lastShowId,
          all_apps: allApps.map(app => app.id),
          all_pipelines: allApps.map(app => app.origin_pipeline),
          selected_app: selectedId,
          selected_pipeline: selectedApp?.origin_pipeline,
          timestamp: new Date().toISOString(),
          user_id: 'demo-user',
          total_choices: allApps.length,
          selection_index: allApps.findIndex(app => app.id === selectedId),
          experiment_name: 'demo_test'
        });
      }
      setApps(apps => apps.filter(app => app.id === selectedId));
      setLastShowId(null); // Reset showId after selection
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">     
      <section className="w-full max-w-md flex flex-col border-r border-gray-200 bg-white h-screen">
        <header className="px-6 py-4 border-b border-gray-200 text-2xl font-semibold flex items-center justify-between">
          <span>Chat</span>
          
        </header>
        <Chat onSendMessageAction={handleSendMessage} />
      </section>

      <section className="flex-1 flex items-center justify-center bg-gray-50 relative">
        <a 
          href="/dashboard" 
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          A/B Test Dashboard
        </a>
        <PhonePreviewContainer apps={apps} a_b_test={true} onSelectApp={(selectedId) => handleSelectApp(apps, selectedId)} />
      </section>
    </main>
  );
}
