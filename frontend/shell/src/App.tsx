// frontend/shell/src/App.tsx - Host Application Root
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { ShellRouter } from './routing/ShellRouter';
import { loadRuntimeConfig } from '../../shared/runtime-config';
import { LoadingSpinner } from '../../shared/design-system/components/LoadingSpinner';
import '../../shared/design-system/styles/index.scss';

export const App: React.FC = () => {
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    loadRuntimeConfig().finally(() => {
      setConfigReady(true);
    });
  }, []);

  if (!configReady) {
    return <LoadingSpinner message="Initializing EnrollNow Shell Host..." />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>
          <ShellRouter />
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
