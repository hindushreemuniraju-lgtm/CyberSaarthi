import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { useAuth } from '../context/AuthContext';
import { UserMode } from '../types';
import { Sparkles, Shield, HeartHandshake, UserCheck } from 'lucide-react';

export const ModeSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useUserExperience();
  const { user, loginAsDemo } = useAuth();

  const modesConfig: { id: UserMode; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'kid',
      label: t('modes.kid'),
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      color: 'hover:border-amber-400'
    },
    {
      id: 'adult',
      label: t('modes.adult'),
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      color: 'hover:border-blue-400'
    },
    {
      id: 'senior',
      label: t('modes.senior'),
      icon: <HeartHandshake className="w-4 h-4 text-emerald-600" />,
      color: 'hover:border-emerald-400'
    },
    {
      id: 'caretaker',
      label: t('modes.caretaker'),
      icon: <UserCheck className="w-4 h-4 text-purple-600" />,
      color: 'hover:border-purple-400'
    }
  ];

  const handleSelectMode = async (m: UserMode) => {
    // If not logged in, or if logged in as a demo user, switch persona seamlessly
    if (!user || user.email?.includes('@cybersaarthi.org')) {
      await loginAsDemo(m);
    }
    await setMode(m);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
      {modesConfig.map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelectMode(item.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              active
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
