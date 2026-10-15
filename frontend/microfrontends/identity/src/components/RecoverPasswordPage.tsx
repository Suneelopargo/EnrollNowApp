// frontend/microfrontends/identity/src/components/RecoverPasswordPage.tsx
// Central Code-Driven Recover Password Component matching EnrollNow design system
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnrollNowBrand } from './EnrollNowBrand';
import { authApi } from '../../../../shared/api/authApi';
import { validators, validateField } from '../../../../shared/design-system/validation';

export interface RecoverPasswordPageProps {
  onSuccess?: () => void;
}

export const RecoverPasswordPage: React.FC<RecoverPasswordPageProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  // Shared design system validation rule for email address
  const validationError = useMemo(() => {
    if (!trimmedEmail) {
      return 'Email address is required';
    }
    return validateField(trimmedEmail, [
      validators.required('Email Address'),
      validators.email('Email Address'),
    ]);
  }, [trimmedEmail]);

  // Button remains disabled until email validation succeeds
  const isEmailValid = Boolean(trimmedEmail) && !validationError;
  const isButtonDisabled = loading || Boolean(successMessage) || !isEmailValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTouched(true);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setErrorMessage(null);

    if (!isEmailValid) {
      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword({ email: trimmedEmail });
      setSuccessMessage(
        'If your email address is registered with EnrollNow, instructions to reset your password have been sent to your inbox.'
      );
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to process password recovery request. Please try again or contact support.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="enl-activation-page">
      <div className="enl-activation-card">
        {/* Top White Brand Header */}
        <header className="enl-activation-header">
          <div className="enl-brand-container">
            <EnrollNowBrand />
          </div>
        </header>

        {/* Card Body */}
        <div className="enl-activation-body">
          <h2 className="enl-activation-welcome">RECOVER PASSWORD</h2>

          {/* Screenshot-Matched Info Alert Box */}
          <div className="enl-recover-info-banner">
            Enter your account email address below to reset your password.
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="enl-activation-input-group">
              <label htmlFor="recover-email" className="enl-activation-label">
                Email Address
              </label>
              <input
                id="recover-email"
                type="email"
                className={`enl-activation-input ${email ? 'is-filled' : ''} ${
                  touched && validationError ? 'is-invalid' : ''
                }`}
                placeholder="Email Address"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading || Boolean(successMessage)}
                autoFocus
                autoComplete="email"
                required
                aria-invalid={Boolean(touched && validationError)}
              />
            </div>

            {/* Field Validation Error */}
            {touched && validationError && !successMessage && (
              <div className="enl-activation-alert is-error" role="alert">
                {validationError}
              </div>
            )}

            {/* Server Error Message */}
            {errorMessage && !successMessage && (
              <div className="enl-activation-alert is-error" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="enl-activation-alert is-success" role="status">
                {successMessage}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <a
                href="/login"
                className="enl-activation-back-link"
                onClick={handleReturnToLogin}
              >
                Return to Login
              </a>
            </div>
          </form>
        </div>

        {/* Recover Password Submit Button (Disabled until validation passes) */}
        <button
          type="button"
          className="enl-activation-submit-btn"
          onClick={handleSubmit}
          disabled={isButtonDisabled}
        >
          {loading ? 'Recovering Password...' : 'Recover Password'}
        </button>
      </div>

      {/* Footer Below Card */}
      <footer className="enl-activation-footer">
        <span className="enl-activation-copyright">© 2016 - 2026</span>
        <a href="#enrollnow" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          EnrollNow
        </a>
        <span className="enl-activation-footer-divider">|</span>
        <a href="#terms" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Terms of Service
        </a>
        <span className="enl-activation-footer-divider">|</span>
        <a href="#support" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Support Center
        </a>
      </footer>
    </div>
  );
};

export default RecoverPasswordPage;
