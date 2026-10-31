import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../../context/UserExperienceContext';
import { api } from '../../services/api';
import { ScanResult, SafetyTipItem } from '../../types';
import { ResultCard } from '../../components/ResultCard';
import { VoiceAssistant } from '../../components/VoiceAssistant';
import { VoiceService } from '../../services/voiceService';
import {
  Link2,
  Mic,
  Users,
  PhoneCall,
  Shield,
  Volume2,
  VolumeX,
  Type,
  ArrowLeft,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Globe
} from 'lucide-react';

interface SeniorHomeProps {
  onOpenContacts: () => void;
  onOpenCaretakerModal: () => void;
}

export const SeniorHome: React.FC<SeniorHomeProps> = ({
  onOpenContacts,
  onOpenCaretakerModal
}) => {
  const { t } = useTranslation();
  const { language, setLanguage, fontScale, setFontScale, voiceEnabled, setVoiceEnabled } = useUserExperience();

  const [activeAction, setActiveAction] = useState<'menu' | 'link' | 'message' | 'tips'>('menu');
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [tips, setTips] = useState<SafetyTipItem[]>([]);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const handleScan = async (textToScan?: string) => {
    const content = textToScan || inputText;
    if (!content.trim()) return;

    setScanning(true);
    setScanResult(null);

    try {
      const res = await api.performScan(content, 'senior', language);
      setScanResult(res);

      // In voice-first mode, immediately speak the outcome in the user's selected regional language
      if (voiceEnabled) {
        setIsReadingAloud(true);
        VoiceService.speak(`${res.headline}. ${res.explanation}. ${res.recommendation}`, language, () => {
          setIsReadingAloud(false);
        });
      }
    } catch (err) {
      alert("Something went wrong while checking. Please call your caretaker or family.");
    } finally {
      setScanning(false);
    }
  };

  const handleRepeatSpeech = () => {
    if (!scanResult) return;
    setIsReadingAloud(true);
    VoiceService.speak(`${scanResult.headline}. ${scanResult.explanation}. ${scanResult.recommendation}`, language, () => {
      setIsReadingAloud(false);
    });
  };

  const handleStopSpeech = () => {
    VoiceService.stopSpeaking();
    setIsReadingAloud(false);
  };

  const loadSeniorTips = async () => {
    setActiveAction('tips');
    try {
      const res = await api.getTips(language, 'senior');
      setTips(res.tips || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Warm Senior Welcome Header with Big Language & Text Size Controls */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-emerald-600 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {t('senior.greeting')} 🙏
              </h1>
              <p className="text-xl md:text-2xl font-bold text-emerald-800 mt-1">
                {t('senior.question')}
              </p>
            </div>

            {/* Quick Language Toggle Directly on Screen */}
            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-2xl border-2 border-emerald-300">
              <Globe className="w-5 h-5 text-emerald-700 ml-1" />
              {(['kn', 'hi', 'en'] as const).map((langCode) => (
                <button
                  key={langCode}
                  onClick={() => setLanguage(langCode)}
                  className={`px-4 py-2 rounded-xl font-bold text-base transition-all ${
                    language === langCode
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-emerald-950 hover:bg-emerald-100'
                  }`}
                >
                  {langCode === 'kn' ? 'ಕನ್ನಡ' : langCode === 'hi' ? 'हिन्दी' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Font Size & Voice Guidance Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setFontScale(fontScale === 'large' ? 'xlarge' : fontScale === 'xlarge' ? 'normal' : 'large')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-900 font-bold text-base shadow-sm active:scale-95 transition-all"
            >
              <Type className="w-5 h-5 text-blue-600" />
              <span>{fontScale === 'xlarge' ? 'Extra Large Text (🔠)' : fontScale === 'large' ? 'Large Text (🔤)' : 'Standard Text'}</span>
            </button>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-base shadow-sm active:scale-95 transition-all ${
                voiceEnabled ? 'bg-amber-100 border-amber-400 text-amber-950' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5 text-amber-700" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              <span>{voiceEnabled ? 'Voice Help: ON 🔊' : 'Voice Help: OFF 🔇'}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE VIEW: RESULT SCREEN */}
        {scanResult ? (
          <div className="space-y-4">
            {/* Quick Speech Repeat Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm">
              <span className="font-bold text-slate-800 text-base">
                {language === 'kn' ? 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ:' : language === 'hi' ? 'आवाज मार्गदर्शन:' : 'Voice Guidance:'}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleRepeatSpeech}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-base shadow active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>{language === 'kn' ? 'ಇನ್ನೊಮ್ಮೆ ಓದಿ' : language === 'hi' ? 'फिर से सुनें' : 'Read Again'}</span>
                </button>

                {isReadingAloud && (
                  <button
                    onClick={handleStopSpeech}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-base active:scale-95"
                  >
                    <VolumeX className="w-5 h-5" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            <ResultCard
              result={scanResult}
              onReset={() => {
                setScanResult(null);
                setInputText('');
                setActiveAction('menu');
                VoiceService.stopSpeaking();
              }}
              onAskCaretaker={onOpenCaretakerModal}
            />
          </div>
        ) : activeAction === 'menu' ? (
          /* 5 MASSIVE SENIOR TILES */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tile 1: Check a Link */}
            <button
              onClick={() => setActiveAction('link')}
              className="p-8 rounded-3xl bg-white hover:bg-blue-50/70 border-4 border-blue-600 text-left shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-start gap-6 group"
            >
              <div className="w-18 h-18 p-4 rounded-2xl bg-blue-600 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <Link2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-900">
                  {t('senior.btn_check_link')}
                </h3>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  Someone sent you a website link in WhatsApp or SMS? Let's check it safely.
                </p>
              </div>
            </button>

            {/* Tile 2: Tell Me About This Message */}
            <button
              onClick={() => setActiveAction('message')}
              className="p-8 rounded-3xl bg-white hover:bg-amber-50/70 border-4 border-amber-500 text-left shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-start gap-6 group"
            >
              <div className="w-18 h-18 p-4 rounded-2xl bg-amber-500 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <Mic className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-amber-950">
                  {t('senior.btn_check_message')}
                </h3>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  Speak or paste a suspicious call, electricity bill threat, or bank SMS.
                </p>
              </div>
            </button>

            {/* Tile 3: Ask My Caretaker */}
            <button
              onClick={onOpenCaretakerModal}
              className="p-8 rounded-3xl bg-white hover:bg-purple-50/70 border-4 border-purple-600 text-left shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-start gap-6 group"
            >
              <div className="w-18 h-18 p-4 rounded-2xl bg-purple-600 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-purple-900">
                  {t('senior.btn_ask_caretaker')}
                </h3>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  Connect with your trusted son, daughter, or family protector.
                </p>
              </div>
            </button>

            {/* Tile 4: Call Someone I Trust */}
            <button
              onClick={onOpenContacts}
              className="p-8 rounded-3xl bg-white hover:bg-emerald-50/70 border-4 border-emerald-600 text-left shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-start gap-6 group"
            >
              <div className="w-18 h-18 p-4 rounded-2xl bg-emerald-600 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-950">
                  {t('senior.btn_call_trusted')}
                </h3>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  Direct one-touch phone call to family members or Govt Helpline 1930.
                </p>
              </div>
            </button>

            {/* Tile 5: Learn Safety Tips */}
            <button
              onClick={loadSeniorTips}
              className="md:col-span-2 p-8 rounded-3xl bg-white hover:bg-teal-50/70 border-4 border-teal-600 text-left shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-start gap-6 group"
            >
              <div className="w-18 h-18 p-4 rounded-2xl bg-teal-600 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-950">
                  {t('senior.btn_safety_tips')}
                </h3>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  Simple rules on Digital Arrest calls, OTP theft, and fake electricity disconnection.
                </p>
              </div>
            </button>
          </div>
        ) : activeAction === 'link' || activeAction === 'message' ? (
          /* SCAN INPUT FORM FOR SENIORS */
          <div className="bg-white rounded-3xl p-6 md:p-10 border-4 border-blue-600 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                {activeAction === 'link' ? t('senior.btn_check_link') : t('senior.btn_check_message')}
              </h2>
              <button
                onClick={() => {
                  setActiveAction('menu');
                  setInputText('');
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg"
              >
                <ArrowLeft className="w-6 h-6" />
                <span>{t('scan.go_back')}</span>
              </button>
            </div>

            <p className="text-xl text-slate-700 font-medium">
              {activeAction === 'link'
                ? "Paste the website link below, or click 'Speak' to speak it aloud:"
                : "Speak or paste the suspicious message here:"}
            </p>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. http://sbi-kyc-update.xyz or 'Your electricity will be cut off tonight...'"
              className="w-full p-5 rounded-2xl border-4 border-slate-300 focus:border-blue-600 text-xl font-medium outline-none resize-none leading-relaxed text-slate-900"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <VoiceAssistant
                large={true}
                onTranscript={(text) => {
                  setInputText(text);
                  handleScan(text);
                }}
              />

              <button
                onClick={() => handleScan()}
                disabled={scanning || !inputText.trim()}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {scanning ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <CheckCircle className="w-8 h-8" />
                    <span>{t('scan.check_button')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Helpful senior presets */}
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl mt-4">
              <div className="font-bold text-slate-800 text-base mb-3">Try a common scam example to test:</div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const txt = "Dear customer, your electricity power will be disconnected at 9:30 PM tonight due to unpaid bill. Call 9876543210 immediately.";
                    setInputText(txt);
                    handleScan(txt);
                  }}
                  className="px-5 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-base border-2 border-amber-300 shadow-sm"
                >
                  ⚡ Fake Electricity Disconnection
                </button>
                <button
                  onClick={() => {
                    const txt = "This is CBI officer calling. Illegal narcotics parcel detected in your name. You are under digital arrest.";
                    setInputText(txt);
                    handleScan(txt);
                  }}
                  className="px-5 py-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 font-bold text-base border-2 border-rose-300 shadow-sm"
                >
                  👮 Fake Police Digital Arrest
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SAFETY TIPS SECTION FOR SENIORS */
          <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-teal-600 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                {t('senior.btn_safety_tips')}
              </h2>
              <button
                onClick={() => setActiveAction('menu')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg"
              >
                <ArrowLeft className="w-6 h-6" />
                <span>{t('scan.go_back')}</span>
              </button>
            </div>

            <div className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.id} className="p-6 rounded-2xl bg-teal-50/70 border-2 border-teal-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-teal-950">{tip.title}</h3>
                    <button
                      onClick={() => VoiceService.speak(`${tip.title}. ${tip.content}`, language)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 shadow"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-lg text-slate-800 font-medium leading-relaxed">
                    {tip.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
