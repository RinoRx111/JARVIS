import { useJarvisStore } from '../hooks/useJarvisStore';
import { voiceManager } from './VoiceManager';
import { toolManager } from './ToolManager';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  init() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    
    if (this.socket) {
      this.close();
    }
    
    let apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase && typeof window !== 'undefined') {
      apiBase = `http://${window.location.hostname}:8000`;
    } else if (!apiBase) {
      apiBase = 'http://localhost:8000';
    }
    const wsProtocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiBase.replace(/^https?:\/\//, '');
    const token = useJarvisStore.getState().token;
    if (!token) return; // Don't connect if not authenticated
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/chat/ws`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      if (this.socket) {
        this.socket.send(JSON.stringify({ token }));
      }
      this.reconnectAttempts = 0;
      useJarvisStore.setState({ wsConnected: true });
      useJarvisStore.getState().addNotification("Voice stream uplink connected via WebSocket.");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useJarvisStore.getState();
        
        if (data.type === 'transcription') {
          store.addMessage({ id: crypto.randomUUID(), role: 'user', content: data.text, created_at: new Date().toISOString() } as any);
          store.addMessage({ id: crypto.randomUUID(), role: 'assistant', content: '', created_at: new Date().toISOString() } as any);
          store.addNotification(`Transcription synced: "${data.text}"`);
          store.setCoreStatus('THINKING');
        } else if (data.type === 'token') {
          store.updateLastMessage(data.token);
          store.setCoreStatus('SPEAKING');
        } else if (data.type === 'token_usage') {
          const current = store.tokenUsage;
          const usage = data.usage;
          store.setTokenUsage({
            prompt: current.prompt + (usage.prompt_tokens || 0),
            completion: current.completion + (usage.completion_tokens || 0),
            total: current.total + (usage.total_tokens || 0)
          });
        } else if (data.type === 'status') {
          store.addNotification(data.message);
          
          // Delegate to ToolManager instead of inline parsing
          if (data.action === 'tool_start' && data.tool_name) {
            toolManager.handleToolStart(data.tool_name);
          } else if (data.action === 'tool_end') {
            toolManager.handleToolEnd();
          }
        } else if (data.type === 'plan') {
          store.setPlan(data.plan);
        } else if (data.type === 'tool_approval_request') {
          store.setPendingToolApproval({
            tool_call_id: data.tool_call_id,
            tool_name: data.tool_name,
            code: data.code
          });
          store.setCoreStatus('STANDBY');
        } else if (data.type === 'proactive_alert') {
          store.addAlert({
            title: data.title,
            message: data.message,
            voice_url: data.voice_url,
            timestamp: new Date().toISOString()
          });
          if (data.voice_url) {
            store.setVoicePlaybackUrl(data.voice_url);
          }
        } else if (data.type === 'agent_response') {
          // Final response
          const isLocalVoiceActive = !data.voice_url && store.isVoiceActive;
          store.setCoreStatus((data.voice_url || isLocalVoiceActive) ? 'SPEAKING' : 'STANDBY');
          store.setVoicePlaybackUrl(data.voice_url || null);
          if (data.conversation_id) {
            useJarvisStore.setState({ activeConversationId: data.conversation_id });
          }
          store.fetchConversations();
          
          if (!data.voice_url && store.isVoiceActive) {
            voiceManager.speak(data.text);
          }
        } else if (data.error) {
          store.addNotification(`Uplink warning: ${data.error}`);
          const errorMessage = { id: crypto.randomUUID(), role: 'system', content: `[ERROR] ${data.error}`, created_at: new Date().toISOString() };
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
    this.reconnectAttempts = 0;
  }

  async sendVoiceChunk(audioBlob: Blob) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      useJarvisStore.setState({ coreStatus: 'LISTENING' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      this.socket.send(arrayBuffer);
    } else {
      useJarvisStore.getState().addNotification("Uplink inactive. Cannot stream audio.");
      const errorMessage = { id: crypto.randomUUID(), role: 'system', content: '[ERROR] WebSocket connection is offline. Cannot stream audio.', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(errorMessage as any);
    }
  }

  sendTextMessage(text: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      useJarvisStore.setState({ coreStatus: 'THINKING' });
      const userMessage = { id: crypto.randomUUID(), role: 'user', content: text, created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(userMessage as any);
      const placeholderAssistant = { id: crypto.randomUUID(), role: 'assistant', content: '', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(placeholderAssistant as any);
      this.socket.send(JSON.stringify({ 
        text, 
        conversation_id: useJarvisStore.getState().activeConversationId 
      }));
    } else {
      useJarvisStore.getState().addNotification("Uplink inactive. Cannot stream text.");
      const errorMessage = { id: crypto.randomUUID(), role: 'system', content: '[ERROR] WebSocket connection is offline. Cannot stream text.', created_at: new Date().toISOString() };
      useJarvisStore.getState().addMessage(errorMessage as any);
    }
  }

  sendToolApprovalResponse(tool_call_id: string, approved: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'tool_approval_response',
        tool_call_id,
        approved
      }));
      useJarvisStore.getState().setPendingToolApproval(null);
      useJarvisStore.getState().setCoreStatus('THINKING');
    }
  }
}

export const wsService = new WebSocketService();
