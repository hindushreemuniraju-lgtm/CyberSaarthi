import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUserExperience } from '../context/UserExperienceContext';
import { UserMode, Language } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Sparkles,
  HeartHandshake,
  UserCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Mic,
  Volume2,
  Smartphone,
  Globe,
  HelpCircle,
  X
} from 'lucide-react';

interface AuthPageProps {
  onBack?: () => void;
  onSuccess?: (redirectUrl?: string) => void;
  initialMode?: UserMode;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess, initialMode = 'adult' }) => {
  const { t } = useTranslation();
  const { login, register, loginAsDemo } = useAuth();
  const { setMode, setLanguage } = useUserExperience();

  // Mode & Form state
  const [selectedRole, setSelectedRole] = useState<UserMode>(initialMode);
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [voiceAssisting, setVoiceAssisting] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pass)) score += 1;

    let label = 'Weak';
    let color = 'bg-rose-500';
    let percent = 20;

    if (score >= 5) {
      label = 'Very Strong';
      color = 'bg-emerald-500';
      percent = 100;
    } else if (score >= 4) {
      label = 'Strong';
      color = 'bg-teal-500';
      percent = 80;
    } else if (score >= 3) {
      label = 'Good';
      color = 'bg-amber-500';
      percent = 60;
    } else if (score >= 2) {
      label = 'Fair';
      color = 'bg-orange-500';
      percent = 40;
    }

    return { score, label, color, percent };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Voice Assistance for Seniors
  const handleVoiceGuidance = () => {
    if (!('speechSynthesis' in window)) {
      alert("Voice speech is not supported in this browser.");
      return;
    }
    setVoiceAssisting(true);
    window.speechSynthesis.cancel();
    const text = selectedRole === 'senior'
      ? (selectedLang === 'kn'
          ? "ಸೈಬರ್‌ ಸಾರಥಿಗೆ ಸುಸ್ವಾಗತ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ."
          : selectedLang === 'hi'
          ? "साइबर सारथी में आपका स्वागत है। कृपया अपना यूजरनेम या ईमेल और पासवर्ड दर्ज करें।"
          : "Welcome to CyberSaarthi Senior Mode. Please enter your email or username and password to log in safely.")
      : "Welcome to CyberSaarthi. Select your experience mode and enter your credentials.";

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setVoiceAssisting(false);
    utterance.onerror = () => setVoiceAssisting(false);
    window.speechSynthesis.speak(utterance);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isRegister) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please retype and confirm.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters with numbers and symbols.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await register({
          full_name: fullName.trim(),
          email: identifier.includes('@') ? identifier.trim() : `${username.trim() || 'user'}@cybersaarthi.org`,
          username: username.trim() || (identifier.includes('@') ? identifier.split('@')[0] : identifier.trim()),
          phone: phone.trim() || undefined,
          password,
          confirm_password: confirmPassword,
          role: selectedRole,
          preferred_language: selectedLang
        });
        await setMode(selectedRole);
        await setLanguage(selectedLang);
        setSuccessMsg(`Account created successfully as ${selectedRole.toUpperCase()}! Redirecting...`);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.redirect_url);
        }, 800);
      } else {
        const res = await login(identifier.trim(), password, rememberMe);
        await setMode(res.role as UserMode);
        setSuccessMsg(`Welcome back! Authenticated as ${res.role.toUpperCase()}.`);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.redirect_url);
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login (Judges & Hackathon evaluation)
  const handleDemoSignIn = async (role: UserMode) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await loginAsDemo(role);
      await setMode(role);
      setSuccessMsg(`Instant demo login as ${role.toUpperCase()} successful! Redirecting...`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res.redirect_url);
      }, 700);
    } catch (err: any) {
      setErrorMsg("Demo login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Flow
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotIdentifier);
      setForgotSuccess(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotStep('reset');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Failed to process password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    if (newPassword !== confirmNewPassword) {
      setForgotError('New passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.resetPassword({
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmNewPassword
      });
      setForgotSuccess(res.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('request');
        setForgotIdentifier('');
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccessMsg("Password reset successfully. Please sign in with your new password.");
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // 4 Roles Configuration
  const rolesConfig: {
    id: UserMode;
    title: string;
    tagline: string;
    description: string;
    icon: React.ReactNode;
    cardTheme: string;
    badgeBg: string;
    badgeText: string;
    features: string[];
    redirectPath: string;
  }[] = [
    {
      id: 'kid',
      title: 'Kids Mode',
      tagline: 'Safe, Colorful & Gamified',
      description: 'Engaging cyber-safety stories, interactive quiz challenges, and rewards with friendly Saarthi mascot.',
      icon: <Sparkles className="w-6 h-6 text-amber-500 animate-bounce" />,
      cardTheme: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/40 hover:border-amber-400',
      badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      badgeText: '🧒 Safe Learning',
      features: ['Kid-Friendly Interface', 'Interactive Stories & Badges', 'Ask Caretaker Button'],
      redirectPath: '/kid'
    },
    {
      id: 'adult',
      title: 'Adult Mode',
      tagline: 'Professional Threat Intelligence',
      description: 'Deep link & message inspection, multi-engine risk scoring, scam detection, and financial fraud defense.',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      cardTheme: 'from-blue-600/15 via-blue-600/5 to-transparent border-blue-500/40 hover:border-blue-400',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      badgeText: '🧑💻 Security Console',
      features: ['Deep URL & APK Analysis', 'Risk Severity Breakdown', 'Real Threat Intelligence'],
      redirectPath: '/adult'
    },
    {
      id: 'caretaker',
      title: 'Caretaker Mode',
      tagline: 'Family Safety & Consent Hub',
      description: 'Manage linked children & elderly family accounts with consent-based monitoring and high-risk instant alerts.',
      icon: <UserCheck className="w-6 h-6 text-purple-400" />,
      cardTheme: 'from-purple-600/15 via-purple-600/5 to-transparent border-purple-500/40 hover:border-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      badgeText: '🛡️ Family Guardian',
      features: ['Protected Ward Linking', 'Instant Scam Alerts', 'Consent Revocation Control'],
      redirectPath: '/caretaker'
    },
    {
      id: 'senior',
      title: 'Senior Mode',
      tagline: 'High Contrast, Large Fonts & Voice',
      description: 'Accessible large buttons, read-aloud voice assistance in Kannada & Hindi, emergency family contacts.',
      icon: <HeartHandshake className="w-6 h-6 text-emerald-400" />,
      cardTheme: 'from-emerald-600/15 via-emerald-600/5 to-transparent border-emerald-500/40 hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      badgeText: '👵 Accessible & Voice',
      features: ['Multilingual Voice Audio', 'Digital Arrest Warning', 'One-Click Family Call'],
      redirectPath: '/senior'
    }
  ];

  return (
    <div className="min-h-screen bg-[#120726] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900 relative overflow-hidden font-sans">
      
      {/* Ambient Cyber Aubergine & Marigold Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 border-b border-purple-900/40 bg-[#170a30]/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/50 hover:bg-purple-800/60 text-slate-300 hover:text-white transition-all mr-1"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-950/50">
              <div className="w-full h-full bg-[#170a30] rounded-[14px] flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">CyberSaarthi</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  RDBMS Auth 2.0
                </span>
              </div>
              <p className="text-xs text-purple-300/70 font-medium">Your Digital Safety Companion</p>
            </div>
          </div>

          {/* Senior Voice Assistance Button */}
          {selectedRole === 'senior' && (
            <button
              onClick={handleVoiceGuidance}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                voiceAssisting
                  ? 'bg-emerald-500 text-slate-900 border-emerald-400 animate-pulse'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{voiceAssisting ? 'Speaking...' : 'Voice Help (ಧ್ವನಿ ಸಹಾಯ)'}</span>
            </button>
          )}

          {/* Language Selection */}
          <div className="flex items-center gap-1.5 bg-[#200e42] p-1 rounded-xl border border-purple-800/50 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
            {(['en', 'kn', 'hi'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setSelectedLang(l);
                  setLanguage(l);
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  selectedLang === l
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                {l === 'en' ? 'EN' : l === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        
        {/* Page Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>National Cyber Safety & Protection Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            CyberSaarthi
          </h1>
          <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-400 via-amber-200 to-purple-200 bg-clip-text text-transparent">
            Your Digital Safety Companion
          </p>
          <p className="text-sm sm:text-base font-medium text-slate-300 max-w-xl mx-auto">
            "One Platform. Four Experiences. Complete Digital Protection."
          </p>
        </div>

        {/* 4 Interactive Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-10">
          {rolesConfig.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between backdrop-blur-md bg-gradient-to-b ${
                  r.cardTheme
                } ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/50 bg-[#250f4c]/90 shadow-xl shadow-amber-400/10 scale-[1.02]'
                    : 'bg-[#1a0a36]/60 border-purple-900/50 hover:bg-[#220d47]/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${r.badgeBg}`}>
                      {r.badgeText}
                    </span>
                    <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800/40">
                      {r.icon}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs font-semibold text-amber-400/90 mb-2">{r.tagline}</p>
                  <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-3">
                    {r.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                      </span>
                    ) : (
                      <span className="text-purple-400/70 group-hover:text-purple-200">
                        Choose Mode
                      </span>
                    )}
                  </div>

                  {/* 1-Click Demo Shortcut */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoSignIn(r.id);
                    }}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-purple-700/50 transition-all"
                    title={`Instant demo sign in as ${r.title}`}
                  >
                    1-Click Demo →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Auth Glassmorphic Card */}
        <div className="max-w-xl mx-auto w-full rounded-3xl bg-[#190a36]/90 border border-purple-800/60 shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
          
          {/* Active Role Indicator Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-purple-950/80 border border-purple-700/50">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {selectedRole === 'kid' ? '🧒' : selectedRole === 'adult' ? '🧑💻' : selectedRole === 'caretaker' ? '🛡️' : '👵'}
              </span>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Active Mode: {selectedRole}
                </span>
                <span className="text-[11px] text-slate-300">
                  {isRegister ? `Registering for ${selectedRole.toUpperCase()} Dashboard` : `Signing in to ${selectedRole.toUpperCase()} Dashboard`}
                </span>
              </div>
            </div>

            <span className="text-xs font-extrabold text-slate-400">
              Role: <span className="text-white capitalize">{selectedRole}</span>
            </span>
          </div>

          {/* Toggle Tab: Sign In vs Register */}
          <div className="flex bg-[#230d4b] p-1.5 rounded-2xl border border-purple-800/60">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                !isRegister
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Sign In (ಲಾಗಿನ್)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                isRegister
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Create Account (ಖಾತೆ ತೆರೆಯಿರಿ)
            </button>
          </div>

          {/* Alerts / Feedback */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-600/70 text-rose-200 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Additional Fields for Registration */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arun Sharma or Riya Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#130728] border border-purple-800/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Username <span className="text-purple-400 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="text-purple-400 absolute left-3.5 top-2.5 font-bold text-xs">@</span>
                      <input
                        type="text"
                        placeholder="e.g. arun_safe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className="w-full pl-8 pr-3 py-2.5 text-sm bg-[#130728] border border-purple-800/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Phone Number <span className="text-purple-400 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="e.g. 9800000001"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#130728] border border-purple-800/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email or Username Identifier */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                {isRegister ? 'Email Address' : 'Email or Username'} <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type={isRegister ? 'email' : 'text'}
                  required
                  placeholder={isRegister ? "name@example.com" : "e.g. arun_adult or user@cybersaarthi.org"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#130728] border border-purple-800/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Password <span className="text-amber-400">*</span>
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotIdentifier(identifier);
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#130728] border border-purple-800/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-purple-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter (Live during registration) */}
              {isRegister && password.length > 0 && (
                <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-[#130728]/70 border border-purple-900/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Password Strength:</span>
                    <span className="font-extrabold text-amber-300">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                    <span className={password.length >= 8 ? "text-emerald-400 font-bold" : ""}>
                      ✓ 8+ Characters
                    </span>
                    <span className={/[A-Z]/.test(password) ? "text-emerald-400 font-bold" : ""}>
                      ✓ Uppercase Letter
                    </span>
                    <span className={/[0-9]/.test(password) ? "text-emerald-400 font-bold" : ""}>
                      ✓ Number (0-9)
                    </span>
                    <span className={/[!@#$%^&*]/.test(password) ? "text-emerald-400 font-bold" : ""}>
                      ✓ Symbol (!@#$)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm bg-[#130728] border rounded-xl text-white outline-none transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500 focus:border-rose-400'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500 focus:border-emerald-400'
                        : 'border-purple-800/80 focus:border-amber-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-purple-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1">Passwords do not match.</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Passwords match securely.</p>
                )}
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-purple-800 text-amber-400 focus:ring-amber-400 bg-[#130728]"
                />
                <span>Remember this device</span>
              </label>

              <span className="text-[11px] text-purple-400 font-medium">
                Protected by RDBMS & Bcrypt
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Securing session...</span>
              ) : isRegister ? (
                <>
                  <span>Create {selectedRole.toUpperCase()} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In to {selectedRole.toUpperCase()} Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Evaluation Panel */}
          <div className="pt-4 border-t border-purple-900/50">
            <span className="block text-center text-[10px] font-black uppercase tracking-wider text-purple-400 mb-2.5">
              Instant Hackathon Demo Accounts (1-Click Evaluation)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSignIn('kid')}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 font-bold flex items-center gap-1.5 truncate"
              >
                <span>🧒 Riya (Kid)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('adult')}
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 font-bold flex items-center gap-1.5 truncate"
              >
                <span>🧑💻 Arun (Adult)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('caretaker')}
                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 font-bold flex items-center gap-1.5 truncate"
              >
                <span>🛡️ Suresh (Caretaker)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('senior')}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold flex items-center gap-1.5 truncate"
              >
                <span>👵 Lakshmi (Senior, KN)</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#1a0a36] border border-purple-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Reset Account Password</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-950/80 border border-rose-600/70 text-rose-200 rounded-xl text-xs font-semibold">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 rounded-xl text-xs font-semibold">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered email address or username. A secure reset authorization code will be issued.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Email or Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. arun_adult or user@example.com"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#130728] border border-purple-800 focus:border-amber-400 rounded-xl text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow"
                >
                  {forgotLoading ? 'Generating token...' : 'Request Reset Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#130728] border border-purple-800 rounded-xl text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="New password (8+ chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#130728] border border-purple-800 focus:border-amber-400 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#130728] border border-purple-800 focus:border-amber-400 rounded-xl text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow"
                >
                  {forgotLoading ? 'Updating password...' : 'Update Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-20 border-t border-purple-900/40 bg-[#14082c]/80 backdrop-blur-md py-4 px-4 text-center text-xs text-purple-300/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CyberSaarthi. Built for VTU Community & National Digital Safety.</p>
          <div className="flex gap-4 font-semibold text-purple-300">
            <span>MySQL RDBMS</span>
            <span>•</span>
            <span>Bcrypt Hashing</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
