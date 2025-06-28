import React, { useState, useEffect } from 'react';
import PhonePreview from './PhonePreview';
import AbTestPhonePreview from './AbTestPhonePreview';
import type { BloomApp } from './types';

export default function PhonePreviewContainer({ apps, a_b_test = true, onSelectApp }: { apps: BloomApp[]; a_b_test?: boolean; onSelectApp?: (selectedId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [apps]);

  // For demonstration, we can just assign a static variant label if needed
  const experimentVariant = null;

  const handleAppSelection = (appId: string) => {
    setSelected(appId);
    if (onSelectApp) {
      onSelectApp(appId);
    }
  };

  if (!a_b_test || apps.length <= 1) {
    return (
      <div className="flex gap-6 items-center justify-center p-4 bg-gray-100 rounded-2xl shadow-md">
        {apps.map(app => (
          <div key={app.id} className="flex flex-col items-center">
            <PhonePreview image={app.image} />
            <div className="mt-2 text-xs text-gray-400">Pipeline: {app.origin_pipeline ?? 'unknown'}</div>
          </div>
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
        {selected === null
          ? apps.map((app, idx) => (
              <AbTestPhonePreview
                key={app.id}
                app={app}
                variantLabel={`Variant ${String.fromCharCode(65 + idx)}`}
                onSelect={() => handleAppSelection(app.id)}
                disabled={selected !== null}
              />
            ))
          : apps
              .filter(app => app.id === selected)
              .map((app, idx) => (
                <AbTestPhonePreview
                  key={app.id}
                  app={app}
                  variantLabel={`Variant ${String.fromCharCode(65 + idx)}`}
                  onSelect={() => {}}
                  disabled={true}
                />
              ))}
      </div>
    </div>
  );
} 