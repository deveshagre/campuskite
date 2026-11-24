import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Users, Calculator, PiggyBank } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validateEmail, validateRequired } from '../utils/validation';

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
 * Login Page - Two-column neobrutalist authentication screen
 */
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      newErrors.email = emailErr;
    }

    const passErr = validateRequired(formData.password, 'Password');
    if (passErr) {
      newErrors.password = passErr;
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
      await login(formData.email, formData.password);
      toast.success('Welcome back to CampusKite!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Invalid email or password';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Column: Branding, Tagline, Feature Bullets & Decorative Blocks */}
        <div className="auth-branding">
          <div className="auth-brand-header">
            <LargeKiteLogo size={64} />
            <h1 className="auth-brand-name">CampusKite</h1>
          </div>

          <div className="auth-tagline">
            Split expenses, not friendships
          </div>

          <p style={{ margin: '0 0 var(--space-md) 0', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
            The expense sharing platform tailored for college students, dorm mates, and campus adventures.
          </p>

          {/* Three Feature Bullets with Icons */}
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--primary)' }}>
                <Users size={20} color="var(--text)" />
              </div>
              <span>Shared dorm, food & canteen group tabs</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--mint)' }}>
                <Calculator size={20} color="var(--text)" />
              </div>
              <span>Paise-precise splits with zero awkward math</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ backgroundColor: 'var(--coral)' }}>
                <PiggyBank size={20} color="var(--text)" />
              </div>
              <span>Simplified settlements in the fewest transfers</span>
            </div>
          </div>

          {/* Neobrutalist Decorative Blocks */}
          <div className="auth-decorative-blocks" aria-hidden="true">
            <div className="auth-block" style={{ width: 80, backgroundColor: 'var(--primary)' }} />
            <div className="auth-block" style={{ width: 140, backgroundColor: 'var(--mint)' }} />
            <div className="auth-block" style={{ width: 60, backgroundColor: 'var(--coral)' }} />
            <div className="auth-block" style={{ width: 40, backgroundColor: '#171717' }} />
          </div>
        </div>

        {/* Right Column: Login Form Card */}
        <div className="auth-form-side">
          <div className="card auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">
                Enter your campus credentials to sign in
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
                label="Email Address"
                id="login-email"
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
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                icon={<Lock size={18} />}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                style={{ marginTop: 'var(--space-sm)' }}
              >
                Sign In
              </Button>
            </form>

            <div className="auth-footer">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: 'var(--text)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Login };
