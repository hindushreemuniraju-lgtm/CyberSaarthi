export class VoiceService {
  private static recognition: any = null;
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  public static startListening(
    lang: string,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      this.recognition = rec;

      // Map language code to standard BCP-47 speech tags
      let speechLang = 'en-IN';
      if (lang === 'kn') speechLang = 'kn-IN';
      else if (lang === 'hi') speechLang = 'hi-IN';

      rec.lang = speechLang;
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
        }
      };

      rec.onerror = (event: any) => {
        let errorMsg = "Sorry, I couldn't understand that. Please try again or type it.";
        if (event.error === 'not-allowed') {
          errorMsg = "Microphone access was denied. Please allow microphone permissions.";
        }
        onError(errorMsg);
      };

      rec.onend = () => {
        this.recognition = null;
        onEnd();
      };

      rec.start();
    } catch (e: any) {
      onError("Could not initialize voice recognition. Please try typing instead.");
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

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate language voice
    let speechLang = 'en-IN';
    if (lang === 'kn') speechLang = 'kn-IN';
    else if (lang === 'hi') speechLang = 'hi-IN';
    
    utterance.lang = speechLang;
    utterance.rate = 0.95; // Slightly slower for clarity, especially for seniors

    // Try finding matching voice
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      if (onComplete) onComplete();
    };

    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
