import React, { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { authAPI } from './api/auth';

function Profile() {
  const { user, updateUser } = useAuth();
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
      alert('Account updated successfully');
    } catch (error) {
      alert('Failed to update account: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert('Failed to update password: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs">
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
        </div>

        {activeTab === 'account' ? (
          <div className="profile-tab-panel">
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
        ) : (
          <div className="profile-tab-panel">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Security Settings</h3>
                <p>Manage your account security and authentication methods</p>
              </div>
              <div className="profile-card-body">
                <div className="profile-form-stack">
                  <div className="profile-form-field">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-form-field">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-form-field">
                    <label htmlFor="confirm-password">Confirm New Password</label>
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
        )}
      </div>
    </div>
  );
}

export default Profile;
