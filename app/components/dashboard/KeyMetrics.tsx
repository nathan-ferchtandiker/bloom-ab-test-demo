interface KeyMetricsProps {
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

export default function KeyMetrics({ pipelineA, pipelineB, recentSelections }: KeyMetricsProps) {
  return (
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
              {pipelineA.selections + pipelineB.selections}
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
              {Math.min(new Set(recentSelections.map(s => s.user_id)).size, 10)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 