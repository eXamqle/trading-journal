import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, User, BookOpen, X } from 'lucide-react';

function Login() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Error' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        if (!formData.name) {
          setAlertModal({
            open: true,
            message: 'Name is required',
            title: 'Validation Error'
          });
          setLoading(false);
          return;
        }
        await register(formData);
      }
    } catch (err) {
      setAlertModal({
        open: true,
        message: err.response?.data?.message || 'Authentication failed',
        title: 'Authentication Error'
      });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.15), transparent 40%), #0b1120',
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            background: '#3b82f6',
            color: 'white',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#f8fafc',
            margin: 0
          }}>
            Trading Journal
          </h1>
        </div>
        <p style={{
          textAlign: 'center',
          color: '#94a3b8',
          marginBottom: '32px',
          marginTop: '8px'
        }}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </p>


        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: '#111827',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                inputMode="email"
                autoCorrect="on"
                autoCapitalize="none"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#111827',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#111827',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#334155' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#2563eb')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#3b82f6')}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#94a3b8'
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>

      {/* Error Modal */}
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
    </div>
  );
}

export default Login;
