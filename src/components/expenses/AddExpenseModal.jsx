import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import SplitPreview from './SplitPreview';
import ReceiptUploader from './ReceiptUploader';
import * as expenseService from '../../services/expenseService';
import { equalSplit, validateCustomSplit } from '../../utils/calculations';
import { toPaise, toRupees, formatCurrency } from '../../utils/currency';
import { toISODateString } from '../../utils/date';
import { Users, DollarSign, CheckSquare, Square } from 'lucide-react';

const CATEGORIES = ['Food', 'Groceries', 'Rent', 'Utilities', 'Travel', 'Other'];

/**
 * AddExpenseModal Component
 *
 * Full-featured modal to add a new expense or edit an existing expense.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.groupId
 * @param {Array<Object>} props.members - List of group members
 * @param {string} props.currentUserId
 * @param {Object|null} [props.expense=null] - Expense to edit, or null for new
 * @param {Function} props.onSaved - Callback triggered after successful save
 */
export default function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  members = [],
  currentUserId,
  expense = null,
  onSaved,
}) {
  const toast = useToast();

  const isEditMode = Boolean(expense);

  // Form states
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState('');
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'
  const [selectedMembers, setSelectedMembers] = useState([]); // array of userIds
  const [customAmounts, setCustomAmounts] = useState({}); // userId -> rupees string
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Member user IDs list
  const memberIds = useMemo(() => {
    return members.map((m) => m.userId || m.id).filter(Boolean);
  }, [members]);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      setDescription(expense.description || '');
      setAmountRupees(expense.amount ? String(toRupees(expense.amount)) : '');
      setCategory(expense.category || 'Food');
      setPaidBy(expense.paidBy || currentUserId || memberIds[0] || '');
      setDate(expense.date || toISODateString(new Date()));
      setSplitType(expense.splitType || 'equal');

      if (Array.isArray(expense.splits) && expense.splits.length > 0) {
        const uids = expense.splits.map((s) => s.userId);
        setSelectedMembers(uids);

        const customMap = {};
        for (const s of expense.splits) {
          customMap[s.userId] = String(toRupees(s.amount));
        }
        setCustomAmounts(customMap);
      } else {
        setSelectedMembers(memberIds);
        setCustomAmounts({});
      }

      setReceipt(expense.receipt || (expense.receiptId ? { id: expense.receiptId } : null));
    } else {
      // New Expense Defaults
      setDescription('');
      setAmountRupees('');
      setCategory('Food');
      setPaidBy(currentUserId || memberIds[0] || '');
      setDate(toISODateString(new Date()));
      setSplitType('equal');
      setSelectedMembers(memberIds);
      setCustomAmounts({});
      setReceipt(null);
    }

    setErrors({});
  }, [isOpen, expense, currentUserId, memberIds]);

  const totalPaise = useMemo(() => {
    const parsed = parseFloat(amountRupees);
    return isNaN(parsed) || parsed <= 0 ? 0 : toPaise(parsed);
  }, [amountRupees]);

  // Compute split participants for SplitPreview
  const previewParticipants = useMemo(() => {
    if (splitType === 'equal') {
      if (selectedMembers.length === 0 || totalPaise <= 0) {
        return selectedMembers.map((uid) => ({
          userId: uid,
          name: memberMap[uid] || 'Unknown',
          amount: 0,
        }));
      }

      const shares = equalSplit(totalPaise, selectedMembers.length);
      return selectedMembers.map((uid, idx) => ({
        userId: uid,
        name: memberMap[uid] || 'Unknown',
        amount: shares[idx] || 0,
      }));
    } else {
      // Custom split
      return memberIds.map((uid) => {
        const val = parseFloat(customAmounts[uid]);
        const paiseVal = !isNaN(val) && val >= 0 ? toPaise(val) : 0;
        return {
          userId: uid,
          name: memberMap[uid] || 'Unknown',
          amount: paiseVal,
        };
      });
    }
  }, [splitType, selectedMembers, totalPaise, memberMap, memberIds, customAmounts]);

  // Toggle member selection in equal split
  const handleToggleMember = (uid) => {
    setErrors((prev) => ({ ...prev, participants: null }));
    if (selectedMembers.includes(uid)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== uid));
    } else {
      setSelectedMembers([...selectedMembers, uid]);
    }
  };

  // Select all members for equal split
  const handleSelectAll = () => {
    setSelectedMembers(memberIds);
  };

  // Update a member's custom amount
  const handleCustomAmountChange = (uid, val) => {
    setErrors((prev) => ({ ...prev, customSplit: null }));
    setCustomAmounts((prev) => ({
      ...prev,
      [uid]: val,
    }));
  };

  // Custom running total in paise
  const customSumPaise = useMemo(() => {
    if (splitType !== 'custom') return 0;
    return memberIds.reduce((sum, uid) => {
      const val = parseFloat(customAmounts[uid]);
      return sum + (!isNaN(val) && val >= 0 ? toPaise(val) : 0);
    }, 0);
  }, [splitType, memberIds, customAmounts]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const newErrors = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const numAmount = parseFloat(amountRupees);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }

    if (splitType === 'equal') {
      if (selectedMembers.length < 2) {
        newErrors.participants = 'At least 2 members must be selected for an equal split';
      }
    } else {
      // Custom split validation
      const participantsWithAmount = memberIds.filter((uid) => {
        const val = parseFloat(customAmounts[uid]);
        return !isNaN(val) && val > 0;
      });

      if (participantsWithAmount.length < 1) {
        newErrors.customSplit = 'At least 1 participant must have an amount assigned';
      } else {
        const splitAmounts = participantsWithAmount.map((uid) =>
          toPaise(parseFloat(customAmounts[uid]) || 0)
        );
        const validation = validateCustomSplit(splitAmounts, totalPaise);
        if (!validation.valid) {
          newErrors.customSplit = validation.error || 'Custom amounts must sum to total amount';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstMsg = Object.values(newErrors)[0];
      toast.error(firstMsg);
      return;
    }

    setLoading(true);

    try {
      let participants = [];
      let customMapPaise = undefined;

      if (splitType === 'equal') {
        participants = selectedMembers;
      } else {
        // In custom split, participants are all members with > 0 paise
        participants = memberIds.filter((uid) => {
          const val = parseFloat(customAmounts[uid]);
          return !isNaN(val) && val > 0;
        });

        customMapPaise = {};
        for (const uid of participants) {
          customMapPaise[uid] = toPaise(parseFloat(customAmounts[uid]) || 0);
        }
      }

      // Receipt payload
      let receiptFile = undefined;
      if (receipt) {
        if (receipt.file instanceof Blob || receipt.file instanceof File) {
          receiptFile = receipt.file;
        } else if (receipt instanceof Blob || receipt instanceof File) {
          receiptFile = receipt;
        } else if (receipt.data instanceof ArrayBuffer) {
          receiptFile = new File([receipt.data], receipt.fileName || 'receipt.jpg', {
            type: receipt.fileType || 'image/jpeg',
          });
        }
      } else if (isEditMode && expense.receiptId && receipt === null) {
        receiptFile = null; // explicit delete
      }

      const expensePayload = {
        groupId: groupId || expense?.groupId,
        description: description.trim(),
        amount: totalPaise,
        category,
        paidBy,
        date: date || toISODateString(new Date()),
        splitType,
        participants,
        customAmounts: customMapPaise,
        receiptFile,
      };

      if (isEditMode) {
        await expenseService.updateExpense(expense.id, expensePayload);
        toast.success('Expense updated successfully!');
      } else {
        await expenseService.createExpense(expensePayload);
        toast.success('Expense added successfully!');
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Expense' : 'Add Expense'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Description & Amount */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          <Input
            label="Description"
            required
            placeholder="e.g. Domino's Pizza, Uber to Campus"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            error={errors.description}
          />

          <Input
            label="Amount (₹)"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amountRupees}
            onChange={(e) => {
              setAmountRupees(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
            }}
            error={errors.amount}
          />
        </div>

        {/* Category, Paid By & Date */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-sm)',
          }}
        >
          {/* Category */}
          <div className="input-group">
            <label className="input-label">Category</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Paid By */}
          <div className="input-group">
            <label className="input-label">
              Paid By
              <span className="required" style={{ color: 'var(--danger)', marginLeft: 3 }}>
                *
              </span>
            </label>
            <select
              className={`select ${errors.paidBy ? 'error' : ''}`}
              value={paidBy}
              onChange={(e) => {
                setPaidBy(e.target.value);
                if (errors.paidBy) setErrors((prev) => ({ ...prev, paidBy: null }));
              }}
            >
              <option value="" disabled>
                Select member...
              </option>
              {members.map((m) => {
                const uid = m.userId || m.id;
                return (
                  <option key={uid} value={uid}>
                    {m.name || m.email} {uid === currentUserId ? '(You)' : ''}
                  </option>
                );
              })}
            </select>
            {errors.paidBy && <span className="input-error-msg">{errors.paidBy}</span>}
          </div>

          {/* Date */}
          <div className="input-group">
            <label className="input-label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Split Type Toggle Buttons */}
        <div style={{ marginTop: 'var(--space-md)' }}>
          <label className="input-label" style={{ marginBottom: 6 }}>
            Split Type
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button
              type="button"
              variant={splitType === 'equal' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setSplitType('equal');
                setErrors((prev) => ({ ...prev, participants: null, customSplit: null }));
              }}
              style={{ flex: 1 }}
            >
              Split Equally
            </Button>
            <Button
              type="button"
              variant={splitType === 'custom' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setSplitType('custom');
                setErrors((prev) => ({ ...prev, participants: null, customSplit: null }));
              }}
              style={{ flex: 1 }}
            >
              Custom Amounts
            </Button>
          </div>
        </div>

        {/* Split Details Section */}
        <div
          style={{
            marginTop: 'var(--space-md)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {splitType === 'equal' ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Select Participants ({selectedMembers.length} selected)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)' }}
                >
                  Select All
                </Button>
              </div>

              {/* Members checkboxes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 'var(--space-xs)',
                  maxHeight: 180,
                  overflowY: 'auto',
                  padding: '4px 0',
                }}
              >
                {members.map((m) => {
                  const uid = m.userId || m.id;
                  const isChecked = selectedMembers.includes(uid);
                  const isPayer = uid === paidBy;

                  return (
                    <label
                      key={uid}
                      data-testid={`member-toggle-${uid}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--border)',
                        backgroundColor: isChecked ? '#FFFDEB' : 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: isChecked ? 600 : 400,
                        userSelect: 'none',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={m.name || m.email || uid}
                        checked={isChecked}
                        onChange={() => handleToggleMember(uid)}
                        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
                      />
                      {isChecked ? (
                        <CheckSquare size={18} color="var(--primary-hover, #F0CF45)" />
                      ) : (
                        <Square size={18} color="var(--border)" />
                      )}
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name || m.email} {isPayer ? '(Payer)' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>

              {errors.participants && (
                <span className="input-error-msg" style={{ marginTop: 6 }}>
                  {errors.participants}
                </span>
              )}
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Enter Share for Each Member
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 'bold',
                    color:
                      Math.round(customSumPaise) === Math.round(totalPaise) && totalPaise > 0
                        ? 'var(--success)'
                        : 'var(--danger)',
                  }}
                >
                  Assigned: {formatCurrency(customSumPaise)} / {formatCurrency(totalPaise)}
                </span>
              </div>

              {/* Custom amount input list */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: 200,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {members.map((m) => {
                  const uid = m.userId || m.id;
                  const isPayer = uid === paidBy;

                  return (
                    <div
                      key={uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '6px 10px',
                        border: '1px solid var(--border-light, rgba(23, 23, 23, 0.15))',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                          flex: 1,
                        }}
                      >
                        {m.name || m.email} {isPayer ? '(Payer)' : ''}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          width: 140,
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="input"
                          style={{ padding: '6px 8px', fontSize: 'var(--font-size-sm)' }}
                          value={customAmounts[uid] ?? ''}
                          onChange={(e) => handleCustomAmountChange(uid, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.customSplit && (
                <span className="input-error-msg" style={{ marginTop: 6 }}>
                  {errors.customSplit}
                </span>
              )}
            </div>
          )}

          {/* SplitPreview */}
          <SplitPreview
            splitType={splitType}
            totalAmountPaise={totalPaise}
            participants={previewParticipants}
          />
        </div>

        {/* Receipt Uploader */}
        <div style={{ marginTop: 'var(--space-md)' }}>
          <ReceiptUploader
            value={receipt}
            onChange={(rec) => setReceipt(rec)}
            onRemove={() => setReceipt(null)}
          />
        </div>
      </form>
    </Modal>
  );
}
