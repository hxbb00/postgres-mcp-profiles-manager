interface Props {
  title: string;
  message: string;
  okLabel?: string;
  onClose: () => void;
}

export default function AlertDialog({ title, message, okLabel = "OK", onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-panel border border-strong rounded-xl shadow-2xl p-6 w-[440px] max-w-full">
        <h3 className="text-base font-semibold text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted mb-6 break-words">{message}</p>
        <div className="flex justify-end pt-4 border-t border-subtle">
          <button
            onClick={onClose}
            autoFocus
            className="px-4 py-2 text-xs font-medium text-white bg-accent border border-accent-border rounded-md hover:bg-accent-hover transition-colors"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
