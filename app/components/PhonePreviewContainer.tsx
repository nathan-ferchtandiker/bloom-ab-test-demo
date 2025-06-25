import React, { useState, useEffect } from 'react';
import PhonePreview from './PhonePreview';
import AbTestPhonePreview from './AbTestPhonePreview';
import type { BloomApp } from './types';
import { posthog } from '../lib/posthog';

export default function PhonePreviewContainer({ apps, a_b_test = true }: { apps: BloomApp[]; a_b_test?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [experimentVariant, setExperimentVariant] = useState<string | null>(null);

  useEffect(() => {
    if (a_b_test && typeof window !== 'undefined') {
      // Get the experiment variant from PostHog
      const variant = posthog.getFeatureFlag('app-preference-test');
      setExperimentVariant(typeof variant === 'string' ? variant : null);
      
      // Track experiment exposure
      posthog.capture('experiment_viewed', {
        experiment_name: 'app-preference-test',
        variant: variant,
      });
    }
  }, [a_b_test]);

  const handleAppSelection = (appId: string) => {
    setSelected(appId);
    
    // Track the selection event
    posthog.capture('app_preference_selected', {
      experiment_name: 'app-preference-test',
      variant: experimentVariant,
      selected_app_id: appId,
      apps_count: apps.length,
    });
  };

  if (!a_b_test) {
    return (
      <div className="flex gap-6 items-center justify-center p-4 bg-gray-100 rounded-2xl shadow-md">
        {apps.map(app => (
          <PhonePreview key={app.id} image={app.image} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-2xl shadow-md">
      <div className="mb-4 text-lg font-semibold text-gray-700">
        Which app do you prefer?
        {experimentVariant && (
          <span className="ml-2 text-sm text-gray-500">(Variant: {experimentVariant})</span>
        )}
      </div>
      <div className="flex gap-6 items-center justify-center">
        {apps
          .filter(app => selected === null || selected === app.id)
          .map((app, idx) => (
            <AbTestPhonePreview
              key={app.id}
              app={app}
              variantLabel={`Variant ${String.fromCharCode(65 + idx)}`}
              onSelect={() => handleAppSelection(app.id)}
              disabled={selected !== null}
            />
          ))}
      </div>
    </div>
  );
} 