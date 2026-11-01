export class VoiceService {
  private static recognition: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static voicesLoaded: boolean = false;

  public static initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.cachedVoices = window.speechSynthesis.getVoices();
    if (this.cachedVoices.length > 0) {
      this.voicesLoaded = true;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      this.cachedVoices = window.speechSynthesis.getVoices();
      this.voicesLoaded = true;
    };
  }

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  public static async startListening(
    lang: string,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Voice input is not supported in this browser. Please type your message instead.');
      return;
    }

    // On mobile devices, prompt for microphone permission via getUserMedia first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release audio track immediately so SpeechRecognition has full audio control
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          onError('Microphone permission denied. Please allow microphone access in your phone browser settings.');
          onEnd();
          return;
        }
      }
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      this.recognition = rec;

      // Map language code to standard speech BCP-47 tags
      let speechLang = 'en-IN';
      if (lang === 'kn') speechLang = 'kn-IN';
      else if (lang === 'hi') speechLang = 'hi-IN';

      rec.lang = speechLang;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
        }
      };

      rec.onerror = (event: any) => {
        let errorMsg = "Could not recognize speech. Please try speaking again or type.";
        if (event.error === 'not-allowed') {
          errorMsg = "Microphone access denied. Please allow microphone permissions.";
        } else if (event.error === 'no-speech') {
          errorMsg = "No speech detected. Please tap the mic and speak clearly.";
        } else if (event.error === 'network') {
          errorMsg = "Speech recognition network error. Please try again or type.";
        }
        onError(errorMsg);
      };

      rec.onend = () => {
        this.recognition = null;
        onEnd();
      };

      rec.start();
    } catch (e: any) {
      onError("Could not start microphone. Please try typing instead.");
      onEnd();
    }
  }

  public static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
  }

  public static speak(text: string, lang: string = 'en', onComplete?: () => void) {
    if (!this.synth) return;

    // Mobile fix: if synthesizer is paused, resume it
    if (this.synth.paused) {
      this.synth.resume();
    }

    // Cancel any previous utterance
    this.synth.cancel();

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      this.initVoices();
    }

    // Clean text to avoid speech cutoff
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    let speechLang = 'en-IN';
    if (lang === 'kn') speechLang = 'kn-IN';
    else if (lang === 'hi') speechLang = 'hi-IN';

    utterance.lang = speechLang;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Mobile voice matching
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.synth.getVoices();
    if (voices && voices.length > 0) {
      let matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
      if (!matchedVoice && lang === 'kn') {
        matchedVoice = voices.find(v => v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().startsWith('hi'));
      }
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en') || v.default);
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error or canceled", e);
      if (onComplete) onComplete();
    };

    // Tiny timeout ensures cancel() is fully processed before speak() on mobile iOS Safari
    setTimeout(() => {
      if (this.synth) {
        this.synth.speak(utterance);
      }
    }, 50);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

// Initialize voices immediately on client
if (typeof window !== 'undefined') {
  VoiceService.initVoices();
}
