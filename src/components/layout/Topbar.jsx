import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, User, Settings as SettingsIcon, LogOut, Users } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import AddExpenseModal from '../expenses/AddExpenseModal';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import * as groupService from '../../services/groupService';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/groups': 'My Groups',
  '/settlements': 'Settlements',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/expenses': 'Expenses',
  '/login': 'Sign In',
  '/register': 'Register',
};

/**
 * Derives a clean page title from pathname
 *
 * @param {string} pathname
 * @returns {string} Page title
 */
function getPageTitle(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  if (pathname.startsWith('/groups/')) {
    return 'Group Details';
  }
  if (pathname.startsWith('/expenses/')) {
    return 'Expense Details';
  }

  const segment = pathname.replace(/^\//, '').split('/')[0];
  if (segment) {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  return 'Dashboard';
}

/**
 * Topbar Component
 * Title from current route + functional Add Expense modal & interactive profile dropdown menu.
 */
export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const title = getPageTitle(location.pathname);
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const menuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleAddExpenseClick = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    try {
      const groups = await groupService.getUserGroups(user.id);
      setUserGroups(groups);

      if (!groups || groups.length === 0) {
        toast.info('Please create a group first to start recording expenses!');
        navigate('/groups');
        return;
      }

      if (groups.length === 1) {
        const members = await groupService.getGroupMembers(groups[0].id);
        setSelectedGroup({ ...groups[0], members });
        setIsAddExpenseOpen(true);
      } else {
        setIsGroupSelectOpen(true);
      }
    } catch (err) {
      console.error('Failed to prepare add expense:', err);
      navigate('/groups');
    }
  };

  const handleSelectGroup = async (group) => {
    try {
      const members = await groupService.getGroupMembers(group.id);
      setSelectedGroup({ ...group, members });
      setIsGroupSelectOpen(false);
      setIsAddExpenseOpen(true);
    } catch {
      toast.error('Failed to load group members');
    }
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions" style={{ position: 'relative' }}>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={18} />}
          onClick={handleAddExpenseClick}
          title="Record a shared expense"
        >
          Add Expense
        </Button>

        {/* Profile Avatar Trigger */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="avatar avatar-sm avatar-yellow"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            title={user?.name || 'User Profile'}
            aria-label={user?.name ? `${user.name}'s profile menu` : 'User profile menu'}
            aria-expanded={isProfileMenuOpen}
            style={{
              cursor: 'pointer',
              border: '2px solid var(--border)',
              fontWeight: 700,
              color: 'var(--text)',
              fontSize: '0.85rem',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isProfileMenuOpen ? 'none' : '2px 2px 0px var(--border)',
              transform: isProfileMenuOpen ? 'translate(2px, 2px)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {initial}
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '260px',
                zIndex: 1000,
                backgroundColor: 'var(--surface)',
                border: '3px solid var(--border)',
                boxShadow: 'var(--shadow)',
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}
            >
              {/* User details card header */}
              <div
                style={{
                  borderBottom: '2px solid var(--border)',
                  paddingBottom: 'var(--space-sm)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text)',
                  }}
                >
                  {user?.name || 'Campus Student'}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email || ''}
                </div>
              </div>

              {/* Navigation Links */}
              <Link
                to="/groups"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: '1.5px solid transparent',
                }}
                className="dropdown-item-hover"
              >
                <Users size={16} /> My Groups
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: '1.5px solid transparent',
                }}
                className="dropdown-item-hover"
              >
                <SettingsIcon size={16} /> Settings
              </Link>

              <div style={{ borderTop: '2px solid var(--border)', margin: 'var(--space-xs) 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  width: '100%',
                }}
                className="dropdown-item-hover"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Select Group Modal for Add Expense */}
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
          {userGroups.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => handleSelectGroup(grp)}
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
                  {grp.description || 'Shared expenses'}
                </small>
              </div>
              <span className="badge badge-warning">Select</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Add Expense Modal */}
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
            setIsAddExpenseOpen(false);
            setSelectedGroup(null);
            // If on a page that displays expenses, reload or toast
            toast.success('Expense recorded!');
          }}
        />
      )}
    </header>
  );
}

export { Topbar };
