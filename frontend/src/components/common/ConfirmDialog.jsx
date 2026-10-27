import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Security Action',
  message,
  confirmText = 'Proceed',
  confirmVariant = 'danger',
  isLoading = false
}) {
  const btnStyles = confirmVariant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 py-2">
        <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-md ${btnStyles} disabled:opacity-50`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
