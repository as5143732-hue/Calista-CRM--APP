import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('PWA Service Worker: New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('PWA Service Worker: App is ready for offline use.');
  },
  onRegisteredSW(swScriptUrl, registration) {
    console.log('PWA Service Worker: Successfully registered! URL:', swScriptUrl, 'Scope:', registration?.scope);
  },
  onRegisterError(error) {
    console.error('PWA Service Worker: Registration failed with error:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
