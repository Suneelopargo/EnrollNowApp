// frontend/shell/src/remotes/RemoteLoader.tsx - Dynamic Runtime Remote MFE Loader
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRemoteDefinition } from './RemoteRegistry';
import { useAuth } from '../auth/AuthContext';
import { MfeContext } from '../../../shared/contracts';
import { telemetry } from '../../../shared/telemetry';
import { ErrorBoundary } from '../../../shared/design-system/components/ErrorBoundary';
import { LoadingSpinner } from '../../../shared/design-system/components/LoadingSpinner';

export interface RemoteLoaderProps {
  remoteId: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export const RemoteLoader: React.FC<RemoteLoaderProps> = ({
  remoteId,
  timeoutMs = 10000,
  maxRetries = 2,
}) => {
  const { user, token, setSession } = useAuth();
  const navigate = useNavigate();

  const [Component, setComponent] = useState<React.ComponentType<{ context: MfeContext }> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const remoteDef = getRemoteDefinition(remoteId);

  const loadRemoteModule = useCallback(async () => {
    if (!remoteDef) {
      setError(`Remote "${remoteId}" is not registered in RemoteRegistry.`);
      setLoading(false);
      return;
    }

    if (!remoteDef.enabled) {
      setError(`Remote "${remoteDef.name}" is currently disabled in runtime configuration.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    telemetry.track({
      eventType: 'REMOTE_LOAD_START',
      remoteId,
      details: { url: remoteDef.remoteUrl, attempt: retryCount + 1 },
    });

    // Timeout Promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Loading remote "${remoteDef.name}" timed out after ${timeoutMs}ms.`)),
        timeoutMs
      )
    );

    try {
      // Dynamic ESM module import
      const modulePromise = (async () => {
        const mod = await import(/* @vite-ignore */ remoteDef.remoteUrl);
        return mod.default || mod[remoteDef.exposedModule] || mod;
      })();

      const LoadedComponent = await Promise.race([modulePromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      telemetry.track({
        eventType: 'REMOTE_LOAD_SUCCESS',
        remoteId,
        durationMs,
        details: { url: remoteDef.remoteUrl },
      });

      setComponent(() => LoadedComponent);
      setLoading(false);
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err.message || `Failed to load remote "${remoteDef.name}".`;

      telemetry.track({
        eventType: 'REMOTE_LOAD_ERROR',
        remoteId,
        durationMs,
        details: { url: remoteDef.remoteUrl, error: errorMessage, attempt: retryCount + 1 },
      });

      if (retryCount < maxRetries) {
        console.warn(`[RemoteLoader] Retrying remote "${remoteId}" (Attempt ${retryCount + 2}/${maxRetries + 1})...`);
        setTimeout(() => setRetryCount((prev) => prev + 1), 1000 * (retryCount + 1));
      } else {
        setError(errorMessage);
        setLoading(false);
      }
    }
  }, [remoteId, remoteDef, timeoutMs, maxRetries, retryCount]);

  useEffect(() => {
    loadRemoteModule();
  }, [loadRemoteModule]);

  const handleManualRetry = () => {
    setRetryCount(0);
    loadRemoteModule();
  };

  const mfeContext: MfeContext = {
    user,
    token,
    apiBaseUrl: remoteDef?.apiBaseUrl || '',
    correlationId: telemetry.getCorrelationId(),
    navigate,
    onEvent: (eventType, payload) => {
      telemetry.track({
        eventType: 'AUTH_STATE',
        remoteId,
        details: { eventType, payload },
      });

      if (eventType === 'LOGIN_SUCCESS' && payload?.token && payload?.user) {
        setSession(payload.user, payload.token);
      }
    },
  };

  if (loading) {
    return <LoadingSpinner message={`Loading ${remoteDef?.name || remoteId}...`} />;
  }

  if (error || !Component) {
    return (
      <div className="error-fallback-card">
        <h2>{remoteDef?.name || remoteId} Temporarily Unavailable</h2>
        <p>{error || 'The remote micro-frontend could not be loaded.'}</p>
        <div className="error-actions-group">
          <button type="button" className="btn btn-primary" onClick={handleManualRetry}>
            <span>Retry Loading</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle={`${remoteDef?.name || remoteId} Runtime Error`}
      remoteId={remoteId}
      onRetry={handleManualRetry}
    >
      <Suspense fallback={<LoadingSpinner message="Rendering micro-frontend..." />}>
        <Component context={mfeContext} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default RemoteLoader;
