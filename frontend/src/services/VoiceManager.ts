export class VoiceManager {
  private queue: string[] = [];
  private isSpeaking: boolean = false;

  public speak(text: string) {
    this.queue.push(text);
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const text = this.queue.shift()!;
    const cleanText = text.replace(/[*_~`#]/g, ''); // Strip markdown

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    // Ensure voices are loaded (browsers sometimes load them asynchronously)
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // If voices aren't loaded yet, try to speak anyway, the browser will use default
    } else {
      const voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft Mark') || v.name.includes('Daniel') || v.name.includes('English'));
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      this.processQueue();
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error", e);
      this.processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel() {
    this.queue = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }
}

export const voiceManager = new VoiceManager();
