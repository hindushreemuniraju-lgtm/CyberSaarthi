import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useUserExperience } from './context/UserExperienceContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { EmergencyContactsModal } from './components/EmergencyContactsModal';
import { CaretakerConsentModal } from './components/CaretakerConsentModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { KidsHome } from './modes/kids/KidsHome';
import { SeniorHome } from './modes/seniors/SeniorHome';
import { AdultDashboard } from './modes/adults/AdultDashboard';
import { CaretakerDashboard } from './modes/caretaker/CaretakerDashboard';
import { AuthPage } from './pages/AuthPage';
import { UserMode } from './types';

// Standard Dashboard Layout with Adaptive Modals & Header
const DashboardLayout: React.FC<{
  currentMode: UserMode;
  children: (props: {
    onOpenContacts: () => void;
    onOpenCaretakerModal: () => void;
  }) => React.ReactNode;
}> = ({ currentMode, children }) => {
  const { setMode } = useUserExperience();
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCaretakerModal, setShowCaretakerModal] = useState(false);

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600 selection:text-white">
      <Navbar
        onOpenContacts={() => setShowContactsModal(true)}
        onOpenCaretakerModal={() => setShowCaretakerModal(true)}
      />

      <main className="flex-1">
        {children({
          onOpenContacts: () => setShowContactsModal(true),
          onOpenCaretakerModal: () => setShowCaretakerModal(true)
        })}
      </main>

      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />

      <CaretakerConsentModal
        isOpen={showCaretakerModal}
        onClose={() => setShowCaretakerModal(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CyberSaarthi. VTU Community / Societal Project — A safer digital world for everyone.</p>
          <div className="flex gap-4 font-semibold text-slate-600">
            <button onClick={() => setShowContactsModal(true)} className="hover:text-blue-600">Emergency 1930</button>
            <button onClick={() => setShowCaretakerModal(true)} className="hover:text-blue-600">Consent & Privacy</button>
            <a href="/login" className="hover:text-blue-600">Switch Role</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Root index router component: redirects authenticated user to their role dashboard, or shows AuthPage
const RootRoute: React.FC = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120726] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-amber-300">Loading CyberSaarthi...</p>
        </div>
      </div>
    );
  }

  // If already logged in, redirect directly to user's assigned dashboard
  if (token && user) {
    const targetRole = (user.role || user.user_mode || 'adult').toLowerCase();
    return <Navigate to={`/${targetRole}`} replace />;
  }

  // Show Auth page with the 4 attractive role selection cards
  return (
    <AuthPage
      onSuccess={(redirectUrl) => {
        navigate(redirectUrl || '/adult');
      }}
    />
  );
};

// Standalone Login Route wrapper
const LoginRoute: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  if (token && user) {
    const targetRole = (user.role || user.user_mode || 'adult').toLowerCase();
    return <Navigate to={`/${targetRole}`} replace />;
  }

  return (
    <AuthPage
      onSuccess={(redirectUrl) => {
        navigate(redirectUrl || '/adult');
      }}
    />
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Entry & Authentication */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<LoginRoute />} />

        {/* Kids Mode Dashboard (Protected for 'kid' role) */}
        <Route
          path="/kid"
          element={
            <ProtectedRoute allowedRoles={['kid']}>
              <DashboardLayout currentMode="kid">
                {({ onOpenContacts, onOpenCaretakerModal }) => (
                  <KidsHome
                    onOpenContacts={onOpenContacts}
                    onOpenCaretakerModal={onOpenCaretakerModal}
                  />
                )}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/kids" element={<Navigate to="/kid" replace />} />

        {/* Adult Mode Dashboard (Protected for 'adult' role) */}
        <Route
          path="/adult"
          element={
            <ProtectedRoute allowedRoles={['adult']}>
              <DashboardLayout currentMode="adult">
                {({ onOpenCaretakerModal }) => (
                  <AdultDashboard
                    onOpenCaretakerModal={onOpenCaretakerModal}
                  />
                )}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/adults" element={<Navigate to="/adult" replace />} />

        {/* Caretaker Mode Dashboard (Protected for 'caretaker' role) */}
        <Route
          path="/caretaker"
          element={
            <ProtectedRoute allowedRoles={['caretaker']}>
              <DashboardLayout currentMode="caretaker">
                {() => <CaretakerDashboard />}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Senior Mode Dashboard (Protected for 'senior' role) */}
        <Route
          path="/senior"
          element={
            <ProtectedRoute allowedRoles={['senior']}>
              <DashboardLayout currentMode="senior">
                {({ onOpenContacts, onOpenCaretakerModal }) => (
                  <SeniorHome
                    onOpenContacts={onOpenContacts}
                    onOpenCaretakerModal={onOpenCaretakerModal}
                  />
                )}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/seniors" element={<Navigate to="/senior" replace />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
