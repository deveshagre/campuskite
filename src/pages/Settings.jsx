import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  User,
  Lock,
  Database,
  Info,
  LogOut,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Loader from '../components/common/Loader';
import * as authService from '../services/authService';
import * as demoDataService from '../services/demoDataService';
import * as storageService from '../services/storageService';
import { formatDate } from '../utils/date';

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUser, changePassword, logout } = useAuth();
  const toast = useToast();

  // Section 1: Account Information State
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize display name from user
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  // Section 2: Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Section 3: Demo Data Confirmation Dialogs
  const [showLoadDemoDialog, setShowLoadDemoDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [loadingDemoAction, setLoadingDemoAction] = useState(false);

  // Section 4: Data Management State
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [importingData, setImportingData] = useState(false);
  const fileInputRef = useRef(null);

  // Section 6: Sign Out Confirmation Dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // --- Handlers ---

  // 1. Account Info: Save Display Name
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user?.id) {
      toast.error('No authenticated user found');
      return;
    }

    const trimmed = displayName.trim();
    if (!trimmed) {
      toast.error('Display name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await authService.updateProfile(user.id, { name: trimmed });
      if (updateUser) {
        updateUser(updatedUser);
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Security: Change Password
  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      const msg = 'All password fields are required';
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters';
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'New password and confirm password do not match';
      setPasswordError(msg);
      toast.error(msg);
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (err) {
      console.error('Failed to change password:', err);
      const errMsg = err.message || 'Failed to change password';
      setPasswordError(errMsg);
      toast.error(errMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  // 3. Demo Data: Load Demo Data
  const handleConfirmLoadDemo = async () => {
    setLoadingDemoAction(true);
    try {
      await demoDataService.loadDemoData();
      setShowLoadDemoDialog(false);
      toast.success('Demo data loaded successfully! Please refresh the page to view changes.');
    } catch (err) {
      console.error('Failed to load demo data:', err);
      toast.error(err.message || 'Failed to load demo data');
    } finally {
      setLoadingDemoAction(false);
    }
  };

  // 3. Demo Data: Clear All Data
  const handleConfirmClearData = async () => {
    setLoadingDemoAction(true);
    try {
      await demoDataService.clearAllData();
      if (logout) logout();
      setShowClearDataDialog(false);
      toast.info('All data has been permanently cleared.');
      navigate('/login');
    } catch (err) {
      console.error('Failed to clear data:', err);
      toast.error(err.message || 'Failed to clear data');
      setLoadingDemoAction(false);
    }
  };

  // 4. Data Management: Export Data
  const handleExportData = async () => {
    try {
      const allData = await storageService.exportAllData();
      const jsonString = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'campuskite-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully as campuskite-data.json');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export data: ' + err.message);
    }
  };

  // 4. Data Management: File Input Selected
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('File does not contain a valid JSON object structure');
        }

        setPendingImportData(parsed);
        setShowImportDialog(true);
      } catch (err) {
        console.error('Invalid JSON file:', err);
        toast.error('Invalid backup file. Please select a valid campuskite-data.json backup.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // 4. Data Management: Confirm Import
  const handleConfirmImport = async () => {
    if (!pendingImportData) return;

    setImportingData(true);
    try {
      await storageService.importAllData(pendingImportData);
      setShowImportDialog(false);
      setPendingImportData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Data imported successfully! Please refresh the page to see changes.');
    } catch (err) {
      console.error('Import failed:', err);
      toast.error('Failed to import data: ' + err.message);
    } finally {
      setImportingData(false);
    }
  };

  // 6. Sign Out
  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    if (logout) logout();
    navigate('/login');
  };

  if (authLoading) {
    return <Loader fullPage text="Loading settings..." />;
  }

  const memberSinceFormatted = user?.createdAt
    ? formatDate(user.createdAt)
    : 'August 2026';

  return (
    <div
      className="page-container"
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: 'var(--space-lg)',
      }}
    >
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>
            Settings
          </h1>
          <p
            className="page-description"
            style={{
              marginTop: 'var(--space-xs)',
              marginBottom: 0,
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-base)',
            }}
          >
            Manage your account profile, credentials, demo dataset, and local storage.
          </p>
        </div>
      </div>

      {/* SECTION 1: Account Information */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <User size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            Account Information
          </h3>
        </div>
        <p className="settings-section-desc">
          Update your public campus display name and view your registered profile details.
        </p>

        <form noValidate onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <Input
                label="Display Name"
                id="settings-display-name"
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
              style={{ marginBottom: 2 }}
            >
              Save
            </Button>
          </div>

          <div>
            <Input
              label="Email Address"
              id="settings-email"
              name="email"
              value={user?.email || ''}
              disabled
              style={{
                backgroundColor: 'var(--surface-muted)',
                color: 'var(--text-secondary)',
                cursor: 'not-allowed',
              }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Email address cannot be changed.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              paddingTop: 'var(--space-xs)',
            }}
          >
            <Calendar size={16} />
            <span>Member since {memberSinceFormatted}</span>
          </div>
        </form>
      </div>

      {/* SECTION 2: Security (Change Password) */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Lock size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            Security
          </h3>
        </div>
        <p className="settings-section-desc">
          Change your password to ensure your account and campus transactions stay protected.
        </p>

        <form noValidate onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Current Password"
            id="settings-current-password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div>
            <Input
              label="New Password"
              id="settings-new-password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <Input
            label="Confirm New Password"
            id="settings-confirm-password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />

          {passwordError && (
            <div
              className="input-error-msg"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--danger)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <AlertTriangle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              loading={changingPassword}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Demo Data */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Database size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            Demo Data
          </h3>
        </div>
        <p className="settings-section-desc">
          Load sample data to explore CampusKite's features
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--surface-alt)',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                Populate Sample Campus Data
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Creates 4 student roommates, 3 groups, and 18 expenses across 3 months.
              </div>
            </div>
            <Button
              variant="mint"
              onClick={() => setShowLoadDemoDialog(true)}
            >
              Load Demo Data
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md)',
              border: '2px solid var(--danger)',
              borderRadius: 'var(--radius)',
              backgroundColor: '#FFF8F8',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--danger)' }}>
                Reset & Clear Database
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                This will permanently delete all your data
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowClearDataDialog(true)}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Data Management */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Download size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            Data Management
          </h3>
        </div>
        <p className="settings-section-desc">
          Export full JSON backups of your transactions or import previously exported data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Export */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--surface-alt)',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                Backup Local Database
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Save all groups, expenses, splits, and user profiles as a local file.
              </div>
            </div>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={handleExportData}
            >
              Export Data
            </Button>
          </div>

          {/* Import */}
          <div
            style={{
              padding: 'var(--space-md)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--surface-alt)',
            }}
          >
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-xs)' }}>
              Import Backup File
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              Select a valid <code>campuskite-data.json</code> file to restore. All existing data will be replaced.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                aria-label="Upload Backup JSON File"
                style={{
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  backgroundColor: 'var(--surface)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: About CampusKite */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Info size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            About CampusKite
          </h3>
        </div>
        <p className="settings-section-desc">
          Application information, privacy guarantees, and local architecture.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            backgroundColor: 'var(--surface-alt)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ fontSize: '1.5rem' }}>🪁</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-lg)' }}>
                CampusKite
              </span>
            </div>
            <Badge variant="warning">Version 1.0.0</Badge>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
            <Badge variant="info">Frontend-only application</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒</span>
              <span>All data is stored locally in your browser</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚫</span>
              <span>Data does not sync across devices or browsers</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: Sign Out */}
      <div className="card settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <LogOut size={22} color="var(--text)" />
          <h3 className="settings-section-title" style={{ margin: 0 }}>
            Sign Out
          </h3>
        </div>
        <p className="settings-section-desc">
          Log out of your current session on this computer.
        </p>

        <Button
          variant="secondary"
          icon={<LogOut size={18} />}
          onClick={() => setShowLogoutDialog(true)}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 'var(--font-size-base)',
          }}
        >
          Sign Out of CampusKite
        </Button>
      </div>

      {/* Confirmation Dialogs */}

      {/* Load Demo Data Confirmation */}
      <ConfirmDialog
        isOpen={showLoadDemoDialog}
        onClose={() => setShowLoadDemoDialog(false)}
        onConfirm={handleConfirmLoadDemo}
        title="Load Demo Data?"
        message="This will overwrite current data and populate sample student groups (Apartment 4B, Road Trip, Study Group) and realistic expenses. Are you sure you want to proceed?"
        confirmText="Load Demo Data"
        cancelText="Cancel"
        variant="mint"
        danger={false}
        loading={loadingDemoAction}
      />

      {/* Clear All Data Confirmation */}
      <ConfirmDialog
        isOpen={showClearDataDialog}
        onClose={() => setShowClearDataDialog(false)}
        onConfirm={handleConfirmClearData}
        title="Clear All Data?"
        message="Warning: This will permanently delete all your data including your user account, groups, expenses, and settlements. This action cannot be undone."
        confirmText="Delete All Data"
        cancelText="Cancel"
        variant="danger"
        danger={true}
        loading={loadingDemoAction}
      />

      {/* Import Backup Confirmation */}
      <ConfirmDialog
        isOpen={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setPendingImportData(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={handleConfirmImport}
        title="Import Backup Data?"
        message="This will replace all existing data with the records from the uploaded file. Are you sure you want to proceed?"
        confirmText="Import Backup"
        cancelText="Cancel"
        variant="primary"
        danger={false}
        loading={importingData}
      />

      {/* Sign Out Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out?"
        message="Are you sure you want to sign out of CampusKite?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="secondary"
        danger={false}
      />
    </div>
  );
}
