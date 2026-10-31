import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../../context/UserExperienceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ScanResult, SafetyTipItem } from '../../types';
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
  ChevronRight,
  Globe,
  Radio,
  ServerCrash,
  BookOpen,
  Filter,
  RefreshCw
} from 'lucide-react';

export const AdultDashboard: React.FC<{
  onOpenCaretakerModal?: () => void;
}> = ({ onOpenCaretakerModal }) => {
  const { t } = useTranslation();
  const { language } = useUserExperience();
  const { user } = useAuth();

  const [inputContent, setInputContent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'BLOCK' | 'WARN' | 'SAFE'>('ALL');
  const [errorState, setErrorState] = useState<string | null>(null);
  const [tips, setTips] = useState<SafetyTipItem[]>([]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'tips'>('scanner');

  useEffect(() => {
    loadHistory();
    loadTips();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getScanHistory(20);
      setScanHistory(res.history || []);
    } catch (err) {
      console.error("Failed to load scan history", err);
    }
  };

  const loadTips = async () => {
    try {
      const res = await api.getTips(language, 'adult');
      setTips(res.tips || []);
    } catch (err) {
      console.error("Failed to load safety tips", err);
    }
  };

  const handleScan = async (textToScan?: string) => {
    const text = textToScan || inputContent;
    if (!text.trim()) return;

    setScanning(true);
    setErrorState(null);
    setScanResult(null);
    setScanStep(1);

    // Multi-stage realistic inspection animation
    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await api.performScan(text, 'adult', language);
      clearInterval(stepInterval);
      setScanStep(4);
      setTimeout(() => {
        setScanResult(res);
        setScanning(false);
        loadHistory();
      }, 350);
    } catch (err: any) {
      clearInterval(stepInterval);
      setScanning(false);
      setErrorState(err.message || "Threat Intelligence service unreachable. Please retry or check network.");
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

  const filteredHistory = scanHistory.filter(item => {
    if (historyFilter === 'ALL') return true;
    return item.risk_level === historyFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Sleek Dark Cyber Console Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>CyberSaarthi Enterprise Intelligence Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.name || 'Security Lead'} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Inspect suspicious URLs, SMS, UPI requests, or coercive scam messages with real-time multi-signal scoring.
            </p>
          </div>

          {/* Engine Status Tag */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-semibold text-slate-300">Engine v1.0 • Deterministic Scorer</span>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scanner' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Threat Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Scan Telemetry ({scanHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tips' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Threat Intelligence Guides</span>
          </button>
        </div>

        {/* TAB 1: THREAT SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {!scanResult ? (
              <div className="bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-200">
                    Input Suspicious URL, SMS, or Message Payload:
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">Strict SSRF & Injection Protected</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder="e.g. http://sbi-kyc-update-portal.xyz/verify-login or 'Your account will be blocked today...'"
                    className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-mono text-slate-100 resize-none transition-all"
                  />
                  
                  {/* Paste button inside textarea */}
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                    className="absolute right-3 top-3 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 flex items-center gap-1 transition-all"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                </div>

                {/* Error Banner */}
                {errorState && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ServerCrash className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{errorState}</span>
                    </div>
                    <button
                      onClick={() => handleScan()}
                      className="px-3 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-500"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Realistic Multi-stage Inspection Progress */}
                {scanning && (
                  <div className="p-5 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                      <span>Analyzing security indicators...</span>
                      <span>Step {scanStep} of 4</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${(scanStep / 4) * 100}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-300 font-mono">
                      {scanStep === 1 && "• Parsing URL anatomy & RFC compliant syntax"}
                      {scanStep === 2 && "• Testing Shannon entropy & Punycode homograph patterns"}
                      {scanStep === 3 && "• Checking external threat feeds (Safe Browsing / VirusTotal)"}
                      {scanStep === 4 && "• Synthesizing contextual risk score & mitigation steps"}
                    </p>
                  </div>
                )}

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
                    className="px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Search className="w-4 h-4" />
                    <span>Analyze Content</span>
                  </button>
                </div>

                {/* Sample Test Scenarios */}
                <div className="pt-4 border-t border-slate-700/60">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    Pre-Engineered Threat Vectors:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const txt = "http://sbi-kyc-update-portal.xyz/verify-login";
                        setInputContent(txt);
                        handleScan(txt);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono border border-rose-500/30"
                    >
                      🛑 Brand Impersonation (Fake SBI)
                    </button>
                    <button
                      onClick={() => {
                        const txt = "Dear customer, your bank account is blocked. Verify PAN within 24 hours immediately.";
                        setInputContent(txt);
                        handleScan(txt);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30"
                    >
                      ⚠️ High-Urgency SMS Coercion
                    </button>
                    <button
                      onClick={() => {
                        const txt = "https://www.incometax.gov.in";
                        setInputContent(txt);
                        handleScan(txt);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30"
                    >
                      🟢 Authentic Domain (Income Tax Govt)
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
          </div>
        )}

        {/* TAB 2: SCAN TELEMETRY & HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Security Inspection Log</h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
                {(['ALL', 'BLOCK', 'WARN', 'SAFE'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      historyFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No telemetry entries match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1 max-w-xl">
                      <p className="font-mono text-slate-200 truncate">{item.input_preview}</p>
                      <p className="text-[11px] text-slate-400">{item.primary_reason}</p>
                      <p className="text-[10px] font-mono text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-bold uppercase text-[10px] ${
                        item.risk_level === 'BLOCK'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.risk_level === 'WARN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.risk_level} • {item.risk_score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: THREAT GUIDES */}
        {activeTab === 'tips' && (
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">Cyber Threat Field Guides</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip) => (
                <div key={tip.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2">
                  <h4 className="font-bold text-blue-400 text-sm">{tip.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{tip.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
