import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import * as groupService from '../services/groupService';
import * as expenseService from '../services/expenseService';
import * as settlementService from '../services/settlementService';
import { getByIndex } from '../services/database';
import { calculateMemberBalances } from '../utils/calculations';
import GroupCard from '../components/groups/GroupCard';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { Plus, Search, Users } from 'lucide-react';

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userGroups = await groupService.getUserGroups(user.id);

      const enriched = await Promise.all(
        userGroups.map(async (group) => {
          const [members, expenses, settlements] = await Promise.all([
            groupService.getGroupMembers(group.id),
            expenseService.getGroupExpenses(group.id),
            settlementService.getGroupSettlements(group.id),
          ]);

          const splits = [];
          for (const exp of expenses) {
            const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
            splits.push(...expSplits);
          }

          const balances = calculateMemberBalances(expenses, splits, settlements);
          const myBalance = balances[user.id] || 0;

          return {
            ...group,
            memberCount: members.length,
            balance: myBalance,
            members,
          };
        })
      );

      setGroups(enriched);
    } catch (err) {
      console.error('Failed to load groups:', err);
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [groups, searchTerm]);

  if (authLoading || (loading && groups.length === 0)) {
    return <Loader fullPage text="Loading your groups..." />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            My Groups
          </h1>
          <Badge variant="warning">
            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          </Badge>
        </div>

        <div className="page-actions">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Group
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {groups.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)', maxWidth: '420px', position: 'relative' }}>
          <input
            type="text"
            className="input"
            placeholder="Search groups by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
        </div>
      )}

      {/* Groups Grid / Empty State */}
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends, roommates, or travel buddies."
          actionText="Create First Group"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No groups found"
          description={`No groups matching "${searchTerm}". Try a different keyword.`}
          actionText="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-lg)',
          }}
        >
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Modal: Create Group */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          fetchGroups();
        }}
      />
    </div>
  );
}
