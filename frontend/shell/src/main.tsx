import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { telemetry } from '../../shared/telemetry';

telemetry.track({
  eventType: 'STARTUP',
  details: { app: 'enrollnow-shell', version: '1.0.0' },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
