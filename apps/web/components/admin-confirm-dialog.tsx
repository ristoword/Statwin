'use client';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{title}</h2>
        <p className="disclaimer" style={{ marginBottom: 0 }}>{body}</p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Annulla
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Operazione…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
