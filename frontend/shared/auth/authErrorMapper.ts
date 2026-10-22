// frontend/shared/auth/authErrorMapper.ts - Centralized Authentication Error & Notification Mapping
// Translates stable backend error codes and legacy error messages into concise, accessible, user-friendly notifications

export interface AuthErrorNotification {
  code: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    route?: string;
    onClick?: () => void;
  };
  requiresInlineAlert: boolean;
  secondaryHelp?: string;
}

export function mapAuthError(
  error: any,
  options?: { isLoginScreen?: boolean }
): AuthErrorNotification {
  const code = (
    error?.code ||
    error?.normalized?.code ||
    error?.response?.data?.code ||
    error?.response?.data?.reason ||
    error?.reason ||
    ''
  ).toUpperCase();

  const isLoginScreen = Boolean(
    options?.isLoginScreen ||
    error?.isLoginScreen ||
    error?.config?.url?.includes('/auth/login')
  );

  const rawMessage = (
    error?.response?.data?.message ||
    error?.normalized?.message ||
    error?.message ||
    ''
  ).trim();

  const message = rawMessage.toLowerCase();

  const status = error?.status || error?.normalized?.status || error?.response?.status;

  // A. Too many failed login attempts
  if (
    code === 'ACCOUNT_LOCKED_MAX_ATTEMPTS' ||
    code === 'MAX_FAILED_LOGIN_ATTEMPTS' ||
    message.includes('failed login attempts') ||
    message.includes('exceeded the allowed number')
  ) {
    return {
      code: 'ACCOUNT_LOCKED_MAX_ATTEMPTS',
      title: 'Account locked',
      description: isLoginScreen
        ? 'Too many unsuccessful sign-in attempts.\nContact your institution administrator for help unlocking your account.'
        : rawMessage.length > 20
        ? rawMessage
        : 'You have exceeded the allowed number of failed login attempts. Your account has been locked. Please contact the EnrollNow administrator at your institution to unlock your account. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.',
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // B. Mandatory password reset or password-specific lock
  if (
    code === 'PASSWORD_RESET_REQUIRED' ||
    code === 'PASSWORD_LOCK' ||
    code === 'PASSWORD_EXPIRED' ||
    message.includes('password has been locked') ||
    message.includes('password needs to be reset') ||
    message.includes('password reset is required') ||
    message.includes('password has expired')
  ) {
    return {
      code: 'PASSWORD_RESET_REQUIRED',
      title: 'Password reset required',
      description:
        rawMessage.length > 20
          ? rawMessage
          : 'Your password has been locked. Please contact an EnrollNow Site Admin at your institution or use the Forgot Password link on the login page.',
      severity: 'warning',
      action: {
        label: 'Reset password',
        route: '/forgot-password',
      },
      requiresInlineAlert: true,
      secondaryHelp: "If you need assistance, contact your institution's Site Admin.",
    };
  }

  // C. Temporary account disablement
  if (
    code === 'ACCOUNT_DISABLED_TEMPORARY' ||
    code === 'ACCOUNT_DISABLED_SOFT' ||
    (code === 'ACCOUNT_DISABLED' && !message.includes('permanently')) ||
    message.includes('temporarily disabled')
  ) {
    return {
      code: 'ACCOUNT_DISABLED_TEMPORARY',
      title: 'Account temporarily disabled',
      description: isLoginScreen
        ? 'Your account has been temporarily disabled.\nContact your institution administrator for assistance.'
        : rawMessage.length > 20
        ? rawMessage
        : 'Your account has been temporarily disabled. Please contact the EnrollNow administrator at your institution to enable it. If you are a Site Administrator, please contact EnrollNow customer support to get your account unlocked.',
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // D. Permanent account disablement
  if (
    code === 'ACCOUNT_DISABLED_PERMANENT' ||
    code === 'ACCOUNT_DISABLED_HARD' ||
    message.includes('permanently disabled')
  ) {
    return {
      code: 'ACCOUNT_DISABLED_PERMANENT',
      title: 'Account disabled',
      description:
        rawMessage.length > 20
          ? rawMessage
          : 'Your account has been permanently disabled. Please contact the EnrollNow administrator at your institution.',
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // E. Default account lock or Inactivity lock
  if (
    code === 'ACCOUNT_LOCKED_DEFAULT' ||
    code === 'ACCOUNT_LOCKED_INACTIVITY' ||
    code === 'INACTIVITY_LOCK' ||
    code === 'ACCOUNT_LOCKED' ||
    status === 423 ||
    message.includes('account is locked') ||
    message.includes('account has been locked') ||
    message.includes('inactivity')
  ) {
    return {
      code: code || 'ACCOUNT_LOCKED_DEFAULT',
      title: 'Account locked',
      description:
        rawMessage.length > 20
          ? rawMessage
          : 'Your account is locked. Please contact the EnrollNow administrator at your institution.',
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // G. Session expiration
  if (
    code === 'SESSION_EXPIRED' ||
    code === 'INACTIVITY_TIMEOUT' ||
    code === 'TOKEN_EXPIRED' ||
    message.includes('session has expired') ||
    message.includes('session timed out')
  ) {
    return {
      code: 'SESSION_EXPIRED',
      title: 'Session expired',
      description: 'Your session has expired. Please sign in again.',
      severity: 'info',
      requiresInlineAlert: false,
    };
  }

  // F. Incorrect credentials
  if (
    code === 'INVALID_CREDENTIALS' ||
    status === 401 ||
    message.includes('invalid username or password') ||
    message.includes('password and/or username') ||
    message.includes('incorrect') ||
    message.includes('invalid credentials')
  ) {
    return {
      code: 'INVALID_CREDENTIALS',
      title: 'Sign-in unsuccessful',
      description: 'Invalid username or password. Please verify your credentials.',
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // H. Network or unexpected server error
  if (
    code === 'NETWORK_ERROR' ||
    status === 0 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes('network') ||
    message.includes('connect')
  ) {
    return {
      code: 'NETWORK_ERROR',
      title: 'Unable to sign in',
      description: "We couldn't complete your sign-in request. Please try again.",
      severity: 'error',
      requiresInlineAlert: false,
    };
  }

  // Safe fallback
  return {
    code: code || 'UNKNOWN_AUTH_ERROR',
    title: 'Unable to sign in',
    description: "We couldn't complete your sign-in request. Please try again.",
    severity: 'error',
    requiresInlineAlert: false,
  };
}
