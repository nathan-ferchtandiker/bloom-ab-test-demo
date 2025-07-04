import React, { useState } from 'react';

interface PipelinePerformanceProps {
  pipelineA: {
    total_shows: number;
    ab_test_shows: number;
    ab_test_selections: number;
    selections: number;
  };
  pipelineB: {
    total_shows: number;
    ab_test_shows: number;
    ab_test_selections: number;
    selections: number;
  };
}

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

export default function PipelinePerformance({ pipelineA, pipelineB }: PipelinePerformanceProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipIdx, setTooltipIdx] = useState<string | null>(null);

  const showTooltip = (text: string, idx: string) => {
    setTooltip(text);
    setTooltipIdx(idx);
  };
  const hideTooltip = () => {
    setTooltip(null);
    setTooltipIdx(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Pipeline A */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline A Performance</h3>
        <div className="space-y-4">
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times an app from Pipeline A was shown.', 'a-total')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">Total Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineA.total_shows}</span>
            {tooltip && tooltipIdx === 'a-total' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times Pipeline A was shown in an A/B test.', 'a-abshows')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">A/B Test Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineA.ab_test_shows}</span>
            {tooltip && tooltipIdx === 'a-abshows' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times Pipeline A was selected in an A/B test.', 'a-absel')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">A/B Test Selections:</span>
            <span className="font-semibold text-gray-900">{pipelineA.ab_test_selections}</span>
            {tooltip && tooltipIdx === 'a-absel' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline B */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline B Performance</h3>
        <div className="space-y-4">
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times an app from Pipeline B was shown.', 'b-total')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">Total Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineB.total_shows}</span>
            {tooltip && tooltipIdx === 'b-total' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times Pipeline B was shown in an A/B test.', 'b-abshows')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">A/B Test Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineB.ab_test_shows}</span>
            {tooltip && tooltipIdx === 'b-abshows' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
          <div
            className="flex justify-between relative cursor-pointer"
            onMouseEnter={() => showTooltip('Number of times Pipeline B was selected in an A/B test.', 'b-absel')}
            onMouseLeave={hideTooltip}
          >
            <span className="text-gray-600">A/B Test Selections:</span>
            <span className="font-semibold text-gray-900">{pipelineB.ab_test_selections}</span>
            {tooltip && tooltipIdx === 'b-absel' && (
              <span style={tooltipStyle}>{tooltip}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 