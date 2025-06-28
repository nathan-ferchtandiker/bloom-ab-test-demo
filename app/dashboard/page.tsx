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

// Types for the data structure
interface ABTestEvent {
  id: string;
  distinct_id: string;
  properties: {
    list_of_apps?: string[];
    list_of_pipelines?: string[];
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
    conversion_rate: number;
    apps_generated: number;
  };
  pipelineB: {
    total_shows: number;
    selections: number;
    conversion_rate: number;
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    pipelineA: { total_shows: 0, selections: 0, conversion_rate: 0, apps_generated: 0 },
    pipelineB: { total_shows: 0, selections: 0, conversion_rate: 0, apps_generated: 0 },
    recentSelections: []
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const pipelineA = { total_shows: 0, selections: 0, conversion_rate: 0, apps_generated: 0 };
    const pipelineB = { total_shows: 0, selections: 0, conversion_rate: 0, apps_generated: 0 };
    const recentSelections: Array<{timestamp: string, pipeline: string, app_id: string, user_id: string}> = [];

    events.forEach(event => {
      const props = event.properties;
      const selectedPipeline = props.selected_pipeline;
      
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

    // Calculate total shows (assuming each event represents a show)
    const totalShows = events.length;
    pipelineA.total_shows = Math.floor(totalShows / 2); // Rough estimate
    pipelineB.total_shows = Math.floor(totalShows / 2);

    // Calculate conversion rates
    pipelineA.conversion_rate = pipelineA.total_shows > 0 ? (pipelineA.selections / pipelineA.total_shows) * 100 : 0;
    pipelineB.conversion_rate = pipelineB.total_shows > 0 ? (pipelineB.selections / pipelineB.total_shows) * 100 : 0;

    // Estimate apps generated
    pipelineA.apps_generated = Math.floor(pipelineA.total_shows * 0.5);
    pipelineB.apps_generated = Math.floor(pipelineB.total_shows * 0.5);

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

  // Chart data for conversion rates
  const conversionData = [
    { name: 'Pipeline A', conversion: data.pipelineA.conversion_rate },
    { name: 'Pipeline B', conversion: data.pipelineB.conversion_rate },
  ];

  // Chart data for selections
  const selectionData = [
    { name: 'Pipeline A', selections: data.pipelineA.selections },
    { name: 'Pipeline B', selections: data.pipelineB.selections },
  ];

  // Pie chart data for total distribution
  const pieData = [
    { name: 'Pipeline A', value: data.pipelineA.selections },
    { name: 'Pipeline B', value: data.pipelineB.selections },
  ];

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
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
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
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {((data.pipelineA.conversion_rate + data.pipelineB.conversion_rate) / 2).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Shows</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.pipelineA.total_shows + data.pipelineB.total_shows}
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
                  {new Set(data.recentSelections.map(s => s.user_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Conversion Rate Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate by Pipeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Legend />
                <Bar dataKey="conversion" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Selections Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selections Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Performance Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline A Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Shows:</span>
                <span className="font-semibold">{data.pipelineA.total_shows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selections:</span>
                <span className="font-semibold">{data.pipelineA.selections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate:</span>
                <span className="font-semibold text-green-600">{data.pipelineA.conversion_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apps Generated:</span>
                <span className="font-semibold">{data.pipelineA.apps_generated}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline B Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Shows:</span>
                <span className="font-semibold">{data.pipelineB.total_shows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selections:</span>
                <span className="font-semibold">{data.pipelineB.selections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate:</span>
                <span className="font-semibold text-green-600">{data.pipelineB.conversion_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apps Generated:</span>
                <span className="font-semibold">{data.pipelineB.apps_generated}</span>
              </div>
            </div>
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