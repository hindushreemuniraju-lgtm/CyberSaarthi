import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { useAuth } from '../context/AuthContext';
import { UserMode, Language } from '../types';
import {
  Sparkles,
  Shield,
  HeartHandshake,
  UserCheck,
  Globe,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface WelcomePageProps {
  onComplete: () => void;
  onOpenAuth: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onComplete,
  onOpenAuth
}) => {
  const { t } = useTranslation();
  const { mode, setMode, language, setLanguage } = useUserExperience();
  const { loginAsDemo } = useAuth();

  const [selectedMode, setSelectedMode] = useState<UserMode>(mode);
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const personas: {
    id: UserMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'kid',
      title: "🧒 I’m a Kid",
      description: t('modes.kid_desc'),
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      color: 'border-amber-400 bg-amber-50/50 hover:bg-amber-100/50'
    },
    {
      id: 'adult',
      title: "👩 I’m an Adult",
      description: t('modes.adult_desc'),
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      color: 'border-blue-400 bg-blue-50/50 hover:bg-blue-100/50'
    },
    {
      id: 'senior',
      title: "👵 I’m a Senior",
      description: t('modes.senior_desc'),
      icon: <HeartHandshake className="w-8 h-8 text-emerald-600" />,
      color: 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/50'
    },
    {
      id: 'caretaker',
      title: "👨‍👩‍👧 I’m a Care Taker",
      description: t('modes.caretaker_desc'),
      icon: <UserCheck className="w-8 h-8 text-purple-600" />,
      color: 'border-purple-400 bg-purple-50/50 hover:bg-purple-100/50'
    }
  ];

  const languages: { id: Language; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { id: 'hi', label: 'Hindi', native: 'हिन्दी' }
  ];

  const handleStart = async () => {
    await setMode(selectedMode);
    await setLanguage(selectedLang);
    // Auto-login to demo persona so the app is instantly rich with data
    try {
      await loginAsDemo(selectedMode);
    } catch (e) {
      // Continue anyway
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-8 animate-fade-in">
        
        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>VTU Societal Cyber Safety Companion</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {t('welcome.title')}
          </h1>
          <p className="text-lg sm:text-xl font-bold text-slate-600">
            {t('welcome.subtitle')}
          </p>
          <p className="text-base font-semibold text-blue-600 pt-2">
            {t('welcome.question')}
          </p>
        </div>

        {/* 4 Large Persona Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((p) => {
            const isSelected = selectedMode === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedMode(p.id)}
                className={`p-6 rounded-3xl border-3 text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? `${p.color} ring-4 ring-blue-200 border-blue-600 shadow-md scale-102`
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-slate-900">{p.title}</span>
                    {p.icon}
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selected Experience</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Preferred Language Selection */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="block text-center text-sm font-bold text-slate-700 flex items-center justify-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{t('welcome.choose_lang')}</span>
          </label>

          <div className="flex justify-center gap-3">
            {languages.map((l) => {
              const active = selectedLang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedLang(l.id)}
                  className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {l.native} ({l.label})
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={onOpenAuth}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 underline"
          >
            Sign in with existing credentials
          </button>

          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-base bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>{t('welcome.start_button')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
