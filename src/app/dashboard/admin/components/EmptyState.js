'use client';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action
}) {
  return (
    <div className="py-16 text-center">
      {/* Icon */}
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white
            bg-gradient-to-r from-[#e48900] to-[#c64500]
            hover:shadow-md transition-shadow duration-200
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
