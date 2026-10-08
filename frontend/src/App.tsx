import React, { useState } from 'react';
import { useUserExperience } from './context/UserExperienceContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { EmergencyContactsModal } from './components/EmergencyContactsModal';
import { CaretakerConsentModal } from './components/CaretakerConsentModal';
import { KidsHome } from './modes/kids/KidsHome';
import { SeniorHome } from './modes/seniors/SeniorHome';
import { AdultDashboard } from './modes/adults/AdultDashboard';
import { CaretakerDashboard } from './modes/caretaker/CaretakerDashboard';
import { WelcomePage } from './pages/WelcomePage';
import { AuthPage } from './pages/AuthPage';

export const App: React.FC = () => {
  const { mode } = useUserExperience();
  const { user } = useAuth();

  const [hasCompletedWelcome, setHasCompletedWelcome] = useState<boolean>(
    localStorage.getItem('cybersaarthi_welcomed') === 'true'
  );
  const [showAuth, setShowAuth] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCaretakerModal, setShowCaretakerModal] = useState(false);

  const handleWelcomeComplete = () => {
    localStorage.setItem('cybersaarthi_welcomed', 'true');
    setHasCompletedWelcome(true);
  };

  // If user hasn't completed welcome screen yet
  if (!hasCompletedWelcome) {
    if (showAuth) {
      return (
        <AuthPage
          onBack={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            handleWelcomeComplete();
          }}
        />
      );
    }

    return (
      <WelcomePage
        onComplete={handleWelcomeComplete}
        onOpenAuth={() => setShowAuth(true)}
      />
    );
  }

  if (showAuth) {
    return (
      <AuthPage
        onBack={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Adaptive Header */}
      <Navbar
        onOpenContacts={() => setShowContactsModal(true)}
        onOpenCaretakerModal={() => setShowCaretakerModal(true)}
      />

      {/* Main Experience Body (Genuinely adapted to the 4 personas) */}
      <main className="flex-1">
        {mode === 'kid' && (
          <KidsHome
            onOpenContacts={() => setShowContactsModal(true)}
            onOpenCaretakerModal={() => setShowCaretakerModal(true)}
          />
        )}

        {mode === 'senior' && (
          <SeniorHome
            onOpenContacts={() => setShowContactsModal(true)}
            onOpenCaretakerModal={() => setShowCaretakerModal(true)}
          />
        )}

        {mode === 'adult' && (
          <AdultDashboard
            onOpenCaretakerModal={() => setShowCaretakerModal(true)}
          />
        )}

        {mode === 'caretaker' && (
          <CaretakerDashboard />
        )}
      </main>

      {/* Common Accessible Modals */}
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
            <button onClick={() => setHasCompletedWelcome(false)} className="hover:text-blue-600">Switch Persona</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
