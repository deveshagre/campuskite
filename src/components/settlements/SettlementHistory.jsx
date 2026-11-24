import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { History, XCircle, ArrowRight } from 'lucide-react';

/**
 * SettlementHistory Component
 *
 * Displays a historical log of settlement payments.
 * Payers can cancel their own completed payments.
 *
 * @param {Object} props
 * @param {Array<Object>} props.settlements - List of settlement records
 * @param {string} props.currentUserId
 * @param {Record<string, string>} [props.memberMap={}] - User ID to name mapping
 * @param {Function} props.onCancel - Callback (settlementId)
 */
export default function SettlementHistory({
  settlements = [],
  currentUserId,
  memberMap = {},
  onCancel,
}) {
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Sorted settlements (newest first)
  const sortedSettlements = useMemo(() => {
    const list = Array.isArray(settlements) ? [...settlements] : [];
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  }, [settlements]);

  const handleConfirmCancel = async () => {
    if (!selectedSettlement) return;
    setIsCancelling(true);
    try {
      await onCancel?.(selectedSettlement.id);
      setSelectedSettlement(null);
    } catch {
      // error handled by parent or toast
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={20} color="var(--text)" />
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'bold',
            }}
          >
            Payment History
          </h3>
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          {sortedSettlements.length} {sortedSettlements.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {sortedSettlements.length === 0 ? (
        <EmptyState
          icon={<History size={36} color="var(--text-secondary)" />}
          title="No payment history yet"
          description="When members record settlements or payments, they will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {sortedSettlements.map((s) => {
            const isPayer = s.payerId === currentUserId;
            const isReceiver = s.receiverId === currentUserId;

            const payerName = isPayer ? 'You' : memberMap[s.payerId] || 'Unknown';
            const receiverName = isReceiver ? 'You' : memberMap[s.receiverId] || 'Unknown';

            const isCompleted = s.status === 'completed';
            const canCancel = isCompleted && isPayer;

            return (
              <div
                key={s.id}
                className="card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  backgroundColor: isCompleted ? 'var(--surface)' : '#FFF8F8',
                  borderLeft: isCompleted
                    ? '4px solid var(--success)'
                    : '4px solid var(--danger)',
                }}
              >
                {/* Details */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontWeight: isPayer ? 'bold' : 600 }}>{payerName}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>paid</span>
                    <span style={{ fontWeight: isReceiver ? 'bold' : 600 }}>{receiverName}</span>
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {formatDate(s.createdAt)}
                    {s.cancelledAt && ` • Cancelled on ${formatDate(s.cancelledAt)}`}
                  </div>
                </div>

                {/* Amount, Status & Cancel button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 'bold',
                        fontSize: 'var(--font-size-base)',
                        textDecoration: isCompleted ? 'none' : 'line-through',
                        color: isCompleted ? 'var(--text)' : 'var(--text-secondary)',
                      }}
                    >
                      {formatCurrency(s.amount)}
                    </div>
                    <Badge
                      variant={isCompleted ? 'success' : 'danger'}
                      style={{ fontSize: '10px', padding: '2px 6px', marginTop: 2 }}
                    >
                      {isCompleted ? 'Completed' : 'Cancelled'}
                    </Badge>
                  </div>

                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSettlement(s)}
                      style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                      icon={<XCircle size={14} />}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for cancelling payment */}
      <ConfirmDialog
        isOpen={Boolean(selectedSettlement)}
        onClose={() => setSelectedSettlement(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Payment?"
        description={`Are you sure you want to cancel this payment of ${selectedSettlement ? formatCurrency(selectedSettlement.amount) : ''}? The debt will be restored.`}
        confirmText="Yes, Cancel Payment"
        cancelText="Keep"
        variant="danger"
        loading={isCancelling}
      />
    </div>
  );
}
