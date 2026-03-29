'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const TOAST_LIMIT = 5;
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

const TOAST_ICONS = {
  success: { Icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  error: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { Icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

let toastId = 0;

function Toast({ toast, onDismiss }) {
  const { Icon, color, bg, border } = TOAST_ICONS[toast.type];
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const duration = toast.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    const timeout = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`relative w-80 rounded-lg border ${border} ${bg} shadow-lg overflow-hidden`}
    >
      <div className="p-4 flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm text-slate-900 font-medium leading-relaxed">
          {toast.message}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 bg-slate-200/50">
        <motion.div
          className={`h-full ${
            toast.type === 'success'
              ? 'bg-emerald-500'
              : toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.016, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, customDuration) => {
    const id = ++toastId;
    const duration = customDuration ?? (type === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

    setToasts((prev) => {
      const newToasts = [...prev, { id, type, message, duration }];
      // Keep only the latest TOAST_LIMIT toasts
      return newToasts.slice(-TOAST_LIMIT);
    });

    return id;
  }, []);

  const toast = {
    success: useCallback((message, duration) => addToast('success', message, duration), [addToast]),
    error: useCallback((message, duration) => addToast('error', message, duration), [addToast]),
    warning: useCallback((message, duration) => addToast('warning', message, duration), [addToast]),
    info: useCallback((message, duration) => addToast('info', message, duration), [addToast]),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
