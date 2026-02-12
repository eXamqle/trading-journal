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

  // Handle Escape key for alert modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && alertModal.open) {
        setAlertModal({ ...alertModal, open: false });
      }
    };

    if (alertModal.open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [alertModal]);

  // Handle Escape key for confirm modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && confirmModal.open) {
        setConfirmModal({ ...confirmModal, open: false });
      }
    };

    if (confirmModal.open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [confirmModal]);

  // Handle Escape key for color picker
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showColorPicker) {
        setShowColorPicker(false);
        setEditingTagIndex(null);
      }
    };

    if (showColorPicker) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showColorPicker]);

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
          <div className="modal-content" style={{
            maxWidth: '440px',
            padding: '0',
            overflow: 'hidden'
          }}>
            <button
              className="close-modal"
              onClick={() => setAlertModal({ ...alertModal, open: false })}
              style={{ zIndex: 10 }}
            >
              <X size={20} />
            </button>

            <div style={{
              background: alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
              padding: '2rem 2rem 1.5rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                    : '0 4px 12px rgba(59, 130, 246, 0.3)',
                  flexShrink: 0
                }}>
                  {alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed') ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {alertModal.title}
                  </h2>
                </div>
              </div>
            </div>

            <div style={{
              padding: '2rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              fontSize: '0.9375rem'
            }}>
              {alertModal.message}
            </div>

            <div style={{
              padding: '1.5rem 2rem',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setAlertModal({ ...alertModal, open: false })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                    : '0 2px 8px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                    : '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = alertModal.title?.toLowerCase().includes('error') || alertModal.title?.toLowerCase().includes('failed')
                    ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                    : '0 2px 8px rgba(59, 130, 246, 0.2)';
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{
            maxWidth: '440px',
            padding: '0',
            overflow: 'hidden'
          }}>
            <button
              className="close-modal"
              onClick={() => setConfirmModal({ ...confirmModal, open: false })}
              style={{ zIndex: 10 }}
            >
              <X size={20} />
            </button>

            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              padding: '2rem 2rem 1.5rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {confirmModal.title}
                  </h2>
                </div>
              </div>
            </div>

            <div style={{
              padding: '2rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              fontSize: '0.9375rem'
            }}>
              {confirmModal.message}
            </div>

            <div style={{
              padding: '1.5rem 2rem',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-color)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
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
