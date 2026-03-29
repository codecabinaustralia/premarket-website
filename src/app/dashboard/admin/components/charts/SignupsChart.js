'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { UserPlus } from 'lucide-react';

function getTimestamp(createdAt) {
  if (!createdAt) return null;
  // Handle Firestore Timestamp serialized formats
  if (createdAt.seconds) return createdAt.seconds * 1000;
  if (createdAt._seconds) return createdAt._seconds * 1000;
  // Handle ISO string
  if (typeof createdAt === 'string') return new Date(createdAt).getTime();
  // Handle raw millis
  if (typeof createdAt === 'number') return createdAt;
  return null;
}

export default function SignupsChart({ users }) {
  const data = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Initialize all 30 days
    const days = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: key, count: 0 };
    }

    // Count users per day
    for (const user of users) {
      const ts = getTimestamp(user.createdAt);
      if (!ts) continue;
      const d = new Date(ts);
      if (d < thirtyDaysAgo) continue;
      const key = d.toISOString().split('T')[0];
      if (days[key]) {
        days[key].count++;
      }
    }

    return Object.values(days).map(d => ({
      ...d,
      label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    }));
  }, [users]);

  const totalRecent = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-600">Signups (Last 30 Days)</h3>
        <span className="text-xs font-medium text-slate-500">{totalRecent} total</span>
      </div>
      {totalRecent === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400">
          <UserPlus className="w-8 h-8 mb-2" />
          <p className="text-sm">No signups in the last 30 days</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value) => [value, 'Signups']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#signupGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
