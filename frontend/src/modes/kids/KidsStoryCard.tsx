import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

export interface KidStory {
  id: string;
  title: string;
  scenario: string;
  question: string;
  icon: string;
  options: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export const KidsStoryCard: React.FC<{
  story: KidStory;
  onSuccess: () => void;
}> = ({ story, onSuccess }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    setAnswered(true);
    if (story.options[idx].isCorrect) {
      onSuccess();
    }
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setAnswered(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-amber-200 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-bl-2xl font-bold text-xs flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>Chapter Story</span>
      </div>

      <div className="text-4xl mb-3">{story.icon}</div>
      <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
        {story.title}
      </h3>
      <p className="text-slate-600 text-base leading-relaxed mb-4">
        {story.scenario}
      </p>

      <div className="bg-amber-50/80 p-4 rounded-2xl border-2 border-amber-200 mb-6">
        <h4 className="font-black text-amber-950 text-base">
          🤔 {story.question}
        </h4>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {story.options.map((opt, idx) => {
          let btnStyle = "bg-slate-50 hover:bg-slate-100 text-slate-800 border-2 border-slate-200";
          if (answered) {
            if (opt.isCorrect) {
              btnStyle = "bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-bold";
            } else if (selectedIdx === idx) {
              btnStyle = "bg-rose-50 text-rose-950 border-2 border-rose-400";
            } else {
              btnStyle = "opacity-50 border-slate-200";
            }
          }

          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between text-base font-semibold ${btnStyle}`}
            >
              <span>{opt.text}</span>
              {answered && opt.isCorrect && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              )}
              {answered && selectedIdx === idx && !opt.isCorrect && (
                <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Card */}
      {answered && selectedIdx !== null && (
        <div className={`mt-5 p-5 rounded-2xl border-2 ${
          story.options[selectedIdx].isCorrect
            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
            : 'bg-rose-100/70 border-rose-300 text-rose-950'
        }`}>
          <div className="font-black text-lg mb-1">
            {story.options[selectedIdx].isCorrect ? '🎉 Super Smart Choice!' : '💡 Let’s Think Again:'}
          </div>
          <p className="text-base font-medium">
            {story.options[selectedIdx].feedback}
          </p>
          {!story.options[selectedIdx].isCorrect && (
            <button
              onClick={handleReset}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-800 underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try this question again</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
