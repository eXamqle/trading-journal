import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';

function Profile() {
  const [activeTab, setActiveTab] = useState('account');
  const [accountData, setAccountData] = useState({
    name: 'John Doe',
    email: 'ylptwcqbqouxnmbysh@nesopf.com'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  const handleUpdatePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    alert('Password updated successfully');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
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
