import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Award, ArrowRight } from 'lucide-react';

interface GameQuestion {
  id: number;
  scenario: string;
  sender: string;
  icon: string;
  isScam: boolean;
  explanation: string;
}

const QUESTIONS: GameQuestion[] = [
  {
    id: 1,
    scenario: "🎉 You won 5,000 Free Diamonds! Just tell us your game password to claim!",
    sender: "Online Game Chat Stranger",
    icon: "💎",
    isScam: true,
    explanation: "Real games never ask for your password to give rewards. This stranger wants to steal your account!"
  },
  {
    id: 2,
    scenario: "Here is your science project worksheet for tomorrow's class. Please print it out.",
    sender: "Your School Teacher Mrs. Sharma",
    icon: "📚",
    isScam: false,
    explanation: "Homework from your verified teacher's email is normal and safe to open."
  },
  {
    id: 3,
    scenario: "Quick! Send me the 6-digit number that just came on your mom's phone or your account closes!",
    sender: "Unknown Number Caller",
    icon: "🔑",
    isScam: true,
    explanation: "That 6-digit number is an OTP! Never share OTPs with anyone on phone calls or chats."
  },
  {
    id: 4,
    scenario: "Download this special app file to watch movies without any subscription!",
    sender: "Random Website Pop-up",
    icon: "👾",
    isScam: true,
    explanation: "Downloading random files from pop-ups can install dangerous computer viruses or spyware."
  },
  {
    id: 5,
    scenario: "Uncle Rajesh sent a video message: 'Happy Birthday! Hope you have a wonderful day!'",
    sender: "Your Uncle on Family WhatsApp",
    icon: "🎂",
    isScam: false,
    explanation: "Birthday wishes from your real family members are wonderful and safe!"
  }
];

export const KidsMiniGame: React.FC<{
  onScoreIncrease: (pts: number) => void;
}> = ({ onScoreIncrease }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  const currentQ = QUESTIONS[currentIdx];
  const isCorrect = userChoice === currentQ.isScam;

  const handleAnswer = (choiceIsScam: boolean) => {
    if (answered) return;
    setUserChoice(choiceIsScam);
    setAnswered(true);

    if (choiceIsScam === currentQ.isScam) {
      setStreak(prev => prev + 1);
      onScoreIncrease(1);
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    setAnswered(false);
    setUserChoice(null);
    setCurrentIdx((prev) => (prev + 1) % QUESTIONS.length);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-sky-300 shadow-xl space-y-6">
      {/* Game Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sky-100">
        <div>
          <span className="text-xs font-black text-sky-700 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full">
            Mini-Game Quest
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
            Spot the Scam! 🕵️
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border-2 border-amber-200">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="font-black text-amber-950 text-sm">
            Streak: {streak} 🔥
          </span>
        </div>
      </div>

      {/* Quest Card */}
      <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 p-6 rounded-3xl border-2 border-sky-200 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Question {currentIdx + 1} of {QUESTIONS.length}</span>
          <span>From: <strong className="text-slate-800">{currentQ.sender}</strong></span>
        </div>

        <div className="flex items-start gap-4">
          <div className="text-4xl p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            {currentQ.icon}
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
            "{currentQ.scenario}"
          </p>
        </div>
      </div>

      {/* Choice Buttons */}
      {!answered ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(false)}
            className="p-5 rounded-2xl font-black text-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-3 border-emerald-400 shadow-md active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🟢</span>
            <span>Safe & Normal</span>
          </button>

          <button
            onClick={() => handleAnswer(true)}
            className="p-5 rounded-2xl font-black text-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border-3 border-rose-400 shadow-md active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🛑</span>
            <span>Sneaky Scam!</span>
          </button>
        </div>
      ) : (
        /* Answer Feedback */
        <div className={`p-6 rounded-3xl border-3 space-y-3 ${
          isCorrect
            ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
            : 'bg-rose-50 border-rose-400 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xl">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  <span>Brilliant! You spotted it right! 🎉</span>
                </>
              ) : (
                <>
                  <XCircle className="w-7 h-7 text-rose-600" />
                  <span>Not quite! Let's learn why:</span>
                </>
              )}
            </div>
          </div>

          <p className="text-base font-semibold leading-relaxed">
            {currentQ.explanation}
          </p>

          <button
            onClick={nextQuestion}
            className="w-full sm:w-auto mt-2 px-6 py-3 rounded-2xl font-black text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
