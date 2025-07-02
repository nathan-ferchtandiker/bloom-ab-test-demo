"use client"
import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KeyMetrics from '../components/dashboard/KeyMetrics';
import SelectionsChart from '../components/dashboard/SelectionsChart';
import PipelinePerformance from '../components/dashboard/PipelinePerformance';
import StatisticalTest from '../components/dashboard/StatisticalTest';
import RecentActivity from '../components/dashboard/RecentActivity';

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
      <DashboardHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        loading={loading}
        onRefresh={fetchData}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KeyMetrics
          pipelineA={data.pipelineA}
          pipelineB={data.pipelineB}
          recentSelections={data.recentSelections}
        />
        <SelectionsChart
          pipelineA={data.pipelineA}
          pipelineB={data.pipelineB}
        />
        <PipelinePerformance
          pipelineA={data.pipelineA}
          pipelineB={data.pipelineB}
        />
        <StatisticalTest
          pipelineA={data.pipelineA}
          pipelineB={data.pipelineB}
          twoSidedTest={twoSidedTest}
        />
        <RecentActivity
          recentSelections={data.recentSelections}
        />
      </div>
    </div>
  );
} 