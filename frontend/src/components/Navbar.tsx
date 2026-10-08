import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { ModeSwitcher } from './ModeSwitcher';
import {
  Shield,
  Sparkles,
  HeartHandshake,
  UserCheck,
  LogOut,
  User as UserIcon,
  PhoneCall,
  Bell,
  BookOpen
} from 'lucide-react';

interface NavbarProps {
  onOpenContacts?: () => void;
  onOpenCaretakerModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenContacts,
  onOpenCaretakerModal
}) => {
  const { t } = useTranslation();
  const { mode } = useUserExperience();
  const { user, logout } = useAuth();

  const isSenior = mode === 'senior';
  const isKid = mode === 'kid';

  return (
    <header className={`sticky top-0 z-40 transition-all border-b ${
      isKid
        ? 'bg-amber-50/95 border-amber-200 backdrop-blur-md'
        : isSenior
        ? 'bg-white border-slate-300 shadow-sm'
        : 'bg-white/95 border-slate-200 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center rounded-2xl shadow-sm ${
              isKid
                ? 'w-12 h-12 bg-amber-400 text-amber-950 animate-float'
                : isSenior
                ? 'w-14 h-14 bg-emerald-600 text-white'
                : 'w-11 h-11 bg-blue-700 text-white'
            }`}>
              {isKid ? (
                <Sparkles className="w-7 h-7" />
              ) : isSenior ? (
                <HeartHandshake className="w-8 h-8" />
              ) : mode === 'caretaker' ? (
                <UserCheck className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black tracking-tight text-slate-900 ${
                  isSenior ? 'text-2xl' : 'text-xl'
                }`}>
                  {t('brand.name')}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  VTU Societal Project
                </span>
              </div>
              <p className={`hidden md:block text-slate-500 font-medium ${
                isSenior ? 'text-sm' : 'text-xs'
              }`}>
                {t('brand.tagline')}
              </p>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="hidden lg:flex items-center">
            <ModeSwitcher />
          </div>

          {/* Right Controls: Language, Emergency & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector compact={!isSenior} />

            {/* Quick Emergency Contacts button for Seniors & Kids */}
            {(isSenior || isKid) && onOpenContacts && (
              <button
                onClick={onOpenContacts}
                aria-label="Call emergency contact"
                className={`flex items-center gap-2 rounded-xl font-bold transition-all shadow-sm ${
                  isSenior
                    ? 'px-4 py-2.5 text-base bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]'
                    : 'px-3 py-2 text-xs bg-rose-100 hover:bg-rose-200 text-rose-800'
                }`}
              >
                <PhoneCall className={isSenior ? 'w-5 h-5' : 'w-4 h-4'} />
                <span className="hidden sm:inline">{isSenior ? 'Call Contact' : 'Help'}</span>
              </button>
            )}

            {/* User Session Info & Logout */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{user.user_mode}</span>
                </div>
                <button
                  onClick={logout}
                  title={t('nav.logout')}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Mode Switcher Bar */}
        <div className="lg:hidden pb-3 pt-1 flex justify-center">
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
};
