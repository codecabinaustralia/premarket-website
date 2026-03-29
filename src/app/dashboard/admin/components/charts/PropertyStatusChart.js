'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  Public: '#10b981',
  Private: '#f59e0b',
  Archived: '#94a3b8',
};

export default function PropertyStatusChart({ properties }) {
  const data = useMemo(() => {
    const publicCount = properties.filter(p => p.visibility === true).length;
    const archivedCount = properties.filter(p => p.archived === true).length;
    const privateCount = properties.length - publicCount - archivedCount;

    return [
      { name: 'Public', value: publicCount },
      { name: 'Private', value: privateCount },
      { name: 'Archived', value: archivedCount },
    ].filter(d => d.value > 0);
  }, [properties]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-600 mb-4">Property Status</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
