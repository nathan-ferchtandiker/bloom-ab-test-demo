interface KeyMetricsProps {
  pipelineA: {
    total_shows: number;
    selections: number;
  };
  pipelineB: {
    total_shows: number;
    selections: number;
  };
  recentSelections: Array<{
    timestamp: string;
    pipeline: string;
    app_id: string;
    user_id: string;
  }>;
  uniqueShowCount: number;
  abTestStarted: number;
  abTestCompleted: number;
}

// Add a simple tooltip style
const tooltipStyle = {
  position: 'absolute' as const,
  zIndex: 10,
  background: 'rgba(55, 65, 81, 0.95)',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.875rem',
  whiteSpace: 'pre-line' as const,
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '0.25rem',
  pointerEvents: 'none' as const
};

import React, { useState } from 'react';

export default function KeyMetrics({ pipelineA, pipelineB, recentSelections, uniqueShowCount, abTestStarted, abTestCompleted }: KeyMetricsProps) {
  // Tooltip state
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  // Helper to show/hide tooltip
  const showTooltip = (text: string, idx: number) => {
    setTooltip(text);
    setTooltipIdx(idx);
  };
  const hideTooltip = () => {
    setTooltip(null);
    setTooltipIdx(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Number A/B Test Completed */}
      <div
        className="bg-white rounded-lg shadow p-6 relative cursor-pointer"
        onMouseEnter={() => showTooltip('Number of A/B tests where a user made a selection.', 0)}
        onMouseLeave={hideTooltip}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Number A/B Test Completed</p>
            <p className="text-2xl font-semibold text-gray-900">
              {abTestCompleted}
            </p>
          </div>
        </div>
        {tooltip && tooltipIdx === 0 && (
          <span style={tooltipStyle}>{tooltip}</span>
        )}
      </div>

      {/* Total Number A/B Test Started */}
      <div
        className="bg-white rounded-lg shadow p-6 relative cursor-pointer"
        onMouseEnter={() => showTooltip('Number of A/B tests shown to users.', 1)}
        onMouseLeave={hideTooltip}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Number A/B Test Started</p>
            <p className="text-2xl font-semibold text-gray-900">
              {abTestStarted}
            </p>
          </div>
        </div>
        {tooltip && tooltipIdx === 1 && (
          <span style={tooltipStyle}>{tooltip}</span>
        )}
      </div>

      {/* Unique Users */}
      <div
        className="bg-white rounded-lg shadow p-6 relative cursor-pointer"
        onMouseEnter={() => showTooltip('Number of unique users in recent selections.', 2)}
        onMouseLeave={hideTooltip}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Unique Users</p>
            <p className="text-2xl font-semibold text-gray-900">
              {Math.min(new Set(recentSelections.map(s => s.user_id)).size, 10)}
            </p>
          </div>
        </div>
        {tooltip && tooltipIdx === 2 && (
          <span style={tooltipStyle}>{tooltip}</span>
        )}
      </div>

      {/* Total Unique Shows */}
      <div
        className="bg-white rounded-lg shadow p-6 relative cursor-pointer"
        onMouseEnter={() => showTooltip('Number of unique app show sessions.', 3)}
        onMouseLeave={hideTooltip}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Unique Shows</p>
            <p className="text-2xl font-semibold text-gray-900">
              {uniqueShowCount}
            </p>
          </div>
        </div>
        {tooltip && tooltipIdx === 3 && (
          <span style={tooltipStyle}>{tooltip}</span>
        )}
      </div>
    </div>
  );
} 