// frontend/shell/src/remotes/RemoteLoader.tsx - Modular Local Feature Loader (Refactored from MFE Remote Loader)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRemoteDefinition } from './RemoteRegistry';
import { useAuth } from '../auth/AuthContext';
import { MfeContext } from '../../../shared/contracts';
import { getApiBaseUrl } from '../../../shared/api-config';
import { telemetry } from '../../../shared/telemetry';
import { MODULE_REGISTRY } from '../modules';

export interface RemoteLoaderProps {
  remoteId: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export const RemoteLoader: React.FC<RemoteLoaderProps> = ({ remoteId }) => {
  const { user, token, setSession } = useAuth();
  const navigate = useNavigate();

  const remoteDef = getRemoteDefinition(remoteId);
  const LocalModule = MODULE_REGISTRY[remoteId];

  if (!LocalModule) {
    return (
      <div className="error-fallback-card">
        <h2>{remoteDef?.name || remoteId} Not Found</h2>
        <p>The feature module &quot;{remoteId}&quot; is not registered in the application module registry.</p>
        <div className="error-actions-group">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const mfeContext: MfeContext = {
    user,
    token,
    apiBaseUrl: remoteDef?.apiBaseUrl || getApiBaseUrl(),
    correlationId: telemetry.getCorrelationId(),
    navigate,
    onEvent: (eventType, payload) => {
      telemetry.track({
        eventType: 'AUTH_STATE',
        remoteId,
        details: { eventType, payload },
      });

      if (eventType === 'LOGIN_SUCCESS') {
        const authToken = payload?.token || localStorage.getItem('enrollnow_token');
        let authUser = payload?.user;
        if (!authUser && payload?.username) {
          authUser = {
            id: 1,
            username: payload.username,
            email: `${payload.username}@enrollnow.local`,
            roles: ['ROLE_SUPER_ADMIN'],
          };
        }
        if (authUser && authToken) {
          setSession(authUser, authToken);
        }
      }
    },
  };

  return <LocalModule context={mfeContext} />;
};

export default RemoteLoader;
