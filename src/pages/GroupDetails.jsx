import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import * as groupService from '../services/groupService';
import * as expenseService from '../services/expenseService';
import * as settlementService from '../services/settlementService';
import { getByIndex } from '../services/database';
import { calculateMemberBalances, minimizeDebts } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseDetailsModal from '../components/expenses/ExpenseDetailsModal';
import ExpenseList from '../components/expenses/ExpenseList';
import AddMemberModal from '../components/groups/AddMemberModal';
import MemberList from '../components/groups/MemberList';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Users,
  Trash2,
  Edit2,
  PiggyBank,
  Wallet,
  Check,
  Receipt,
  Scale,
} from 'lucide-react';

const COLOR_SWATCHES = [
  { name: 'Yellow', value: '#FFDE59' },
  { name: 'Mint', value: '#B8E0D2' },
  { name: 'Coral', value: '#FF8066' },
  { name: 'Blue', value: '#93C5FD' },
  { name: 'Lavender', value: '#C4B5FD' },
];

const AVATAR_BG_COLORS = [
  'var(--primary)',
  'var(--mint)',
  'var(--coral)',
  '#93C5FD',
  '#C4B5FD',
  '#FDBA74',
];

function getMemberAvatarBg(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Core data states
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [memberBalances, setMemberBalances] = useState({});
  const [suggestedSettlements, setSuggestedSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'expenses' | 'members' | 'balances'
  const [activeTab, setActiveTab] = useState('expenses');

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Edit Group states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#FFDE59');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Group states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Settlement execution states
  const [settlementToConfirm, setSettlementToConfirm] = useState(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  // Fetch all group data from IndexedDB services
  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      const groupData = await groupService.getGroup(groupId);
      if (!groupData) {
        setGroup(null);
        setLoading(false);
        return;
      }
      setGroup(groupData);

      const [groupMembers, rawExpenses, rawSettlements] = await Promise.all([
        groupService.getGroupMembers(groupId),
        expenseService.getGroupExpenses(groupId),
        settlementService.getGroupSettlements(groupId),
      ]);

      // Enrich expenses with their splits
      const allSplits = [];
      const enrichedExpenses = await Promise.all(
        rawExpenses.map(async (exp) => {
          const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
          allSplits.push(...expSplits);
          return {
            ...exp,
            splits: expSplits,
          };
        })
      );

      // Calculate member balances
      const balances = calculateMemberBalances(enrichedExpenses, allSplits, rawSettlements);
      const settlements = minimizeDebts(balances);

      setMembers(groupMembers);
      setExpenses(enrichedExpenses);
      setMemberBalances(balances);
      setSuggestedSettlements(settlements);
    } catch (err) {
      console.error('Error fetching group data:', err);
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Map userId -> member name
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

  // Open Edit Group modal with prefilled values
  const handleOpenEditModal = () => {
    if (!group) return;
    setEditName(group.name || '');
    setEditDescription(group.description || '');
    setEditColor(group.color || '#FFDE59');
    setIsEditModalOpen(true);
  };

  // Submit Edit Group
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setEditSubmitting(true);
    try {
      const updated = await groupService.updateGroup(groupId, {
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor,
      });
      setGroup(updated);
      toast.success('Group updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update group');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Group trigger with balance check
  const handleDeleteGroupClick = () => {
    if (group?.createdBy !== user?.id) {
      toast.error('Only the group creator can delete this group');
      return;
    }

    const hasOutstandingBalances = Object.values(memberBalances).some(
      (balance) => Math.round(balance) !== 0
    );

    if (hasOutstandingBalances) {
      toast.error(
        'Cannot delete group with outstanding balances. All members must settle up first.'
      );
      return;
    }

    setIsDeleteDialogOpen(true);
  };

  // Confirm Delete Group
  const handleConfirmDeleteGroup = async () => {
    setDeleteLoading(true);
    try {
      await groupService.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (err) {
      toast.error(err.message || 'Failed to delete group');
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (userId) => {
    try {
      await groupService.removeMember(groupId, userId);
      toast.success('Member removed');
      await fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (!user) return;
    try {
      await expenseService.deleteExpense(expenseId, user.id);
      toast.success('Expense deleted');
      await fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  // Handle Edit Expense from details modal
  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(false);
    setIsAddExpenseOpen(true);
  };

  // Handle Add/Edit Expense saved
  const handleExpenseSaved = async () => {
    setIsAddExpenseOpen(false);
    setSelectedExpense(null);
    await fetchGroupData();
  };

  // Handle Settle Up confirmation
  const handleConfirmSettlement = async () => {
    if (!settlementToConfirm || !user) return;

    setSettlementLoading(true);
    try {
      await settlementService.createSettlement(
        groupId,
        settlementToConfirm.from,
        settlementToConfirm.to,
        settlementToConfirm.amount,
        user.id
      );

      const recipientName = memberMap[settlementToConfirm.to] || 'member';
      toast.success(`Settled ${formatCurrency(settlementToConfirm.amount)} with ${recipientName}!`);
      setSettlementToConfirm(null);
      await fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to record settlement');
    } finally {
      setSettlementLoading(false);
    }
  };

  if (loading && !group) {
    return <Loader fullPage text="Loading group details..." />;
  }

  if (!group) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
        <EmptyState
          icon={<Users size={48} />}
          title="Group not found"
          description="The group you are looking for does not exist or may have been deleted."
          actionLabel="Back to Groups"
          onAction={() => navigate('/groups')}
        />
      </div>
    );
  }

  const isCreator = group.createdBy === user?.id;
  const userBalance = memberBalances[user?.id] || 0;
  const hasOutstandingBalances = Object.values(memberBalances).some(
    (b) => Math.round(b) !== 0
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Back button */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link
          to="/groups"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            padding: '6px 12px',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-hover)',
          }}
        >
          <ArrowLeft size={16} /> Back to Groups
        </Link>
      </div>

      {/* Group Header Card */}
      <div
        className="card"
        style={{
          borderLeft: `10px solid ${group.color || 'var(--primary)'}`,
          marginBottom: 'var(--space-lg)',
          padding: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          {/* Group Info */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text)',
                }}
              >
                {group.name}
              </h1>
              <Badge variant="info">
                <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </Badge>
              {isCreator && (
                <Badge variant="warning">Creator</Badge>
              )}
            </div>

            {group.description && (
              <p
                style={{
                  marginTop: '8px',
                  marginBottom: 0,
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                {group.description}
              </p>
            )}

            {/* Quick status line */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Your status:
              </span>
              {userBalance > 0 ? (
                <Badge variant="success">Owed {formatCurrency(userBalance)}</Badge>
              ) : userBalance < 0 ? (
                <Badge variant="danger">You owe {formatCurrency(Math.abs(userBalance))}</Badge>
              ) : (
                <Badge variant="info">All settled up</Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              icon={Edit2}
              onClick={handleOpenEditModal}
              title="Edit Group"
            >
              Edit
            </Button>

            {isCreator && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleDeleteGroupClick}
                title={
                  hasOutstandingBalances
                    ? 'Cannot delete with outstanding balances'
                    : 'Delete Group'
                }
              >
                Delete
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setSelectedExpense(null);
                setIsAddExpenseOpen(true);
              }}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: 'var(--space-md)',
          borderBottom: '3px solid var(--border)',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'expenses' ? 'var(--primary)' : 'var(--surface)',
            color: 'var(--text)',
            boxShadow:
              activeTab === 'expenses'
                ? '3px 3px 0px var(--border)'
                : 'none',
            transform:
              activeTab === 'expenses' ? 'translate(-1px, -1px)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Receipt size={16} />
          Expenses ({expenses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'members' ? 'var(--primary)' : 'var(--surface)',
            color: 'var(--text)',
            boxShadow:
              activeTab === 'members'
                ? '3px 3px 0px var(--border)'
                : 'none',
            transform:
              activeTab === 'members' ? 'translate(-1px, -1px)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={16} />
          Members ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'balances' ? 'var(--primary)' : 'var(--surface)',
            color: 'var(--text)',
            boxShadow:
              activeTab === 'balances'
                ? '3px 3px 0px var(--border)'
                : 'none',
            transform:
              activeTab === 'balances' ? 'translate(-1px, -1px)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Scale size={16} />
          Balances
          {hasOutstandingBalances && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                display: 'inline-block',
              }}
            />
          )}
        </button>
      </div>

      {/* Tab 1: Expenses */}
      {activeTab === 'expenses' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Group Expenses
            </h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedExpense(null);
                setIsAddExpenseOpen(true);
              }}
            >
              Add Expense
            </Button>
          </div>

          <ExpenseList
            expenses={expenses}
            currentUserId={user?.id}
            onViewExpense={(expense) => {
              setSelectedExpense(expense);
              setIsDetailsOpen(true);
            }}
            members={members}
          />
        </div>
      )}

      {/* Tab 2: Members */}
      {activeTab === 'members' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Group Members ({members.length})
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                Members can only be removed if their balance is ₹0.00.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddMemberOpen(true)}
            >
              Add Member
            </Button>
          </div>

          <MemberList
            members={members}
            groupId={groupId}
            currentUserId={user?.id}
            onRemoveMember={handleRemoveMember}
            memberBalances={memberBalances}
          />
        </div>
      )}

      {/* Tab 3: Balances */}
      {activeTab === 'balances' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
          {/* Member Net Balances Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={20} />
              <h3 className="card-title" style={{ margin: 0 }}>Member Balances</h3>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                marginBottom: 'var(--space-md)',
              }}
            >
              Positive balances mean the member is owed money; negative means they owe money.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((m) => {
                const uid = m.userId || m.id;
                const isCurrent = uid === user?.id;
                const balance = memberBalances[uid] || 0;
                const rounded = Math.round(balance);
                const avatarBg = getMemberAvatarBg(m.name || m.email);
                const initials = getInitials(m.name || m.email);

                return (
                  <div
                    key={uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg)',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: avatarBg,
                          border: '2px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--text)',
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                            {m.name || 'Member'}
                          </span>
                          {isCurrent && <Badge variant="warning">You</Badge>}
                        </div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          {m.email}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {rounded > 0 ? (
                        <Badge variant="success">Gets {formatCurrency(rounded)}</Badge>
                      ) : rounded < 0 ? (
                        <Badge variant="danger">Owes {formatCurrency(Math.abs(rounded))}</Badge>
                      ) : (
                        <Badge variant="info">Settled up</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Settlements Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={20} />
              <h3 className="card-title" style={{ margin: 0 }}>Suggested Settlements</h3>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                marginBottom: 'var(--space-md)',
              }}
            >
              Calculated using debt minimization to resolve balances with the fewest payments.
            </p>

            {suggestedSettlements.length === 0 ? (
              <EmptyState
                icon={<PiggyBank size={36} />}
                title="All settled up!"
                description="There are no outstanding debts in this group. Everyone is completely square."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestedSettlements.map((settlement, idx) => {
                  const fromUser = settlement.from === user?.id ? 'You' : memberMap[settlement.from] || 'Member';
                  const toUser = settlement.to === user?.id ? 'You' : memberMap[settlement.to] || 'Member';
                  const isDebtor = settlement.from === user?.id;

                  return (
                    <div
                      key={`${settlement.from}-${settlement.to}-${idx}`}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: isDebtor ? 'var(--mint)' : 'var(--bg)',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '3px 3px 0px var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                            {fromUser}
                          </span>
                          <ArrowRight size={14} />
                          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                            {toUser}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 800,
                            fontSize: 'var(--font-size-base)',
                          }}
                        >
                          {formatCurrency(settlement.amount)}
                        </span>
                      </div>

                      {isDebtor && (
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            onClick={() => setSettlementToConfirm(settlement)}
                          >
                            Settle Up
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setSelectedExpense(null);
        }}
        groupId={groupId}
        members={members}
        currentUserId={user?.id}
        expense={selectedExpense}
        onSaved={handleExpenseSaved}
      />

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        expense={selectedExpense}
        members={members}
        currentUserId={user?.id}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupId={groupId}
        onMemberAdded={fetchGroupData}
        existingMembers={members}
      />

      {/* Edit Group Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Group"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={editSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateGroup}
              loading={editSubmitting}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Group Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Flat 302, Goa Trip"
            required
          />

          <div className="input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea
              className="input"
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="e.g. Shared grocery and apartment bills"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Group Theme Color</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => setEditColor(swatch.value)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: swatch.value,
                    border:
                      editColor === swatch.value
                        ? '3px solid var(--border)'
                        : '2px solid var(--border)',
                    boxShadow:
                      editColor === swatch.value
                        ? '3px 3px 0px var(--border)'
                        : 'none',
                    transform:
                      editColor === swatch.value ? 'translate(-2px, -2px)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title={swatch.name}
                >
                  {editColor === swatch.value && <Check size={16} color="var(--border)" />}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteGroup}
        title="Delete Group"
        message={`Are you sure you want to delete "${group?.name}"? All associated expenses, splits, and settlements will be permanently deleted.`}
        confirmText="Delete Group"
        danger={true}
        loading={deleteLoading}
      />

      {/* Settle Up Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(settlementToConfirm)}
        onClose={() => setSettlementToConfirm(null)}
        onConfirm={handleConfirmSettlement}
        title="Record Settlement"
        message={
          settlementToConfirm
            ? `Confirm that you paid ${formatCurrency(
                settlementToConfirm.amount
              )} to ${memberMap[settlementToConfirm.to] || 'member'}?`
            : ''
        }
        confirmText="Confirm Settlement"
        danger={false}
        variant="mint"
        loading={settlementLoading}
      />
    </div>
  );
}
