"use client"
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Type assertions to fix Recharts TypeScript issues
const ResponsiveContainerAny = ResponsiveContainer as any;
const BarChartAny = BarChart as any;
const CartesianGridAny = CartesianGrid as any;
const XAxisAny = XAxis as any;
const YAxisAny = YAxis as any;
const TooltipAny = Tooltip as any;
const BarAny = Bar as any;
const CellAny = Cell as any;

// Types for the data structure
interface ABTestEvent {
  id: string;
  distinct_id: string;
  properties: {
    all_apps?: string[];
    all_pipelines?: string[];
    selected_app?: string;
    selected_pipeline?: string;
    timestamp?: string;
    user_id?: string;
    total_choices?: number;
    selection_index?: number;
    experiment_name?: string;
    variant?: string;
    all_variants?: string[];
    conversion?: boolean;
  };
  event: string;
  timestamp: string;
}

interface DashboardData {
  pipelineA: {
    total_shows: number;
    selections: number;
    apps_generated: number;
  };
  pipelineB: {
    total_shows: number;
    selections: number;
    apps_generated: number;
  };
  recentSelections: Array<{
    timestamp: string;
    pipeline: string;
    app_id: string;
    user_id: string;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Statistical significance test functions
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    pipelineA: { total_shows: 0, selections: 0, apps_generated: 0 },
    pipelineB: { total_shows: 0, selections: 0, apps_generated: 0 },
    recentSelections: []
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twoSidedTest, setTwoSidedTest] = useState(false);

  const getDateRange = (range: string) => {
    const now = new Date();
    let after: Date;
    
    switch (range) {
      case '1h':
        after = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        after = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        after = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
      after: after.toISOString(),
      before: now.toISOString()
    };
  };

