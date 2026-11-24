import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './ExpenseRow';
import { Edit2, Trash2, Calendar, User, Receipt, ExternalLink } from 'lucide-react';
import { getById } from '../../services/database';

/**
 * ExpenseDetailsModal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.expense - Expense record with splits
 * @param {Array<Object>} props.members - Group members
 * @param {string} props.currentUserId
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is confirmed
 */
export default function ExpenseDetailsModal({
  isOpen,
  onClose,
  expense,
  members = [],
  currentUserId,
  onEdit,
  onDelete,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  // Map user ID -> Name
  const memberMap = useMemo(() => {
    const map = {};
    for (const m of members) {
      if (!m) continue;
      const uid = m.userId || m.id;
      if (uid) {
        map[uid] = m.name || m.email || 'Unknown';
      }
    }
    return map;
  }, [members]);

  // Load receipt if attached
  useEffect(() => {
    let objectUrl = null;

    async function loadReceipt() {
      if (!isOpen || !expense) {
        setReceiptData(null);
        setReceiptImageUrl('');
        return;
      }

      if (expense.receipt) {
        setReceiptData(expense.receipt);
        const file = expense.receipt.file || expense.receipt;
        if (file instanceof Blob || file instanceof File) {
          objectUrl = URL.createObjectURL(file);
          setReceiptImageUrl(objectUrl);
        } else if (typeof expense.receipt === 'string') {
          setReceiptImageUrl(expense.receipt);
        }
      } else if (expense.receiptId) {
        try {
          const rec = await getById('receipts', expense.receiptId);
          if (rec) {
            setReceiptData(rec);
            if (rec.file instanceof Blob || rec.file instanceof File) {
              objectUrl = URL.createObjectURL(rec.file);
              setReceiptImageUrl(objectUrl);
            }
          }
        } catch {
          // ignore error
        }
      } else {
        setReceiptData(null);
        setReceiptImageUrl('');
      }
    }

    loadReceipt();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const isPayer = expense.paidBy === currentUserId;
  const payerName = isPayer ? 'You' : memberMap[expense.paidBy] || 'Unknown';

  const categoryName = expense.category || 'Other';
  const CategoryIcon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.Other;
  const categoryColor = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Other;

  const splits = Array.isArray(expense.splits) ? expense.splits : [];

  // Payer initials for avatar
  const initials = payerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(expense.id);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      // error handled by parent or toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Expense Details"
        size="md"
        footer={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div>
              {isPayer && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowConfirmDelete(true)}
                  icon={<Trash2 size={16} />}
                >
                  Delete
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit?.(expense);
                  onClose();
                }}
                icon={<Edit2 size={16} />}
              >
                Edit
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Top Section: Large Amount, Description, Category Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 'var(--space-md)',
              borderBottom: '2px solid var(--border)',
              paddingBottom: 'var(--space-md)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 'bold',
                  lineHeight: 'var(--leading-none)',
                  marginBottom: 6,
                }}
              >
                {formatCurrency(expense.amount)}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {expense.description}
              </h3>
            </div>

            {/* Category badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '2px 2px 0px var(--border)',
                backgroundColor: categoryColor,
                fontWeight: 'bold',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-xs)',
                textTransform: 'uppercase',
              }}
            >
              <CategoryIcon size={16} strokeWidth={2.5} />
              <span>{categoryName}</span>
            </div>
          </div>

          {/* Paid by & Date Metadata */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
              padding: '6px 0',
            }}
          >
            {/* Payer Avatar & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="avatar avatar-sm avatar-yellow"
                style={{ border: '2px solid var(--border)' }}
              >
                {initials}
              </div>
              <div>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    display: 'block',
                  }}
                >
                  Paid by
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>
                  {payerName} {isPayer ? '(You)' : ''}
                </span>
              </div>
            </div>

            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={18} color="var(--text-secondary)" />
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {formatDate(expense.date)}
              </span>
            </div>
          </div>

          {/* Split Details Section */}
          <div style={{ marginTop: 'var(--space-xs)' }}>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Split Details ({splits.length} {splits.length === 1 ? 'member' : 'members'})
            </h4>

            <div
              style={{
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>Member</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {splits.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: 12, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No split records available
                      </td>
                    </tr>
                  ) : (
                    splits.map((s) => {
                      const isMe = s.userId === currentUserId;
                      const name = memberMap[s.userId] || 'Unknown';
                      return (
                        <tr
                          key={s.id || s.userId}
                          style={{
                            borderBottom: '1px dashed var(--border-light, rgba(23, 23, 23, 0.15))',
                            backgroundColor: isMe ? '#FFFDEB' : 'var(--surface)',
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: isMe ? 'bold' : 500 }}>
                            {name} {isMe ? '(You)' : ''}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(s.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Section */}
          {(receiptImageUrl || receiptData) && (
            <div style={{ marginTop: 'var(--space-xs)' }}>
              <h4
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Receipt size={16} />
                <span>Receipt Attachment</span>
              </h4>

              <div
                style={{
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                {receiptImageUrl ? (
                  <img
                    src={receiptImageUrl}
                    alt="Receipt"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 280,
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border)',
                      backgroundColor: '#F5F0E8',
                    }}
                  />
                ) : (
                  <div style={{ padding: 20, color: 'var(--text-secondary)' }}>
                    Receipt attached ({receiptData?.fileName || 'Image'})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense?"
        description="Are you sure you want to delete this expense? All split allocations and receipts will be permanently removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
