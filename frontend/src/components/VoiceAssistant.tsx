import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { VoiceService } from '../services/voiceService';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface VoiceAssistantProps {
  onTranscript: (text: string) => void;
  textToRead?: string;
  large?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onTranscript,
  textToRead,
  large = false
}) => {
  const { t } = useTranslation();
  const { language } = useUserExperience();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleListening = () => {
    if (listening) {
      VoiceService.stopListening();
      setListening(false);
    } else {
      setErrorMsg(null);
      setListening(true);
      VoiceService.startListening(
        language,
        (transcript) => {
          onTranscript(transcript);
          setListening(false);
        },
        (error) => {
          setErrorMsg(error);
          setListening(false);
        },
        () => {
          setListening(false);
        }
      );
    }
  };

  const toggleSpeaking = () => {
    if (speaking) {
      VoiceService.stopSpeaking();
      setSpeaking(false);
    } else if (textToRead) {
      setSpeaking(true);
      VoiceService.speak(textToRead, language, () => {
        setSpeaking(false);
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        {/* Speak / Mic button */}
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Stop microphone" : "Speak message"}
          className={`relative rounded-2xl flex items-center justify-center font-medium transition-all shadow-md active:scale-95 ${
            large ? 'px-6 py-4 text-lg min-h-[64px]' : 'px-4 py-2.5 text-sm'
          } ${
            listening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {listening ? (
            <>
              <MicOff className={large ? 'w-7 h-7 mr-3' : 'w-4 h-4 mr-2'} />
              <span>{t('voice.listening')}</span>
            </>
          ) : (
            <>
              <Mic className={large ? 'w-7 h-7 mr-3' : 'w-4 h-4 mr-2'} />
              <span>{t('scan.speak_button')}</span>
            </>
          )}
        </button>

        {/* Read aloud button if text is available */}
        {textToRead && (
          <button
            type="button"
            onClick={toggleSpeaking}
            aria-label={speaking ? "Stop reading" : "Read aloud"}
            className={`rounded-2xl flex items-center justify-center font-medium transition-all border border-slate-300 shadow-sm active:scale-95 ${
              large ? 'px-6 py-4 text-lg min-h-[64px] bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300' : 'px-3 py-2 text-sm bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            {speaking ? (
              <>
                <VolumeX className={large ? 'w-7 h-7 mr-3 text-amber-700' : 'w-4 h-4 mr-1.5 text-amber-600'} />
                <span>{t('scan.stop_reading')}</span>
              </>
            ) : (
              <>
                <Volume2 className={large ? 'w-7 h-7 mr-3 text-amber-700' : 'w-4 h-4 mr-1.5 text-amber-600'} />
                <span>{t('scan.read_aloud')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Friendly error feedback without crashing */}
      {errorMsg && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
