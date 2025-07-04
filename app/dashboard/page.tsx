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
    show_id?: string;
    origin_pipeline?: string;
    app_id?: string;
  };
  event: string;
  timestamp: string;
}

interface DashboardData {
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    pipelineA: { total_shows: 0, ab_test_shows: 0, ab_test_selections: 0, selections: 0 },
    pipelineB: { total_shows: 0, ab_test_shows: 0, ab_test_selections: 0, selections: 0 },
    recentSelections: [],
    uniqueShowCount: 0,
    abTestStarted: 0,
    abTestCompleted: 0
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
    // Separate events by type
    const showEvents = events.filter(e => e.event === 'bloom-app-show');
    const selectEvents = events.filter(e => e.event === 'bloom-app-select');

    // Unique show_id set
    const uniqueShowIds = new Set<string>();
    showEvents.forEach(e => { if (e.properties.show_id) uniqueShowIds.add(e.properties.show_id); });

    // Group bloom-app-show events by show_id
    const showsById: Record<string, ABTestEvent[]> = {};
    showEvents.forEach(e => {
      const showId = e.properties.show_id;
      if (!showId) return;
      if (!showsById[showId]) showsById[showId] = [];
      showsById[showId].push(e);
    });

    // Find which show_ids are A/B tests (i.e., both pipelines present)
    const abTestShowIds = new Set<string>();
    Object.entries(showsById).forEach(([showId, events]) => {
      const pipelines = new Set(events.map(e => e.properties.origin_pipeline));
      if (pipelines.has('a') && pipelines.has('b')) abTestShowIds.add(showId);
    });

    // Find A/B test show_ids that have a selection
    const abTestShowIdsWithSelection = new Set<string>();
    selectEvents.forEach(event => {
      const showId = event.properties.show_id;
      if (abTestShowIds.has(showId ?? '')) abTestShowIdsWithSelection.add(showId ?? '');
    });

    // For each pipeline, count total shows, ab test shows, ab test selections
    const pipelineA = { total_shows: 0, ab_test_shows: 0, ab_test_selections: 0, selections: 0 };
    const pipelineB = { total_shows: 0, ab_test_shows: 0, ab_test_selections: 0, selections: 0 };
    const recentSelections: Array<{timestamp: string, pipeline: string, app_id: string, user_id: string}> = [];

    // Count total shows and ab test shows
    showEvents.forEach(event => {
      const pipeline = event.properties.origin_pipeline;
      const showId = event.properties.show_id;
      if (pipeline === 'a') {
        pipelineA.total_shows++;
        if (abTestShowIds.has(showId ?? '')) pipelineA.ab_test_shows++;
      } else if (pipeline === 'b') {
        pipelineB.total_shows++;
        if (abTestShowIds.has(showId ?? '')) pipelineB.ab_test_shows++;
      }
    });

    // Count ab test selections
    selectEvents.forEach(event => {
      const selectedPipeline = event.properties.selected_pipeline;
      const showId = event.properties.show_id;
      if (abTestShowIds.has(showId ?? '')) {
        if (selectedPipeline === 'a') pipelineA.ab_test_selections++;
        else if (selectedPipeline === 'b') pipelineB.ab_test_selections++;
      }
      // Add to recent selections
      if (event.properties.selected_app && selectedPipeline) {
        recentSelections.push({
          timestamp: event.timestamp,
          pipeline: selectedPipeline,
          app_id: event.properties.selected_app,
          user_id: event.properties.user_id || 'unknown'
        });
      }
    });

    // For compatibility with components expecting selections, set selections = ab_test_selections
    pipelineA.selections = pipelineA.ab_test_selections;
    pipelineB.selections = pipelineB.ab_test_selections;

    return {
      pipelineA,
      pipelineB,
      recentSelections: recentSelections.slice(0, 10),
      uniqueShowCount: uniqueShowIds.size,
      abTestStarted: abTestShowIds.size,
      abTestCompleted: abTestShowIdsWithSelection.size
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
          uniqueShowCount={data.uniqueShowCount}
          abTestStarted={data.abTestStarted}
          abTestCompleted={data.abTestCompleted}
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