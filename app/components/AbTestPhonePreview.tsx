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
        className={`border-none bg-transparent p-0 m-0 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="relative w-[240px] h-[480px] bg-white rounded-[40px] shadow-xl border-4 border-gray-200 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center text-gray-500 text-base">
            {app.image ? (
              <img src={app.image ?? ''} alt={variantLabel} className="max-h-full max-w-full object-contain" />
            ) : (
              'Create an app by typing'
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default AbTestPhonePreview;
