import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { UserExperienceProvider } from './context/UserExperienceContext';
import './i18n';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <UserExperienceProvider>
        <App />
      </UserExperienceProvider>
    </AuthProvider>
  </React.StrictMode>
);
