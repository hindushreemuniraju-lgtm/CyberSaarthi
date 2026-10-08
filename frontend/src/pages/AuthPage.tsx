import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUserExperience } from '../context/UserExperienceContext';
import { UserMode, Language } from '../types';
import { Shield, Lock, Mail, User, Phone, ArrowLeft, Sparkles, HeartHandshake, UserCheck } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const { t } = useTranslation();
  const { login, register, loginAsDemo } = useAuth();
  const { setMode, setLanguage } = useUserExperience();

  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [regMode, setRegMode] = useState<UserMode>('adult');
  const [regLang, setRegLang] = useState<Language>('en');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name,
          email: identifier.includes('@') ? identifier : undefined,
          phone: !identifier.includes('@') ? identifier : (phone || undefined),
          password,
          user_mode: regMode,
          preferred_language: regLang
        });
        await setMode(regMode);
        await setLanguage(regLang);
      } else {
        await login(identifier, password);
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (m: UserMode, lang: Language) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginAsDemo(m);
      await setMode(m);
      await setLanguage(lang);
      onSuccess();
    } catch (err: any) {
      setErrorMsg("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        
        {/* Top Back & Brand */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-1.5 text-blue-700 font-black text-sm">
            <Shield className="w-4 h-4" />
            <span>CyberSaarthi</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('nav.login')}
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('nav.register')}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Riya Muniraju"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Experience</label>
                  <select
                    value={regMode}
                    onChange={(e) => setRegMode(e.target.value as UserMode)}
                    className="w-full px-2 py-2 text-xs border rounded-xl font-medium"
                  >
                    <option value="adult">Adult</option>
                    <option value="kid">Kid</option>
                    <option value="senior">Senior</option>
                    <option value="caretaker">Care Taker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
                  <select
                    value={regLang}
                    onChange={(e) => setRegLang(e.target.value as Language)}
                    className="w-full px-2 py-2 text-xs border rounded-xl font-medium"
                  >
                    <option value="en">English</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. arun@cybersaarthi.org or 9800000004"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition-all"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Instant 1-Click Persona Demos */}
        <div className="pt-4 border-t border-slate-100">
          <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Instant 1-Click Demo Profiles
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('senior', 'kn')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">👵 Lakshmi (Senior, KN)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('caretaker', 'en')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="truncate">👨‍👩‍👧 Suresh (Caretaker)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('kid', 'en')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="truncate">🧒 Riya (Kid)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('adult', 'en')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">👩 Arun (Adult)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
