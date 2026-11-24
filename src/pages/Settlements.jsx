import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import SettlementSuggestions from '../components/settlements/SettlementSuggestions';
import SettlementHistory from '../components/settlements/SettlementHistory';
import BalanceList from '../components/settlements/BalanceList';
import * as settlementService from '../services/settlementService';
import * as groupService from '../services/groupService';
import * as expenseService from '../services/expenseService';
import { calculateMemberBalances, minimizeDebts } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { getByIndex } from '../services/database';
import { Users, Handshake, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';

/**
 * Settlements Page
 *
 * Full-page dashboard for debts, balances, optimized suggestions, and payment history.
 */
export default function Settlements() {
  const { user, userId, loading: authLoading } = useAuth();
  const toast = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Computed data states
  const [debts, setDebts] = useState([]); // all minimized debts with names & groupId
  const [settlements, setSettlements] = useState([]); // raw settlement records
  const [memberMap, setMemberMap] = useState({});
  const [totalYouOwe, setTotalYouOwe] = useState(0);
  const [totalOwedToYou, setTotalOwedToYou] = useState(0);

  const currentUserId = userId || user?.id;

  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's groups
      const userGroups = await groupService.getUserGroups(currentUserId);
      setGroups(userGroups);

      if (!userGroups || userGroups.length === 0) {
        setDebts([]);
        setSettlements([]);
        setMemberMap({});
        setTotalYouOwe(0);
        setTotalOwedToYou(0);
        setLoading(false);
        return;
      }

      // Determine which groups to inspect
      const targetGroups =
        selectedGroupId === 'all'
          ? userGroups
          : userGroups.filter((g) => g.id === selectedGroupId);

      const allMembersMap = {};
      const allDebts = [];
      const allSettlements = [];

      for (const grp of targetGroups) {
        // Fetch members
        const groupMembers = await groupService.getGroupMembers(grp.id);
        for (const m of groupMembers) {
          const uid = m.userId || m.id;
          if (uid) {
            allMembersMap[uid] = m.name || m.email || 'Unknown';
          }
        }

        // Fetch expenses & splits
        const groupExpenses = await expenseService.getGroupExpenses(grp.id);
        const groupSplits = [];
        for (const exp of groupExpenses) {
          const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
          if (Array.isArray(expSplits)) {
            groupSplits.push(...expSplits);
          }
        }

        // Fetch group settlements
        const grpSettlements = await settlementService.getGroupSettlements(grp.id);
        allSettlements.push(...grpSettlements);

        // Calculate balances for this group
        const groupBalances = calculateMemberBalances(groupExpenses, groupSplits, grpSettlements);

        // Run minimizeDebts for this group
        const groupDebts = minimizeDebts(groupBalances);

        for (const d of groupDebts) {
          allDebts.push({
            ...d,
            groupId: grp.id,
            groupName: grp.name,
            fromName: allMembersMap[d.from] || 'Unknown',
            toName: allMembersMap[d.to] || 'Unknown',
          });
        }
      }

      // Update member names in allDebts
      const enrichedDebts = allDebts.map((d) => ({
        ...d,
        fromName: allMembersMap[d.from] || d.fromName || 'Unknown',
        toName: allMembersMap[d.to] || d.toName || 'Unknown',
      }));

      // Calculate totals for current user
      let youOweSum = 0;
      let owedToYouSum = 0;

      for (const d of enrichedDebts) {
        if (d.from === currentUserId) {
          youOweSum += d.amount;
        } else if (d.to === currentUserId) {
          owedToYouSum += d.amount;
        }
      }

      // Deduplicate settlements if needed and sort newest first
      const uniqueSettlementsMap = new Map();
      for (const s of allSettlements) {
        uniqueSettlementsMap.set(s.id, s);
      }
      const uniqueSettlements = Array.from(uniqueSettlementsMap.values());
      uniqueSettlements.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      setDebts(enrichedDebts);
      setSettlements(uniqueSettlements);
      setMemberMap(allMembersMap);
      setTotalYouOwe(youOweSum);
      setTotalOwedToYou(owedToYouSum);
    } catch (err) {
      toast.error('Failed to load settlement data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId, selectedGroupId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleSettle = async (payerId, receiverId, amount, suggestionObj) => {
    try {
      const targetGroupId =
        suggestionObj?.groupId ||
        (selectedGroupId !== 'all' ? selectedGroupId : groups[0]?.id);

      if (!targetGroupId) {
        toast.error('Could not identify group for settlement');
        return;
      }

      await settlementService.createSettlement(
        targetGroupId,
        payerId,
        receiverId,
        amount,
        currentUserId
      );

      toast.success('Payment recorded!');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const handleCancelSettlement = async (settlementId) => {
    try {
      await settlementService.cancelSettlement(settlementId, currentUserId);
      toast.info('Payment cancelled');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel payment');
    }
  };

  if (authLoading || loading) {
    return (
      <div
        className="page-container"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <Loader size="lg" text="Calculating balances and debt settlements..." />
      </div>
    );
  }

  const youOweCount = debts.filter((d) => d.from === currentUserId).length;
  const owedToYouCount = debts.filter((d) => d.to === currentUserId).length;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Settlements</h2>
          <p className="page-description">
            Review your net balances, settle debts with friends, and view complete transaction history.
          </p>
        </div>

        {/* Group Filter Dropdown & Refresh */}
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <select
              className="select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ minWidth: 200 }}
              aria-label="Filter by group"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualRefresh}
              loading={refreshing}
              icon={<RefreshCw size={16} />}
              title="Refresh balances"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title="No groups found"
          description="You are not a member of any group yet. Join or create a group to start managing expenses and settlements."
        />
      ) : (
        <>
          {/* SECTION 1: Summary Cards (Total You Owe, Total Owed To You) */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="stat-card" style={{ borderLeft: '6px solid var(--danger)' }}>
              <span className="stat-label">Total You Owe</span>
              <span
                className="stat-value"
                style={{
                  color: totalYouOwe > 0 ? 'var(--danger)' : 'var(--text)',
                }}
              >
                {formatCurrency(totalYouOwe)}
              </span>
              <span className="stat-meta">
                {youOweCount > 0
                  ? `Across ${youOweCount} ${youOweCount === 1 ? 'person' : 'people'}`
                  : 'You have no outstanding debts'}
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: '6px solid var(--success)' }}>
              <span className="stat-label">Total Owed To You</span>
              <span
                className="stat-value"
                style={{
                  color: totalOwedToYou > 0 ? 'var(--success)' : 'var(--text)',
                }}
              >
                {formatCurrency(totalOwedToYou)}
              </span>
              <span className="stat-meta">
                {owedToYouCount > 0
                  ? `From ${owedToYouCount} ${owedToYouCount === 1 ? 'person' : 'people'}`
                  : 'No pending payments owed to you'}
              </span>
            </div>
          </div>

          {/* Balance breakdown (You Owe / Others Owe You) */}
          <BalanceList
            debts={debts}
            currentUserId={currentUserId}
            onSettle={(item) => handleSettle(item.from, item.to, item.amount, item)}
          />

          {/* SECTION 2: Settlement Suggestions */}
          <SettlementSuggestions
            suggestions={debts}
            currentUserId={currentUserId}
            onSettle={handleSettle}
          />

          {/* SECTION 3: Settlement Payment History */}
          <SettlementHistory
            settlements={settlements}
            currentUserId={currentUserId}
            memberMap={memberMap}
            onCancel={handleCancelSettlement}
          />
        </>
      )}
    </div>
  );
}
