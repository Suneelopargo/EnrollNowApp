// frontend/shell/src/App.tsx - Host Application Root
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { ShellRouter } from './routing/ShellRouter';
import { loadRuntimeConfig } from '../../shared/runtime-config';
import { LoadingSpinner } from '../../shared/design-system/components/LoadingSpinner';
import { ToasterContainer, toast } from '../../shared/toaster';
import { ConfirmationContainer } from '../../shared/confirmation';
import '../../shared/design-system/styles/index.scss';

export const App: React.FC = () => {
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    loadRuntimeConfig().finally(() => {
      setConfigReady(true);
    });

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || 'Unhandled promise rejection';
      toast.error(String(reason), { title: 'Application Error' });
    };

    const handleError = (event: ErrorEvent) => {
      if (event.error) {
        toast.error(event.message || 'An unexpected runtime error occurred.', { title: 'Runtime Error' });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (!configReady) {
    return <LoadingSpinner message="Initializing EnrollNow Shell Host..." />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>
          <ShellRouter />
          <ToasterContainer />
          <ConfirmationContainer />
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
