'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-600" style={{ color: entry.color }}>
          {entry.name}: ${entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ data, forecast }) {
  // Combine actual data with forecast
  const chartData = [...(data || [])];

  if (forecast) {
    // Mark the last actual data point as also the start of forecast
    if (chartData.length > 0) {
      chartData[chartData.length - 1].forecastAmount = chartData[chartData.length - 1].totalAmount;
    }
    chartData.push({
      month: forecast.month,
      totalAmount: null,
      forecastAmount: forecast.forecastAmount,
    });
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No revenue data yet. Create your first invoice run to see charts.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="totalAmount"
          name="Revenue"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="forecastAmount"
          name="Forecast"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="6 3"
          fill="url(#forecastGradient)"
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
