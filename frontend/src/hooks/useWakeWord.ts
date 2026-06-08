import { useEffect, useState } from 'react';
import { useJarvisStore } from './useJarvisStore';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useWakeWord() {
  const store = useJarvisStore();
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningForWakeWord(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        
        // Wake word detection
        if (transcript.includes("hey jarvis") || transcript.includes("jarvis")) {
          console.log("Wake word detected!");
          
          // Prevent multiple triggers
          const currentState = useJarvisStore.getState();
          if (currentState.coreStatus === 'LISTENING' || currentState.coreStatus === 'SPEAKING' || currentState.coreStatus === 'THINKING') return;

          currentState.setCoreStatus('LISTENING');
          recognition.stop();
          
          // Play confirmation prompt before recording
          if ('speechSynthesis' in window && currentState.isVoiceActive) {
            const utterance = new SpeechSynthesisUtterance("Yes, sir?");
            // Pick a good default voice if possible
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google UK English Male") || v.name.includes("Daniel")) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            
            utterance.onend = () => {
              startFullAudioRecording();
            };
            window.speechSynthesis.speak(utterance);
          } else {
            // Fallback if TTS not available or muted
            startFullAudioRecording();
          }
        }
      }
    };

    recognition.onend = () => {
      setIsListeningForWakeWord(false);
      // Automatically restart if not actively engaged in a conversation
      const currentStatus = useJarvisStore.getState().coreStatus;
      if (currentStatus === 'STANDBY') {
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }
    };

    // Auto-start listening on mount
    try {
      recognition.start();
    } catch (e) {}

    return () => {
      recognition.stop();
    };
  }, []);

  const startFullAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const { wsService } = await import('@/services/websocket');
        wsService.sendVoiceChunk(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      
      // Auto stop after 5 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
      
    } catch (err) {
      console.error("Microphone access denied", err);
      useJarvisStore.getState().setCoreStatus('STANDBY');
    }
  };

  return { isListeningForWakeWord };
}
