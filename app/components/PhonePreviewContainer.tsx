import React, { useState } from 'react';
import PhonePreview from './PhonePreview';
import AbTestPhonePreview from './AbTestPhonePreview';
import type { BloomApp } from './types';

export default function PhonePreviewContainer({ apps, a_b_test = true }: { apps: BloomApp[]; a_b_test?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  // For demonstration, we can just assign a static variant label if needed
  const experimentVariant = null;

  const handleAppSelection = (appId: string) => {
    setSelected(appId);
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