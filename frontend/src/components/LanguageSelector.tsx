import React from 'react';
import { useUserExperience } from '../context/UserExperienceContext';
import { Language } from '../types';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, mode } = useUserExperience();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
  ];

  const isSenior = mode === 'senior';

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-sm">
      <div className={`flex items-center justify-center text-slate-500 ${isSenior ? 'px-3 py-1 text-lg' : 'px-2 py-1'}`}>
        <Globe className={isSenior ? 'w-6 h-6 text-blue-600' : 'w-4 h-4'} />
      </div>
      <div className="flex gap-1">
        {languages.map((l) => {
          const active = language === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              aria-label={`Switch to ${l.label}`}
              className={`rounded-lg font-medium transition-all ${
                isSenior
                  ? 'px-4 py-2 text-base min-h-[44px]'
                  : compact
                  ? 'px-2 py-1 text-xs'
                  : 'px-3 py-1.5 text-xs'
              } ${
                active
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l.native}
            </button>
          );
        })}
      </div>
    </div>
  );
};
