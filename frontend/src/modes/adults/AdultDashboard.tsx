import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../../context/UserExperienceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ScanResult } from '../../types';
import { ResultCard } from '../../components/ResultCard';
import { VoiceAssistant } from '../../components/VoiceAssistant';
import {
  Shield,
  Search,
  ClipboardPaste,
  History,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const AdultDashboard: React.FC<{
  onOpenCaretakerModal?: () => void;
}> = ({ onOpenCaretakerModal }) => {
  const { t } = useTranslation();
  const { language } = useUserExperience();
  const { user } = useAuth();

  const [inputContent, setInputContent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getScanHistory(6);
      setScanHistory(res.history || []);
    } catch (err) {
      console.error("Failed to load scan history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleScan = async (textToScan?: string) => {
    const text = textToScan || inputContent;
    if (!text.trim()) return;

    setScanning(true);
    setScanResult(null);

    try {
      const res = await api.performScan(text, 'adult', language);
      setScanResult(res);
      loadHistory();
    } catch (err) {
      alert("Analysis failed. Please check the network connection.");
    } finally {
      setScanning(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setInputContent(clipText);
      }
    } catch (e) {
      console.warn("Clipboard access denied");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Sleek Greeting & Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>CyberSaarthi Threat Analysis Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.name || 'Explorer'} 👋
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              What link, SMS, or suspicious message would you like to inspect today?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-600">Local & Multi-Engine Intelligence Active</span>
          </div>
        </div>

        {/* MAIN INPUT SCANNER */}
        {!scanResult ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <label className="block text-sm font-bold text-slate-800">
              {t('scan.input_label')}
            </label>

            <div className="relative">
              <textarea
                rows={4}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={t('scan.placeholder')}
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium resize-none text-slate-900"
              />
              
              {/* Paste button inside textarea */}
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                className="absolute right-3 top-3 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-all"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{t('scan.paste_button')}</span>
              </button>
            </div>

            {/* Scanning Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <VoiceAssistant
                onTranscript={(transcript) => {
                  setInputContent(transcript);
                  handleScan(transcript);
                }}
              />

              <button
                onClick={() => handleScan()}
                disabled={scanning || !inputContent.trim()}
                className="px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {scanning ? (
                  <span>{t('scan.analyzing')}</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{t('scan.check_button')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Pre-fills */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sample Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const txt = "http://sbi-kyc-update-portal.xyz/verify-login";
                    setInputContent(txt);
                    handleScan(txt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200"
                >
                  🛑 Phishing: Fake SBI KYC Portal
                </button>
                <button
                  onClick={() => {
                    const txt = "Dear customer, your bank account is blocked. Verify PAN within 24 hours immediately.";
                    setInputContent(txt);
                    handleScan(txt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200"
                >
                  ⚠️ Coercion: Urgent Account Block SMS
                </button>
                <button
                  onClick={() => {
                    const txt = "https://www.incometax.gov.in";
                    setInputContent(txt);
                    handleScan(txt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200"
                >
                  🟢 Verified: Income Tax Govt Domain
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ResultCard
            result={scanResult}
            onReset={() => {
              setScanResult(null);
              setInputContent('');
            }}
            onAskCaretaker={onOpenCaretakerModal}
          />
        )}

        {/* SCAN HISTORY SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>{t('nav.history')}</span>
            </h2>
            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {scanHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">{t('scan.no_history')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {scanHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-semibold text-slate-800 truncate">{item.input_preview}</p>
                    <p className="text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      item.risk_level === 'BLOCK'
                        ? 'bg-rose-100 text-rose-800'
                        : item.risk_level === 'WARN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.risk_level} • {item.risk_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
