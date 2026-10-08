import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { ScanResult } from '../types';
import { VoiceService } from '../services/voiceService';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Users,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';

interface ResultCardProps {
  result: ScanResult;
  onReset: () => void;
  onAskCaretaker?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onReset,
  onAskCaretaker
}) => {
  const { t } = useTranslation();
  const { mode, language } = useUserExperience();
  const [showTechnical, setShowTechnical] = useState(mode === 'adult' || mode === 'caretaker');
  const [speaking, setSpeaking] = useState(false);

  const isKid = mode === 'kid';
  const isSenior = mode === 'senior';
  const isBlock = result.risk_level === 'BLOCK';
  const isWarn = result.risk_level === 'WARN';
  const isSafe = result.risk_level === 'SAFE';

  const readAloudContent = `${result.headline}. ${result.explanation}. ${result.recommendation}`;

  const toggleSpeak = () => {
    if (speaking) {
      VoiceService.stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      VoiceService.speak(readAloudContent, language, () => setSpeaking(false));
    }
  };

  // Determine styling based on Risk Level
  const badgeColors = {
    SAFE: 'bg-emerald-500 text-white',
    WARN: 'bg-amber-500 text-white',
    BLOCK: 'bg-rose-600 text-white'
  }[result.risk_level];

  const cardBorder = {
    SAFE: 'border-emerald-300 bg-emerald-50/40',
    WARN: 'border-amber-300 bg-amber-50/40',
    BLOCK: 'border-rose-300 bg-rose-50/40'
  }[result.risk_level];

  // -------------------------------------------------------------
  // SENIOR MODE RESULT PRESENTATION
  // -------------------------------------------------------------
  if (isSenior) {
    return (
      <div className={`w-full max-w-3xl mx-auto rounded-3xl p-6 md:p-8 border-4 shadow-xl ${
        isBlock ? 'border-rose-600 bg-rose-50/80' : isWarn ? 'border-amber-500 bg-amber-50/80' : 'border-emerald-600 bg-emerald-50/80'
      }`}>
        {/* Massive Attention Header */}
        <div className="flex items-center gap-4 mb-6">
          {isBlock ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center pulse-glow-danger">
              <ShieldAlert className="w-10 h-10" />
            </div>
          ) : isWarn ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-10 h-10" />
            </div>
          )}

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              {result.headline}
            </h2>
            <p className="text-lg font-semibold text-slate-600 mt-1">
              {isBlock ? t('senior.stop_banner') : isWarn ? t('scan.warn_title') : t('scan.safe_title')}
            </p>
          </div>
        </div>

        {/* Large Simple Explanation */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 mb-6 text-slate-800 text-xl leading-relaxed">
          <p className="font-medium">{result.explanation}</p>
        </div>

        {/* What To Do (Action Recommendation) */}
        <div className="bg-blue-50/80 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-slate-800">
          <h4 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            <span>{t('scan.recommendation_label')}:</span>
          </h4>
          <p className="text-xl font-semibold text-blue-950">{result.recommendation}</p>
        </div>

        {/* Large Senior Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={toggleSpeak}
            className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl text-xl font-bold bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-md active:scale-95 transition-all"
          >
            {speaking ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            <span>{speaking ? t('scan.stop_reading') : t('scan.read_aloud')}</span>
          </button>

          {onAskCaretaker && (
            <button
              onClick={onAskCaretaker}
              className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all"
            >
              <Users className="w-8 h-8" />
              <span>{t('senior.btn_ask_caretaker')}</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="sm:col-span-2 flex items-center justify-center gap-3 px-6 py-5 rounded-2xl text-xl font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-8 h-8" />
            <span>{t('scan.go_back')}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // KIDS MODE RESULT PRESENTATION
  // -------------------------------------------------------------
  if (isKid) {
    return (
      <div className={`w-full max-w-2xl mx-auto rounded-3xl p-6 md:p-8 border-4 shadow-xl ${
        isBlock ? 'border-rose-400 bg-rose-50' : isWarn ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'
      }`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="text-5xl mb-3 animate-bounce">
            {isBlock ? '🛑' : isWarn ? '⚠️' : '🌟'}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            {result.headline}
          </h2>
          <div className="inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-700 shadow-sm">
            {t('kids.mascot_name')}: "{result.explanation}"
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 mb-6 text-slate-700 text-lg font-medium">
          <div className="font-bold text-blue-700 mb-1">💡 What should you do?</div>
          {result.recommendation}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={toggleSpeak}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-lg bg-amber-400 hover:bg-amber-500 text-amber-950 shadow active:scale-95"
          >
            {speaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            <span>{speaking ? t('scan.stop_reading') : t('scan.read_aloud')}</span>
          </button>

          {isBlock && onAskCaretaker && (
            <button
              onClick={onAskCaretaker}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow active:scale-95"
            >
              <Users className="w-6 h-6" />
              <span>{t('kids.ask_adult_button')}</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-lg bg-slate-200 hover:bg-slate-300 text-slate-700 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>{t('scan.go_back')}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADULT & CARETAKER DETAILED PRESENTATION
  // -------------------------------------------------------------
  return (
    <div className={`w-full max-w-3xl mx-auto rounded-2xl p-6 md:p-8 border shadow-lg transition-all ${cardBorder}`}>
      {/* Top Header & Risk Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          {isBlock ? (
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          ) : isWarn ? (
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          )}
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColors}`}>
              {result.risk_level === 'SAFE' ? t('common.safe') : result.risk_level === 'WARN' ? t('common.warn') : t('common.block')}
            </span>
            <span className="ml-3 text-xs text-slate-500">
              {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Risk Score Pill */}
        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{t('scan.risk_score')}:</span>
          <span className={`text-2xl font-black ${
            isBlock ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {result.risk_score}
          </span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Main Headline & Explanation */}
      <div className="mt-5 space-y-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {result.headline}
          </h3>
          <p className="mt-2 text-slate-700 leading-relaxed">
            {result.explanation}
          </p>
        </div>

        {/* Actionable Recommendation */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {t('scan.recommendation_label')}
          </h4>
          <p className="text-sm font-semibold text-slate-800">
            {result.recommendation}
          </p>
        </div>

        {/* External Threat Intelligence Status */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>{result.status_message}</span>
          <button
            onClick={toggleSpeak}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
            <span>{speaking ? t('scan.stop_reading') : t('scan.read_aloud')}</span>
          </button>
        </div>

        {/* Expandable Technical Signals */}
        {result.signals.length > 0 && (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>{t('scan.technical_details')} ({result.signals.length} Signals Detected)</span>
              {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnical && (
              <div className="px-4 pb-4 divide-y divide-slate-100">
                {result.signals.map((sig, idx) => (
                  <div key={idx} className="py-2.5 first:pt-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{sig.title}</span>
                      <span className="text-rose-600 font-mono">+{sig.severity} pts</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{sig.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onReset}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
        >
          {t('scan.check_button')} Another
        </button>

        {isBlock && onAskCaretaker && (
          <button
            onClick={onAskCaretaker}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>{t('scan.ask_caretaker')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
