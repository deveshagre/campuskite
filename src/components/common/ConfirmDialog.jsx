import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  variant,
  loading = false,
}) {
  if (!isOpen) return null;

  const resolvedVariant = variant || (danger ? 'danger' : 'primary');
  const iconBg =
    resolvedVariant === 'mint'
      ? 'var(--mint)'
      : resolvedVariant === 'danger'
      ? 'var(--coral)'
      : 'var(--primary)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div className="confirm-dialog">
        <div
          className="confirm-dialog-icon"
          style={{ backgroundColor: iconBg }}
        >
          <AlertTriangle size={28} color="var(--text)" />
        </div>
        <p className="confirm-dialog-desc">{message}</p>
        <div className="confirm-dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={resolvedVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
