import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Users, Calculator, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from '../utils/validation';

/**
 * LargeKiteLogo - Neobrutalist Kite Illustration for Auth Hero
 */
function LargeKiteLogo({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(3px 3px 0px #171717)' }}
    >
      <polygon
        points="16,2 29,14 16,26 3,14"
        fill="#FFDE59"
        stroke="#171717"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1="16" y1="2" x2="16" y2="26" stroke="#171717" strokeWidth="1.5" />
      <line x1="3" y1="14" x2="29" y2="14" stroke="#171717" strokeWidth="1.5" />
      <path
        d="M16 26 C13 28 19 30 16 32"
        fill="none"
        stroke="#FFDE59"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polygon points="13,27 17,28 14,29" fill="#FF8066" stroke="#171717" strokeWidth="1" />
      <polygon points="18,30 14,31 17,32" fill="#B8E0D2" stroke="#171717" strokeWidth="1" />
    </svg>
  );
}

/**
 * Register Page - Two-column neobrutalist registration screen
 */
export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to /dashboard immediately
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formError) {
      setFormError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    const nameErr = validateRequired(formData.name, 'Full Name');
    if (nameErr) {
      newErrors.name = nameErr;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      newErrors.email = emailErr;
    }

    const passErr = validatePassword(formData.password);
    if (passErr) {
      newErrors.password = passErr;
    }

    const matchErr = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (matchErr) {
      newErrors.confirmPassword = matchErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully! Welcome to CampusKite.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Column: Branding & Features */}
        <div className="auth-branding">
          <div className="auth-brand-header">
            <LargeKiteLogo size={64} />
            <h1 className="auth-brand-name">CampusKite</h1>
          </div>

          <div className="auth-tagline">
            Split expenses, not friendships
          </div>

          <p style={{ margin: '0 0 var(--space-md) 0', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
            Create an account to start sharing dorm tabs, group meals, campus events, and trips effortlessly.
          </p>

          {/* Three Feature Bullets with Icons */}
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--primary)' }}>
                <Users size={20} color="var(--text)" />
              </div>
              <span>Organize flatmates & travel groups in seconds</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--mint)' }}>
                <Calculator size={20} color="var(--text)" />
              </div>
              <span>Exact Indian Rupee splits computed in integer paise</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--coral)' }}>
                <PiggyBank size={20} color="var(--text)" />
              </div>
              <span>Never chase group money again with settlement logs</span>
            </div>
          </div>

          {/* Neobrutalist Decorative Blocks */}
          <div className="auth-decorative-blocks" aria-hidden="true">
            <div className="auth-block" style={{ width: 90, backgroundColor: 'var(--mint)' }} />
            <div className="auth-block" style={{ width: 120, backgroundColor: 'var(--primary)' }} />
            <div className="auth-block" style={{ width: 70, backgroundColor: 'var(--coral)' }} />
            <div className="auth-block" style={{ width: 35, backgroundColor: '#171717' }} />
          </div>
        </div>

        {/* Right Column: Register Form Card */}
        <div className="auth-form-side">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">
                Join your campus circle and start splitting
              </p>
            </div>

            {formError && (
              <div
                className="card card-coral"
                style={{
                  padding: '10px 14px',
                  marginBottom: 'var(--space-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: '2px solid var(--border)',
                  boxShadow: '3px 3px 0px var(--border)',
                }}
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Full Name"
                id="register-name"
                name="name"
                type="text"
                placeholder="Rohit Sharma"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                icon={<User size={18} />}
                autoComplete="name"
              />

              <Input
                label="Email Address"
                id="register-email"
                name="email"
                type="email"
                placeholder="you@campus.edu"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                icon={<Mail size={18} />}
                autoComplete="email"
              />

              <Input
                label="Password"
                id="register-password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                icon={<Lock size={18} />}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                icon={<Lock size={18} />}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                Create Account
              </Button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--text)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Register };
