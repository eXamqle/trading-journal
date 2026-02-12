import React, { useState, useEffect } from 'react';
import { User, Shield, Tag, Plus, X, Settings } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useCurrency } from './contexts/CurrencyContext';
import { authAPI } from './api/auth';
import { tagsAPI } from './api/tags';
import ColorPicker from './ColorPicker';

function Profile({ availableTags, setAvailableTags }) {
  const { user, updateUser } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('account');
  const [accountData, setAccountData] = useState({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Notice' });
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', title: 'Confirm', onConfirm: null });
  const [showSuccess, setShowSuccess] = useState(false);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setAccountData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleAccountChange = (e) => {
    const { id, value } = e.target;
    setAccountData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleUpdateAccount = async () => {
    try {
      const { data } = await authAPI.updateProfile(accountData);
      updateUser(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'An unexpected error occurred. Please try again.',
        title: 'Failed to Update Account'
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setAlertModal({ open: true, message: 'Please fill in all password fields.', title: 'Validation Error' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlertModal({ open: true, message: 'The new passwords do not match. Please try again.', title: 'Validation Error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setAlertModal({ open: true, message: 'New password must be at least 6 characters long.', title: 'Validation Error' });
      return;
    }

    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'An unexpected error occurred. Please try again.',
        title: 'Failed to Update Password'
      });
    }
  };

  const handleAddTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      setAlertModal({ open: true, message: 'Please enter a tag name.', title: 'Validation Error' });
      return;
    }
    if (availableTags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAlertModal({ open: true, message: 'A tag with this name already exists.', title: 'Duplicate Tag' });
      return;
    }

    try {
      const { data } = await tagsAPI.create({ name: trimmedName, color: newTagColor });
      setAvailableTags([...availableTags, { name: data.tag.name, color: data.tag.color, id: data.tag.id }]);
      setNewTagName('');
      setNewTagColor('#3b82f6');
    } catch (error) {
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'Failed to create tag. Please try again.',
        title: 'Error'
      });
    }
  };

  const handleDeleteTag = async (index) => {
    const tag = availableTags[index];
    try {
      await tagsAPI.delete(tag.id);
      setAvailableTags(availableTags.filter((_, i) => i !== index));
    } catch (error) {
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'Failed to delete tag. Please try again.',
        title: 'Error'
      });
    }
  };

  const handleUpdateTagColor = async (index, newColor) => {
    const tag = availableTags[index];
    try {
      await tagsAPI.update(tag.id, { name: tag.name, color: newColor });
      const updatedTags = [...availableTags];
      updatedTags[index].color = newColor;
      setAvailableTags(updatedTags);
    } catch (error) {
      setAlertModal({
        open: true,
        message: error.response?.data?.message || 'Failed to update tag color. Please try again.',
        title: 'Error'
      });
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <button
            className={`profile-tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <div className="profile-tab-content">
              <User size={16} />
              <span>Account</span>
            </div>
          </button>
          <button
            className={`profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <div className="profile-tab-content">
              <Shield size={16} />
              <span>Security</span>
            </div>
          </button>
          <button
            className={`profile-tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <div className="profile-tab-content">
              <Settings size={16} />
              <span>Preferences</span>
            </div>
          </button>
          <button
            className={`profile-tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <div className="profile-tab-content">
              <Tag size={16} />
              <span>Tags</span>
            </div>
          </button>
        </div>

        {activeTab === 'account' ? (
          <div key="account" className="profile-tab-panel">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Account Information</h3>
                <p>Update your account details and personal information</p>
              </div>
              <div className="profile-card-body">
                <div className="profile-form-grid">
                  <div className="profile-form-field">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={accountData.name}
                      onChange={handleAccountChange}
                    />
                  </div>
                  <div className="profile-form-field">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={accountData.email}
                      onChange={handleAccountChange}
                    />
                  </div>
                </div>
              </div>
              <div className="profile-card-footer">
                <button className="profile-update-button" onClick={handleUpdateAccount}>
                  Update Account
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'security' ? (
          <div key="security" className="profile-tab-panel">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Security Settings</h3>
                <p>Manage your account security and authentication methods</p>
              </div>
              <div className="profile-card-body">
                <div className="profile-form-stack">
                  <div className="profile-form-field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-form-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-form-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>
              </div>
              <div className="profile-card-footer">
                <button className="profile-update-button" onClick={handleUpdatePassword}>
                  Update Password
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'preferences' ? (
          <div key="preferences" className="profile-tab-panel">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Preferences</h3>
                <p>Customize your trading journal experience</p>
              </div>
              <div className="profile-card-body">
                <div className="profile-form-field">
                  <label htmlFor="currency" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Currency</label>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                    Choose your preferred currency symbol for displaying P&L and amounts
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      style={{
                        padding: '1.5rem',
                        border: `2px solid ${currency === 'USD' ? '#3b82f6' : 'var(--border-color)'}`,
                        background: currency === 'USD' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: currency === 'USD' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
                        transform: currency === 'USD' ? 'translateY(-2px)' : 'translateY(0)'
                      }}
                      onMouseEnter={(e) => {
                        if (currency !== 'USD') {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currency !== 'USD') {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}>
                        $
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem'
                        }}>
                          USD
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          US Dollar
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('EUR')}
                      style={{
                        padding: '1.5rem',
                        border: `2px solid ${currency === 'EUR' ? '#3b82f6' : 'var(--border-color)'}`,
                        background: currency === 'EUR' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: currency === 'EUR' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
                        transform: currency === 'EUR' ? 'translateY(-2px)' : 'translateY(0)'
                      }}
                      onMouseEnter={(e) => {
                        if (currency !== 'EUR') {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currency !== 'EUR') {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}>
                        €
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem'
                        }}>
                          EUR
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          Euro
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div key="tags" className="profile-tab-panel">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Tag Management</h3>
                <p>Create and manage tags for organizing your trades</p>
              </div>
              <div className="profile-card-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                    Add New Tag
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Tag name (e.g., Momentum, Support/Resistance)"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        style={{
                          width: '100%',
                          height: '2.5rem',
                          padding: '0 0.75rem',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color</label>
                      <button
                        type="button"
                        className="new-tag-color-picker"
                        style={{ backgroundColor: newTagColor }}
                        onClick={() => {
                          setEditingTagIndex(null);
                          setShowColorPicker(true);
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAddTag}
                      className="profile-update-button"
                      style={{
                        height: '2.5rem',
                        padding: '0 1rem',
                        whiteSpace: 'nowrap',
                        margin: 0
                      }}
                    >
                      <Plus size={16} />
                      Add Tag
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                    Your Tags ({availableTags.length})
                  </label>
                  {availableTags.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: 'var(--bg-color)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-secondary)'
                    }}>
                      No tags yet. Add your first tag above to get started!
                    </div>
                  ) : (
                    <div className="tags-table">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Preview
                            </th>
                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Tag Name
                            </th>
                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Color
                            </th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableTags.map((tag, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: tag.color,
                                    color: 'white',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  {tag.name}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                {tag.name}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <button
                                  type="button"
                                  className="tags-table-color-picker"
                                  style={{ backgroundColor: tag.color }}
                                  onClick={() => {
                                    setEditingTagIndex(index);
                                    setShowColorPicker(true);
                                  }}
                                />
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteTag(index)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showColorPicker && (
        <ColorPicker
          color={editingTagIndex !== null ? availableTags[editingTagIndex].color : newTagColor}
          onChange={(newColor) => {
            if (editingTagIndex !== null) {
              handleUpdateTagColor(editingTagIndex, newColor);
            } else {
              setNewTagColor(newColor);
            }
          }}
          onClose={() => {
            setShowColorPicker(false);
            setEditingTagIndex(null);
          }}
        />
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }}>
            <button className="close-modal" onClick={() => setAlertModal({ ...alertModal, open: false })}>
              <X size={20} />
            </button>

            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{alertModal.title}</h2>
            </div>

            <div style={{ marginBottom: '2rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {alertModal.message}
            </div>

            <button
              className="modal-action-button"
              onClick={() => setAlertModal({ ...alertModal, open: false })}
              style={{ width: '100%' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }}>
            <button className="close-modal" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
              <X size={20} />
            </button>

            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{confirmModal.title}</h2>
            </div>

            <div style={{ marginBottom: '2rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {confirmModal.message}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="modal-action-button"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-color)';
                  e.currentTarget.style.border = '1px solid var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.border = '1px solid var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Cancel
              </button>
              <button
                className="modal-action-button"
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.border = 'none';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.border = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="save-success-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Saved!
        </div>
      )}
    </div>
  );
}

export default Profile;
