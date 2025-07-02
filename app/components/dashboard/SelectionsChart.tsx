import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SelectionsChartProps {
  pipelineA: {
    selections: number;
  };
  pipelineB: {
    selections: number;
  };
}

export default function SelectionsChart({ pipelineA, pipelineB }: SelectionsChartProps) {
  // Chart data for selections
  const selectionData = [
    { name: 'Pipeline A', selections: pipelineA.selections, color: '#3B82F6' },
    { name: 'Pipeline B', selections: pipelineB.selections, color: '#10B981' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Selections by Pipeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={selectionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="selections">
            {selectionData.map((entry, index) => (
              <Cell key={"cell-" + String(index)} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 