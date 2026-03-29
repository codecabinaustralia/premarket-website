'use client';
import { Loader2 } from 'lucide-react';

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  loading = false,
  disabled = false,
  size = 'md'
}) {
  const sizeClasses = {
    sm: {
      container: 'h-5 w-9',
      knob: 'w-4 h-4',
      translate: 'translate-x-4'
    },
    md: {
      container: 'h-6 w-11',
      knob: 'w-5 h-5',
      translate: 'translate-x-5'
    }
  };

  const currentSize = sizeClasses[size];

  const toggleSwitch = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={() => !disabled && !loading && onChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-200
        ${currentSize.container}
        ${checked ? 'bg-orange-500' : 'bg-slate-200'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-sm transition-transform duration-200
          ${currentSize.knob}
          ${checked ? currentSize.translate : 'translate-x-0.5'}
          flex items-center justify-center
        `}
      >
        {loading && (
          <Loader2 className="w-2.5 h-2.5 text-slate-400 animate-spin" />
        )}
      </span>
    </button>
  );

  if (!label && !description) {
    return toggleSwitch;
  }

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {label && (
          <label className="block text-sm font-medium text-slate-900 mb-0.5">
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">
        {toggleSwitch}
      </div>
    </div>
  );
}
