'use client';
import AdminModal from './AdminModal';
import { Loader2 } from 'lucide-react';

const VARIANT_STYLES = {
  primary: {
    button: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  danger: {
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
}) {
  const variantStyles = VARIANT_STYLES[confirmVariant];

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${variantStyles.button}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </AdminModal>
  );
}
