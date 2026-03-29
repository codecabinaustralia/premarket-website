'use client';

const DEFAULT_COLOR_MAPS = {
  // User roles
  ADMIN: 'bg-red-100 text-red-700',
  PRO: 'bg-orange-100 text-orange-700',
  AGENT: 'bg-blue-100 text-blue-700',
  BUYER: 'bg-emerald-100 text-emerald-700',

  // API status
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  revoked: 'bg-red-100 text-red-700',

  // Property visibility
  Public: 'bg-emerald-100 text-emerald-700',
  Private: 'bg-slate-100 text-slate-500',

  // Display status
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-500',

  // Display type
  AGENCY: 'bg-orange-100 text-orange-700',
  MALL: 'bg-purple-100 text-purple-700',

  // Invoice status
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700'
};

export default function StatusBadge({ status, colorMap = {} }) {
  if (!status) return null;

  // Merge custom color map with defaults
  const mergedColorMap = { ...DEFAULT_COLOR_MAPS, ...colorMap };

  // Get color classes for this status, fallback to slate
  const colorClasses = mergedColorMap[status] || 'bg-slate-100 text-slate-600';

  // Capitalize status text
  const displayText = typeof status === 'string'
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : status;

  return (
    <span
      className={`
        px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide
        ${colorClasses}
      `}
    >
      {displayText}
    </span>
  );
}
