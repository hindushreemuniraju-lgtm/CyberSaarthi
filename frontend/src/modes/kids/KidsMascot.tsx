import React from 'react';

interface KidsMascotProps {
  mood?: 'happy' | 'thinking' | 'alert' | 'celebrating';
  message: string;
  subMessage?: string;
}

export const KidsMascot: React.FC<KidsMascotProps> = ({
  mood = 'happy',
  message,
  subMessage
}) => {
  const moodEmoji = {
    happy: '🤖',
    thinking: '🤔',
    alert: '🛡️',
    celebrating: '🎉'
  }[mood];

  const moodGlow = {
    happy: 'from-amber-400 to-yellow-300 ring-amber-300',
    thinking: 'from-sky-400 to-blue-300 ring-sky-300',
    alert: 'from-rose-400 to-amber-300 ring-rose-300',
    celebrating: 'from-purple-400 to-pink-300 ring-purple-300'
  }[mood];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 bg-white/95 rounded-3xl border-4 border-amber-300 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Animated Floating Mascot Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${moodGlow} ring-4 flex items-center justify-center text-6xl shadow-lg animate-float transition-all duration-300`}>
          {moodEmoji}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
          Saarthi
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wide">
          <span>Chotu Saarthi Speaks</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
          “{message}”
        </h2>
        {subMessage && (
          <p className="text-sm sm:text-base font-semibold text-slate-600">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};
