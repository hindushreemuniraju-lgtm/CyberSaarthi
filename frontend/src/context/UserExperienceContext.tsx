import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserMode, Language, FontScale } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface UserExperienceContextType {
  mode: UserMode;
  language: Language;
  fontScale: FontScale;
  voiceEnabled: boolean;
  complexity: 'simple' | 'detailed';
  setMode: (mode: UserMode) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setFontScale: (scale: FontScale) => Promise<void>;
  setVoiceEnabled: (enabled: boolean) => Promise<void>;
}

const UserExperienceContext = createContext<UserExperienceContextType | undefined>(undefined);

export const UserExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user, updateUser } = useAuth();

  const [mode, setModeState] = useState<UserMode>(
    (localStorage.getItem('cybersaarthi_mode') as UserMode) || 'adult'
  );
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('cybersaarthi_language') as Language) || 'en'
  );
  const [fontScale, setFontScaleState] = useState<FontScale>(
    (localStorage.getItem('cybersaarthi_font_scale') as FontScale) || 'normal'
  );
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(
    localStorage.getItem('cybersaarthi_voice') === 'true'
  );

  // Sync with logged in user's profile
  useEffect(() => {
    if (user) {
      if (user.user_mode) setModeState(user.user_mode);
      if (user.preferred_language) {
        setLanguageState(user.preferred_language);
        i18n.changeLanguage(user.preferred_language);
      }
      if (user.font_scale) setFontScaleState(user.font_scale);
      if (user.voice_enabled !== undefined) setVoiceEnabledState(user.voice_enabled);
    }
  }, [user]);

  // Apply font scale to document body
  useEffect(() => {
    document.body.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
    document.body.classList.add(`font-scale-${fontScale}`);
    localStorage.setItem('cybersaarthi_font_scale', fontScale);
  }, [fontScale]);

  const setMode = async (newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem('cybersaarthi_mode', newMode);

    // Default smart adaptation based on mode
    if (newMode === 'senior') {
      setFontScaleState('large');
      setVoiceEnabledState(true);
    } else if (newMode === 'kid') {
      setFontScaleState('normal');
    }

    if (user) {
      try {
        const res = await api.updatePreferences({ user_mode: newMode });
        updateUser(res.user);
      } catch (err) {
        console.error("Failed to sync mode to backend", err);
      }
    }
  };

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('cybersaarthi_language', newLang);
    i18n.changeLanguage(newLang);

    if (user) {
      try {
        const res = await api.updatePreferences({ preferred_language: newLang });
        updateUser(res.user);
      } catch (err) {
        console.error("Failed to sync language to backend", err);
      }
    }
  };

  const setFontScale = async (scale: FontScale) => {
    setFontScaleState(scale);
    if (user) {
      try {
        const res = await api.updatePreferences({ font_scale: scale });
        updateUser(res.user);
      } catch (err) {
        console.error("Failed to sync font scale", err);
      }
    }
  };

  const setVoiceEnabled = async (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    localStorage.setItem('cybersaarthi_voice', String(enabled));
    if (user) {
      try {
        const res = await api.updatePreferences({ voice_enabled: enabled });
        updateUser(res.user);
      } catch (err) {
        console.error("Failed to sync voice preference", err);
      }
    }
  };

  const complexity = (mode === 'kid' || mode === 'senior') ? 'simple' : 'detailed';

  return (
    <UserExperienceContext.Provider
      value={{
        mode,
        language,
        fontScale,
        voiceEnabled,
        complexity,
        setMode,
        setLanguage,
        setFontScale,
        setVoiceEnabled
      }}
    >
      {children}
    </UserExperienceContext.Provider>
  );
};

export const useUserExperience = () => {
  const context = useContext(UserExperienceContext);
  if (!context) throw new Error('useUserExperience must be used within UserExperienceProvider');
  return context;
};
