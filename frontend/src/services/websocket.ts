import { useJarvisStore } from '../hooks/useJarvisStore';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  init() {
    if (this.socket) return;
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsProtocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiBase.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/chat/ws?token=local_mode`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      useJarvisStore.setState({ wsConnected: true });
      useJarvisStore.getState().addNotification("Voice stream uplink connected via WebSocket.");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useJarvisStore.getState();
        
        if (data.type === 'transcription') {
          store.addMessage({ id: Date.now() - 1, role: 'user', content: data.text, created_at: new Date().toISOString() } as any);
          store.addMessage({ id: Date.now(), role: 'assistant', content: '', created_at: new Date().toISOString() } as any);
          store.addNotification(`Transcription synced: "${data.text}"`);
          store.setCoreStatus('THINKING');
        } else if (data.type === 'token') {
          store.updateLastMessage(data.token);
          store.setCoreStatus('SPEAKING');
        } else if (data.type === 'status') {
          store.addNotification(data.message);
        } else if (data.type === 'agent_response') {
          // Final response
          store.setCoreStatus(data.voice_url ? 'SPEAKING' : 'STANDBY');
          store.setVoicePlaybackUrl(data.voice_url || null);
          store.fetchConversations();
          
          if (!data.voice_url && store.isVoiceActive) {
            this.speakLocalTTS(data.text);
          }
        } else if (data.error) {
          store.addNotification(`Uplink warning: ${data.error}`);
          const errorMessage = { id: Date.now(), role: 'system', content: `[ERROR] ${data.error}`, created_at: new Date().toISOString() };
          store.addMessage(errorMessage as any);
          store.setCoreStatus('STANDBY');
        }
      } catch (e) {
        console.error("WebSocket message parsing error:", e);
      }
    };

    this.socket.onclose = () => {
      useJarvisStore.setState({ wsConnected: false });
      this.socket = null;
      useJarvisStore.getState().addNotification("Voice stream uplink offline.");
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const backoffTime = Math.pow(2, this.reconnectAttempts) * 1000;
        useJarvisStore.getState().addNotification(`Reconnecting uplink in ${backoffTime / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.init(), backoffTime);
      } else {
        useJarvisStore.getState().addNotification("Uplink reconnection failed. Max attempts reached.");
      }
    };

    this.socket.onerror = (err) => {
      console.error("WS connection error:", err);
      useJarvisStore.setState({ wsConnected: false });
    };
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async sendVoiceChunk(audioBlob: Blob) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      useJarvisStore.setState({ coreStatus: 'LISTENING' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      this.socket.send(arrayBuffer);
    } else {
      useJarvisStore.getState().addNotification("Uplink inactive. Cannot stream audio.");
      const errorMessage = { id: Date.now(), role: 'system', content: '[ERROR] WebSocket connection is offline. Cannot stream audio.', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(errorMessage as any);
    }
  }

  sendTextMessage(text: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      useJarvisStore.setState({ coreStatus: 'THINKING' });
      const userMessage = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(userMessage as any);
      const placeholderAssistant = { id: Date.now() + 1, role: 'assistant', content: '', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(placeholderAssistant as any);
      this.socket.send(JSON.stringify({ 
        text, 
        conversation_id: useJarvisStore.getState().activeConversationId 
      }));
    } else {
      useJarvisStore.getState().addNotification("Uplink inactive. Cannot stream text.");
      const errorMessage = { id: Date.now(), role: 'system', content: '[ERROR] WebSocket connection is offline. Cannot stream text.', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(errorMessage as any);
    }
  }

  speakLocalTTS(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const cleanText = text.replace(/[*_~`#]/g, ''); 
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft Mark') || v.name.includes('Daniel') || v.name.includes('English'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const wsService = new WebSocketService();
