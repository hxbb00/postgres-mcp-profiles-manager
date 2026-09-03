interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = "Delete", cancelLabel = "Cancel", onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-panel border border-strong rounded-xl shadow-2xl p-6 w-[400px] max-w-full">
        <h3 className="text-base font-semibold text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-2 pt-4 border-t border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="px-4 py-2 text-xs font-medium text-white bg-danger-confirm border border-danger-confirm-border rounded-md hover:bg-danger-confirm-hover transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
