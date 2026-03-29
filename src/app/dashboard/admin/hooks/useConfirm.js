'use client';
import { useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'primary',
  });
  const resolveRef = useRef(null);

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = 'Confirm',
      confirmVariant = 'primary',
    }) => {
      setConfig({ title, message, confirmLabel, confirmVariant });
      setIsOpen(true);

      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={isOpen}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={config.title}
      message={config.message}
      confirmLabel={config.confirmLabel}
      confirmVariant={config.confirmVariant}
    />
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
