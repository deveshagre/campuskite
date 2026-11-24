import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import * as groupService from '../services/groupService';
import * as expenseService from '../services/expenseService';
import * as settlementService from '../services/settlementService';
import { getByIndex } from '../services/database';
import { calculateMemberBalances } from '../utils/calculations';
import BalanceCard from '../components/dashboard/BalanceCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import GroupOverview from '../components/dashboard/GroupOverview';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { Plus, TrendingUp, TrendingDown, Wallet, Users, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({
    totalYouOwe: 0,
    totalOwedToYou: 0,
    netBalance: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Get all user's groups
      const userGroups = await groupService.getUserGroups(user.id);

      let totalYouOwe = 0;
      let totalOwedToYou = 0;
      const enrichedGroups = [];
      const allActivities = [];

      // 2. For each group: get members, expenses, splits, settlements
      for (const group of userGroups) {
        const [members, expenses, settlements] = await Promise.all([
          groupService.getGroupMembers(group.id),
          expenseService.getGroupExpenses(group.id),
          settlementService.getGroupSettlements(group.id),
        ]);

        // Get splits for all expenses in this group
        const splits = [];
        for (const exp of expenses) {
          const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
          splits.push(...expSplits);
        }

        // 3. Calculate balances using calculateMemberBalances
        const memberBalances = calculateMemberBalances(expenses, splits, settlements);
        const myBalance = memberBalances[user.id] || 0;

        enrichedGroups.push({
          ...group,
          memberCount: members.length,
          balance: myBalance,
          members,
        });

        // 4. Aggregate: totalYouOwe (sum of negative balances), totalOwedToYou (sum of positive balances)
        if (myBalance < 0) {
          totalYouOwe += Math.abs(myBalance);
        } else if (myBalance > 0) {
          totalOwedToYou += myBalance;
        }

        // 5. Collect recent expenses & settlements across all groups
        const memberMap = {};
        members.forEach((m) => {
          memberMap[m.userId] = m.name || m.email;
        });

        expenses.forEach((exp) => {
          const isPayer = exp.paidBy === user.id;
          const payerName = isPayer ? 'You' : memberMap[exp.paidBy] || 'Member';
          allActivities.push({
            id: exp.id,
            type: 'expense',
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            date: exp.date || exp.createdAt,
            groupName: group.name,
            userName: payerName,
            createdAt: exp.createdAt || exp.date,
          });
        });

        settlements.forEach((st) => {
          if (st.status === 'completed') {
            const payerName = st.payerId === user.id ? 'You' : memberMap[st.payerId] || 'Member';
            const receiverName = st.receiverId === user.id ? 'You' : memberMap[st.receiverId] || 'Member';
            allActivities.push({
              id: st.id,
              type: 'settlement',
              description: `${payerName} paid ${receiverName}`,
              amount: st.amount,
              date: st.createdAt,
              groupName: group.name,
              userName: payerName,
              createdAt: st.createdAt,
            });
          }
        });
      }

      // Sort recent activity by date descending (newest first)
      allActivities.sort((a, b) => {
        const dateA = a.createdAt || a.date || '';
        const dateB = b.createdAt || b.date || '';
        return dateB.localeCompare(dateA);
      });

      const netBalance = totalOwedToYou - totalYouOwe;

      setGroups(enrichedGroups);
      setBalances({
        totalYouOwe,
        totalOwedToYou,
        netBalance,
      });
      setRecentActivity(allActivities.slice(0, 10));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard records');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenAddExpense = () => {
    if (groups.length === 0) {
      toast.info('Please create a group first before adding expenses');
      setIsCreateGroupOpen(true);
      return;
    }

    if (groups.length === 1) {
      setSelectedGroup(groups[0]);
      setIsAddExpenseOpen(true);
    } else {
      setIsGroupSelectOpen(true);
    }
  };

  const handleSelectGroupForExpense = (grp) => {
    setSelectedGroup(grp);
    setIsGroupSelectOpen(false);
    setIsAddExpenseOpen(true);
  };

  if (authLoading || (loading && groups.length === 0)) {
    return <Loader fullPage text="Loading CampusKite Dashboard..." />;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="page-container">
      {/* Header & Greeting */}
      <div className="page-header">
        <div>
          <h1
            className="page-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: 0,
            }}
          >
            <span>Hey, {firstName}!</span>
            <span role="img" aria-label="wave">
              👋
            </span>
          </h1>
          <p className="page-description">
            Track, split, and settle college expenses with your hostel mates and friends.
          </p>
        </div>

        {/* Quick actions row */}
        <div className="page-actions">
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => setIsCreateGroupOpen(true)}
          >
            New Group
          </Button>
          <Button
            variant="primary"
            icon={Receipt}
            onClick={handleOpenAddExpense}
          >
            New Expense
          </Button>
        </div>
      </div>

      {/* Empty State for New Users */}
      {groups.length === 0 ? (
        <div
          className="card card-yellow"
          style={{
            textAlign: 'center',
            padding: 'var(--space-3xl) var(--space-xl)',
            marginTop: 'var(--space-lg)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--surface)',
              border: '3px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow)',
              marginBottom: 'var(--space-md)',
            }}
          >
            <Users size={36} color="var(--text)" />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              margin: '0 0 var(--space-xs) 0',
            }}
          >
            Welcome to CampusKite!
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text)',
              maxWidth: '520px',
              margin: '0 auto var(--space-xl) auto',
              lineHeight: 1.5,
            }}
          >
            You are not part of any groups yet. Create a group for your dorm, mess, flatmates,
            or weekend trips to get started!
          </p>
          <Button
            variant="secondary"
            size="lg"
            icon={Plus}
            onClick={() => setIsCreateGroupOpen(true)}
          >
            Create Your First Group
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Grid with 3 BalanceCards */}
          <div className="stats-grid">
            <BalanceCard
              title="You Owe"
              amount={balances.totalYouOwe}
              type="owe"
              icon={TrendingDown}
            />
            <BalanceCard
              title="Owed To You"
              amount={balances.totalOwedToYou}
              type="owed"
              icon={TrendingUp}
            />
            <BalanceCard
              title="Net Balance"
              amount={balances.netBalance}
              type="net"
              icon={Wallet}
            />
          </div>

          {/* Group Overview Section */}
          <GroupOverview
            groups={groups}
            onCreateGroup={() => setIsCreateGroupOpen(true)}
          />

          {/* Recent Activity Section */}
          <RecentActivity activities={recentActivity} />
        </>
      )}

      {/* Modal: Create Group */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreated={() => {
          fetchDashboardData();
        }}
      />

      {/* Modal: Group Selector for Expense */}
      <Modal
        isOpen={isGroupSelectOpen}
        onClose={() => setIsGroupSelectOpen(false)}
        title="Select Group for Expense"
        size="sm"
      >
        <p style={{ margin: '0 0 var(--space-md) 0', color: 'var(--text-secondary)' }}>
          Choose which group this expense belongs to:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {groups.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => handleSelectGroupForExpense(grp)}
              className="card card-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderLeft: `6px solid ${grp.color || 'var(--primary)'}`,
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>
                  {grp.name}
                </strong>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {grp.memberCount} members
                </small>
              </div>
              <span className="badge badge-warning">Select</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Modal: Add Expense */}
      {selectedGroup && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setSelectedGroup(null);
          }}
          groupId={selectedGroup.id}
          members={selectedGroup.members || []}
          currentUserId={user?.id}
          onSaved={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