  const processEvents = (events: ABTestEvent[]): DashboardData => {
    const pipelineA = { total_shows: 0, selections: 0, apps_generated: 0 };
    const pipelineB = { total_shows: 0, selections: 0, apps_generated: 0 };
    const recentSelections: Array<{timestamp: string, pipeline: string, app_id: string, user_id: string}> = [];

    // Track unique app IDs per pipeline to calculate apps generated
    const pipelineAAppIds = new Set<string>();
    const pipelineBAppIds = new Set<string>();

    console.log('Processing events:', events.length);
    
    events.forEach((event, eventIndex) => {
      const props = event.properties;
      const selectedPipeline = props.selected_pipeline;
      const allApps = props.all_apps || [];
      const allPipelines = props.all_pipelines || [];
      
      console.log(`Event ${eventIndex}:`, {
        selectedPipeline,
        allApps,
        allPipelines,
        hasListOfApps: !!props.all_apps,
        hasListOfPipelines: !!props.all_pipelines,
        allProperties: props
      });
      
      // Count total shows - each event represents a "show" where both pipelines were displayed
      // We count this event as a show for both pipelines since both were presented to the user
      pipelineA.total_shows++;
      pipelineB.total_shows++;
      
      // Count unique app IDs per pipeline for apps generated
      if (allApps.length > 0 && allPipelines.length > 0) {
        // Match apps with their pipelines
        allApps.forEach((appId, index) => {
          const pipeline = allPipelines[index];
          if (pipeline === 'a') {
            pipelineAAppIds.add(appId);
          } else if (pipeline === 'b') {
            pipelineBAppIds.add(appId);
          }
        });
      } else {
        // Fallback: if we don't have the arrays, use the selected app and pipeline
        if (props.selected_app && selectedPipeline) {
          if (selectedPipeline === 'a') {
            pipelineAAppIds.add(props.selected_app);
          } else if (selectedPipeline === 'b') {
            pipelineBAppIds.add(props.selected_app);
          }
        }
      }
      
      // Count selections
      if (selectedPipeline === 'a') {
        pipelineA.selections++;
      } else if (selectedPipeline === 'b') {
        pipelineB.selections++;
      }

      // Add to recent selections
      if (props.selected_app && selectedPipeline) {
        recentSelections.push({
          timestamp: event.timestamp,
          pipeline: selectedPipeline,
          app_id: props.selected_app,
          user_id: props.user_id || 'unknown'
        });
      }
    });

    console.log('Final counts:', {
      pipelineA: { 
        shows: pipelineA.total_shows, 
        selections: pipelineA.selections,
        uniqueAppIds: Array.from(pipelineAAppIds)
      },
      pipelineB: { 
        shows: pipelineB.total_shows, 
        selections: pipelineB.selections,
        uniqueAppIds: Array.from(pipelineBAppIds)
      }
    });

    // Apps generated is based on unique app IDs
    pipelineA.apps_generated = pipelineAAppIds.size;
    pipelineB.apps_generated = pipelineBAppIds.size;

    return {
      pipelineA,
      pipelineB,
      recentSelections: recentSelections.slice(0, 10) // Keep only last 10
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { after, before } = getDateRange(timeRange);
      const response = await fetch(`/api/abtest/events?after=${after}&before=${before}&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const processedData = processEvents(result.results || []);
      setData(processedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Chart data for selections
  const selectionData = [
    { name: 'Pipeline A', selections: data.pipelineA.selections, color: '#3B82F6' },
    { name: 'Pipeline B', selections: data.pipelineB.selections, color: '#10B981' },
  ];

  // Pie chart data for total distribution
  const pieData = [
    { name: 'Pipeline A', value: data.pipelineA.selections },
    { name: 'Pipeline B', value: data.pipelineB.selections },
  ];

  // Calculate statistical significance
  const significanceTest = chiSquareTest(
    data.pipelineA.selections,
    data.pipelineA.total_shows,
    data.pipelineB.selections,
    data.pipelineB.total_shows,
    twoSidedTest
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A/B Test Dashboard</h1>
              <p className="text-gray-600">Bloom App Generation Pipeline Analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button 
                onClick={fetchData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Selections</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.pipelineA.selections + data.pipelineB.selections}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
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
                  {Math.min(new Set(data.recentSelections.map(s => s.user_id)).size, 10)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Selections Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selections by Pipeline</h3>
            <ResponsiveContainerAny width="100%" height={300}>
              <BarChartAny data={selectionData}>
                <CartesianGridAny strokeDasharray="3 3" />
                <XAxisAny dataKey="name" />
                <YAxisAny allowDecimals={false} />
                <TooltipAny />
                <BarAny dataKey="selections">
                  {selectionData.map((entry, index) => (
                    <CellAny key={`cell-${index}`} fill={entry.color} />
                  ))}
                </BarAny>
              </BarChartAny>
            </ResponsiveContainerAny>
          </div>
        </div>

        

        {/* Pipeline Performance Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline A Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Shows:</span>
                <span className="font-semibold text-gray-900">{data.pipelineA.total_shows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selections:</span>
                <span className="font-semibold text-gray-900">{data.pipelineA.selections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apps Generated:</span>
                <span className="font-semibold text-gray-900">{data.pipelineA.apps_generated}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline B Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Shows:</span>
                <span className="font-semibold text-gray-900">{data.pipelineB.total_shows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selections:</span>
                <span className="font-semibold text-gray-900">{data.pipelineB.selections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apps Generated:</span>
                <span className="font-semibold text-gray-900">{data.pipelineB.apps_generated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Significance Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Statistical Significance Test (1-sided: B{'>'}A)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Selection Rates</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pipeline A:</span>
                  <span className="font-semibold text-gray-900">
                    {significanceTest.aRate.toFixed(3)} ({data.pipelineA.selections}/{data.pipelineA.total_shows})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pipeline B:</span>
                  <span className="font-semibold text-gray-900">
                    {significanceTest.bRate.toFixed(3)} ({data.pipelineB.selections}/{data.pipelineB.total_shows})
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Test Results</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi-Square Statistic:</span>
                  <span className="font-semibold text-gray-900">{significanceTest.chiSquare.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P-Value:</span>
                  <span className="font-semibold text-gray-900">{significanceTest.pValue.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Significant (α=0.05):</span>
                  <span className={`font-semibold ${significanceTest.isSignificant ? 'text-green-600' : 'text-red-600'}`}>
                    {significanceTest.isSignificant ? 'Yes' : 'No'}
                  </span>
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

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Selections</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pipeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentSelections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No recent selections found
                    </td>
                  </tr>
                ) : (
                  data.recentSelections.map((selection, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(selection.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selection.pipeline === 'a' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Pipeline {selection.pipeline.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {selection.app_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {selection.user_id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 