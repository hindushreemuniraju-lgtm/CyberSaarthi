import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../../context/UserExperienceContext';
import { api } from '../../services/api';
import { ScanResult } from '../../types';
import { ResultCard } from '../../components/ResultCard';
import { KidsStoryCard, KidStory } from './KidsStoryCard';
import { VoiceAssistant } from '../../components/VoiceAssistant';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Search,
  Star,
  Users,
  Compass,
  Smile,
  Gift,
  Key
} from 'lucide-react';

const STORIES_DATA: KidStory[] = [
  {
    id: 'story-1',
    title: 'Riya Gets a Surprise Prize!',
    scenario: 'Riya was playing a game when a pop-up message arrived: "🎁 Congratulations! You won a FREE iPhone! Click here to claim!"',
    question: 'What should Riya do?',
    icon: '🎁',
    options: [
      {
        text: '🟢 Ask a trusted adult (Mom, Dad, or Teacher)',
        isCorrect: true,
        feedback: 'Great choice! 🎉 Real prizes are never given away randomly to strangers. Asking a trusted adult keeps you safe from scam websites.'
      },
      {
        text: '🔵 Click the link quickly to see the phone',
        isCorrect: false,
        feedback: 'Oops! Clicking strange links can download viruses onto your tablet or steal your family passwords.'
      },
      {
        text: '🟠 Enter your home address and mom\'s phone number',
        isCorrect: false,
        feedback: 'Never give your address or family phone numbers to unfamiliar websites!'
      }
    ]
  },
  {
    id: 'story-2',
    title: 'Aarav and the Free Game Coins',
    scenario: 'A player in an online game sends Aarav a private chat: "Hey! Want 10,000 Free Diamonds? Just tell me your login password!"',
    question: 'How should Aarav reply?',
    icon: '🎮',
    options: [
      {
        text: '🟢 Never share passwords! Say NO and tell parents',
        isCorrect: true,
        feedback: 'Awesome job! 🛡️ Passwords are super-secret keys to your accounts. Real game moderators will NEVER ask for your password.'
      },
      {
        text: '🔵 Share the password because 10,000 diamonds is a lot',
        isCorrect: false,
        feedback: 'Danger! If you give your password, the stranger will steal your entire account and all your game items.'
      }
    ]
  },
  {
    id: 'story-3',
    title: 'The Mystery OTP Code',
    scenario: 'A caller says they are from a courier delivery company and demands the 6-digit number sent to your dad\'s phone right now.',
    question: 'What is the safe reaction?',
    icon: '🔑',
    options: [
      {
        text: '🟢 Say "I cannot share any codes" and hand phone to dad',
        isCorrect: true,
        feedback: 'You are a Cyber Hero! ⭐ A 6-digit OTP code is like a digital lock to money. Never read it out to anyone.'
      },
      {
        text: '🔵 Read the 6 digits so the parcel arrives',
        isCorrect: false,
        feedback: 'Careful! Scammers pretend to be delivery men to steal bank OTPs.'
      }
    ]
  }
];

