import React, { useState } from 'react';

interface StatisticalTestProps {
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
  twoSidedTest: boolean;
}

// Statistical significance test function
const chiSquareTest = (aSelections: number, aShows: number, bSelections: number, bShows: number, twoSided: boolean = true) => {
  const aRate = aSelections / aShows;
  const bRate = bSelections / bShows;
  
  // Create 2x2 contingency table
  const aNotSelected = aShows - aSelections;
  const bNotSelected = bShows - bSelections;
  
  // Calculate expected values
  const totalSelections = aSelections + bSelections;
  const totalShows = aShows + bShows;
  const totalNotSelected = totalShows - totalSelections;
  
  const expectedASelections = (aShows * totalSelections) / totalShows;
  const expectedBSelections = (bShows * totalSelections) / totalShows;
  const expectedANotSelected = (aShows * totalNotSelected) / totalShows;
  const expectedBNotSelected = (bShows * totalNotSelected) / totalShows;
  
  // Calculate chi-square statistic
  const chiSquare = Math.pow(aSelections - expectedASelections, 2) / expectedASelections +
                   Math.pow(bSelections - expectedBSelections, 2) / expectedBSelections +
                   Math.pow(aNotSelected - expectedANotSelected, 2) / expectedANotSelected +
                   Math.pow(bNotSelected - expectedBNotSelected, 2) / expectedBNotSelected;
  
  // For 2x2 table, degrees of freedom = 1
  // Critical values:
  // - 2-sided (α=0.05): 3.841
  // - 1-sided (α=0.05): 2.706 (using z-score approximation)
  const criticalValue = twoSided ? 3.841 : 2.706;
  const isSignificant = chiSquare > criticalValue;
  
  // P-value calculation using chi-square distribution approximation
  const calculatePValue = (chiSquare: number, twoSided: boolean, bRate: number, aRate: number) => {
    // For chi-square with 1 degree of freedom, we can use normal approximation
    const z = Math.sqrt(chiSquare);
    
    // Standard normal CDF approximation
    const normalCDF = (x: number) => {
      return 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
    };
    
    let pValue;
    if (twoSided) {
      // Two-sided test: probability of getting chi-square this large or larger
      pValue = 2 * (1 - normalCDF(z));
    } else {
      // One-sided test: we only care if B > A
      if (bRate > aRate) {
        // B is better, so we want the probability of getting this result or better
        pValue = 1 - normalCDF(z);
      } else {
        // B is not better, so p-value should be high (not significant)
        pValue = normalCDF(z);
      }
    }
    
    return Math.max(0, Math.min(1, pValue)); // Clamp between 0 and 1
  };
  
  const pValue = calculatePValue(chiSquare, twoSided, bRate, aRate);
  
  return {
    chiSquare,
    pValue,
    isSignificant,
    aRate,
    bRate,
    improvement: bRate > aRate ? ((bRate - aRate) / aRate) * 100 : ((aRate - bRate) / aRate) * 100,
    twoSided,
    criticalValue
  };
};

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

export default function StatisticalTest({ pipelineA, pipelineB, twoSidedTest }: StatisticalTestProps) {
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

  // Calculate statistical significance using A/B Test Selections and Shows
  const significanceTest = chiSquareTest(
    pipelineA.ab_test_selections,
    pipelineA.ab_test_shows,
    pipelineB.ab_test_selections,
    pipelineB.ab_test_shows,
    twoSidedTest
  );

  // Calculate selection rates as proportion of total A/B Test selections
  const totalAbSelections = pipelineA.ab_test_selections + pipelineB.ab_test_selections;
  const aSelectionRate = totalAbSelections > 0 ? pipelineA.ab_test_selections / totalAbSelections : 0;
  const bSelectionRate = totalAbSelections > 0 ? pipelineB.ab_test_selections / totalAbSelections : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Statistical Significance Test (1-sided: B{'>'}A)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">A/B Test Selection Rates</h4>
          <div className="space-y-2">
            <div
              className="flex justify-between relative cursor-pointer"
              onMouseEnter={() => showTooltip('Proportion of A/B test selections for Pipeline A.', 'a-rate')}
              onMouseLeave={hideTooltip}
            >
              <span className="text-gray-600">Pipeline A:</span>
              <span className="font-semibold text-gray-900">
                {aSelectionRate.toFixed(3)} ({pipelineA.ab_test_selections}/{totalAbSelections})
              </span>
              {tooltip && tooltipIdx === 'a-rate' && (
                <span style={tooltipStyle}>{tooltip}</span>
              )}
            </div>
            <div
              className="flex justify-between relative cursor-pointer"
              onMouseEnter={() => showTooltip('Proportion of A/B test selections for Pipeline B.', 'b-rate')}
              onMouseLeave={hideTooltip}
            >
              <span className="text-gray-600">Pipeline B:</span>
              <span className="font-semibold text-gray-900">
                {bSelectionRate.toFixed(3)} ({pipelineB.ab_test_selections}/{totalAbSelections})
              </span>
              {tooltip && tooltipIdx === 'b-rate' && (
                <span style={tooltipStyle}>{tooltip}</span>
              )}
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Test Results</h4>
          <div className="space-y-2">
            <div
              className="flex justify-between relative cursor-pointer"
              onMouseEnter={() => showTooltip('Chi-Square test statistic for significance.', 'chi')}
              onMouseLeave={hideTooltip}
            >
              <span className="text-gray-600">Chi-Square Statistic:</span>
              <span className="font-semibold text-gray-900">{significanceTest.chiSquare.toFixed(3)}</span>
              {tooltip && tooltipIdx === 'chi' && (
                <span style={tooltipStyle}>{tooltip}</span>
              )}
            </div>
            <div
              className="flex justify-between relative cursor-pointer"
              onMouseEnter={() => showTooltip('Probability the observed difference is due to chance.', 'pval')}
              onMouseLeave={hideTooltip}
            >
              <span className="text-gray-600">P-Value:</span>
              <span className="font-semibold text-gray-900">{significanceTest.pValue.toFixed(4)}</span>
              {tooltip && tooltipIdx === 'pval' && (
                <span style={tooltipStyle}>{tooltip}</span>
              )}
            </div>
            <div
              className="flex justify-between relative cursor-pointer"
              onMouseEnter={() => showTooltip('Whether the result is statistically significant at α=0.05.', 'sig')}
              onMouseLeave={hideTooltip}
            >
              <span className="text-gray-600">Significant (α=0.05):</span>
              <span className={`font-semibold ${significanceTest.isSignificant ? 'text-green-600' : 'text-red-600'}`}>
                {significanceTest.isSignificant ? 'Yes' : 'No'}
              </span>
              {tooltip && tooltipIdx === 'sig' && (
                <span style={tooltipStyle}>{tooltip}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Conclusion */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-medium text-gray-700 mb-2">Conclusion</h4>
        <p className="text-gray-600">
          {significanceTest.isSignificant 
            ? `Pipeline B is performing significantly better than Pipeline A with a ${significanceTest.improvement.toFixed(1)}% improvement in selection rate (p < 0.05, one-sided test).`
            : 'Pipeline B is not performing significantly better than Pipeline A at the 95% confidence level (one-sided test). More data may be needed.'
          }
        </p>
      </div>
    </div>
  );
} 