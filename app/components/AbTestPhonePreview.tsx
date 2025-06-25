import React from 'react';
import type { BloomApp } from './types';

interface AbTestPhonePreviewProps {
  app: BloomApp;
  variantLabel: string;
  onSelect: () => void;
  disabled: boolean;
}

const AbTestPhonePreview: React.FC<AbTestPhonePreviewProps> = ({ app, variantLabel, onSelect, disabled }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-sm font-medium">{variantLabel}</div>
      <button
        onClick={onSelect}
        disabled={disabled}
        className={`border rounded-xl p-2 bg-white shadow hover:shadow-lg transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <img src={app.image ?? ''} alt={variantLabel} className="w-32 h-64 object-cover rounded-lg" />
      </button>
    </div>
  );
};

export default AbTestPhonePreview;