export const KidsHome: React.FC<{
  onOpenCaretakerModal: () => void;
  onOpenContacts: () => void;
}> = ({ onOpenCaretakerModal, onOpenContacts }) => {
  const { t } = useTranslation();
  const { language } = useUserExperience();

  const [inputContent, setInputContent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [stars, setStars] = useState(3);
  const [badges, setBadges] = useState(['Badge of Caution', 'Password Shield']);
  const [activeTab, setActiveTab] = useState<'scan' | 'stories' | 'badges'>('scan');

  const handleScan = async (contentToScan?: string) => {
    const text = contentToScan || inputContent;
    if (!text.trim()) return;

    setScanning(true);
    setScanResult(null);

    try {
      const res = await api.performScan(text, 'kid', language);
      setScanResult(res);
      if (res.risk_level === 'SAFE') {
        setStars(prev => prev + 1);
      }
    } catch (err) {
      alert("Something went wrong while checking the link. Please ask an adult.");
    } finally {
      setScanning(false);
    }
  };

  const handleStorySuccess = () => {
    setStars(prev => prev + 2);
    if (!badges.includes('Story Master')) {
      setBadges(prev => [...prev, 'Story Master']);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50 to-emerald-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Mascot Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-amber-300 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-6xl shadow-md animate-float flex-shrink-0">
            🤖
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('kids.mascot_name')} • Safety Companion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t('kids.mascot_welcome')}
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              Check strange links, earn stars, and solve safety adventures!
            </p>
          </div>

          {/* Kid Rewards Pill */}
          <div className="flex flex-row sm:flex-col gap-2 items-center bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-200">
            <div className="flex items-center gap-1 text-amber-900 font-black text-lg">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              <span>{stars} Stars</span>
            </div>
            <div className="text-[11px] font-bold text-amber-800">
              {badges.length} Badges Won
            </div>
          </div>
        </div>

        {/* Fun Mode Tabs */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'scan'
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Check a Link / Message</span>
          </button>

          <button
            onClick={() => setActiveTab('stories')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'stories'
                ? 'bg-amber-500 text-white shadow-md scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Safety Adventures</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'badges'
                ? 'bg-purple-600 text-white shadow-md scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>My Badges</span>
          </button>
        </div>

        {/* TAB 1: SCAN CHECKER */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {!scanResult ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-blue-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    <span>Did someone send you a weird link?</span>
                  </h2>
                  <button
                    onClick={onOpenCaretakerModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t('kids.ask_adult_button')}</span>
                  </button>
                </div>

                <p className="text-slate-600 text-sm font-medium">
                  Paste the message or link below. Chotu Saarthi will check if it's safe for you!
                </p>

                <textarea
                  rows={3}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="Paste link or text here... e.g. http://free-roblox-skins.xyz"
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-base font-medium resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <VoiceAssistant
                    onTranscript={(spoken) => {
                      setInputContent(spoken);
                      handleScan(spoken);
                    }}
                  />

                  <button
                    onClick={() => handleScan()}
                    disabled={scanning || !inputContent.trim()}
                    className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-black text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {scanning ? (
                      <span>Checking with Saarthi...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Check Safety Now</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Test Links for Kid exploration */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Try a test example:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const txt = "http://free-game-diamonds-claim.xyz/login";
                        setInputContent(txt);
                        handleScan(txt);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 hover:bg-rose-100"
                    >
                      🛑 Scam: Free Game Diamonds
                    </button>
                    <button
                      onClick={() => {
                        const txt = "https://www.khanacademy.org";
                        setInputContent(txt);
                        handleScan(txt);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-100"
                    >
                      🟢 Safe: Khan Academy
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

        {/* TAB 2: STORIES & ADVENTURES */}
        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">
                {t('kids.stories_title')}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Help Riya and Aarav make the right choices to protect their online accounts!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {STORIES_DATA.map((story) => (
                <KidsStoryCard
                  key={story.id}
                  story={story}
                  onSuccess={handleStorySuccess}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BADGES */}
        {activeTab === 'badges' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-purple-200 shadow-xl space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-2">🏆</div>
              <h2 className="text-2xl font-black text-slate-900">
                {t('kids.badges_title')}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Collect all 5 safety badges by completing stories and checking suspicious links!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Badge of Caution', icon: '🛡️', unlocked: badges.includes('Badge of Caution') },
                { name: 'Password Defender', icon: '🔑', unlocked: badges.includes('Password Shield') },
                { name: 'Story Master', icon: '📖', unlocked: badges.includes('Story Master') },
                { name: 'Cyber Hero', icon: '⭐', unlocked: stars >= 5 }
              ].map((b, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl text-center border-2 transition-all ${
                    b.unlocked
                      ? 'bg-purple-50 border-purple-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-40'
                  }`}
                >
                  <div className="text-4xl mb-2">{b.icon}</div>
                  <h4 className="font-black text-slate-900 text-sm">{b.name}</h4>
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.unlocked ? 'bg-purple-200 text-purple-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {b.unlocked ? 'Unlocked!' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
