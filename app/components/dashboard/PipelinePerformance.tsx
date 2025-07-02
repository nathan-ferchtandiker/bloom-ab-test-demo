interface PipelinePerformanceProps {
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
}

export default function PipelinePerformance({ pipelineA, pipelineB }: PipelinePerformanceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline A Performance</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineA.total_shows}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Selections:</span>
            <span className="font-semibold text-gray-900">{pipelineA.selections}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Apps Generated:</span>
            <span className="font-semibold text-gray-900">{pipelineA.apps_generated}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline B Performance</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Shows:</span>
            <span className="font-semibold text-gray-900">{pipelineB.total_shows}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Selections:</span>
            <span className="font-semibold text-gray-900">{pipelineB.selections}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Apps Generated:</span>
            <span className="font-semibold text-gray-900">{pipelineB.apps_generated}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 