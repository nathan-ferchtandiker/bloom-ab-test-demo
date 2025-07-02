interface DashboardHeaderProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ timeRange, setTimeRange, loading, onRefresh }: DashboardHeaderProps) {
  return (
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
              onClick={onRefresh}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 