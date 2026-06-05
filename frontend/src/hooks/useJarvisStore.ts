import { create } from 'zustand';
import api from '../services/api';

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  voice_url?: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  google_refresh_token?: string;
}

export interface AgentTask {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  errors?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  agent_name?: string;
  action: string;
  parameters?: string;
  status: string;
  response?: string;
  created_at: string;
}

export interface UserMemory {
  id: string;
  content: string;
  created_at: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

export interface ScheduleSuggestion {
  title: string;
  time_range: string;
  reason: string;
}

interface JarvisState {
  // Auth
  token: string | null;
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;

  // Navigation
  activeTab: 'dashboard' | 'chat' | 'agents' | 'browser' | 'gmail' | 'calendar' | 'memory' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'agents' | 'browser' | 'gmail' | 'calendar' | 'memory' | 'settings') => void;

  // System Stats
  cpuUsage: number;
  ramUsage: number;
  coreStatus: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING';
  setCoreStatus: (status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING') => void;
  notifications: string[];
  addNotification: (msg: string) => void;
  updateSystemStats: () => void;

  // Chat/Voice State
  messages: Message[];
  activeConversationId: number | null;
  isVoiceActive: boolean;
  setVoiceActive: (active: boolean) => void;
  voicePlaybackUrl: string | null;
  setVoicePlaybackUrl: (url: string | null) => void;
  wsConnected: boolean;
  wsLog: string[];
  fetchChatHistory: (conversationId?: number) => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  sendVoiceChunk: (audioBlob: Blob) => Promise<void>;
  initWebSocket: () => void;
  closeWebSocket: () => void;

  // File Management
  files: any[];
  fetchFiles: () => Promise<void>;
  uploadFile: (file: File) => Promise<boolean>;

  // Agent Workspace
  agentTasks: AgentTask[];
  auditLogs: AuditLog[];
  fetchAgentTasks: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  createAgentTask: (title: string, description?: string) => Promise<void>;

  // Browser Workspace
  browserUrl: string;
  browserStatus: 'idle' | 'running' | 'completed' | 'failed';
  browserScreenshotUrl: string | null;
  browserTitle: string | null;
  browserText: string | null;
  browserActionsLog: string[];
  runBrowserAutomation: (url: string, actions?: any[]) => Promise<void>;

  // Memory Center
  memories: UserMemory[];
  fetchMemories: (query?: string) => Promise<void>;
  addMemory: (content: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  // Gmail Center
  emails: Email[];
  fetchEmails: () => Promise<void>;
  sendEmail: (to: string, subject: string, body: string) => Promise<boolean>;
  generateSmartReply: (emailId: string, snippet: string) => Promise<string>;

  // Calendar Center
  events: CalendarEvent[];
  scheduleSuggestions: ScheduleSuggestion[];
  fetchEvents: () => Promise<void>;
  createEvent: (summary: string, start: string, end: string, description?: string) => Promise<boolean>;
  fetchSuggestions: () => Promise<void>;

  // Settings
  llmModel: string;
  setLlmModel: (model: string) => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
}

let socket: WebSocket | null = null;

export const useJarvisStore = create<JarvisState>((set, get) => ({
  // Auth initial state
  token: typeof window !== 'undefined' ? localStorage.getItem('jarvis_token') : null,
  user: null,
  authLoading: true,

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token } = res.data;
      localStorage.setItem('jarvis_token', access_token);
      set({ token: access_token });
      const userRes = await api.get('/auth/me');
      set({ user: userRes.data, token: access_token });
      get().addNotification("Core link authorized. Profile loaded.");
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  register: async (email, password) => {
    try {
      await api.post('/auth/register', { email, password });
      get().addNotification("User registered successfully. Initializing access tokens...");
      return await get().login(email, password);
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('jarvis_token');
    set({ token: null, user: null, messages: [], activeConversationId: null });
    get().addNotification("System link closed. Logged out.");
  },

  checkAuth: async () => {
    set({ authLoading: true });
    const localToken = localStorage.getItem('jarvis_token');
    if (!localToken) {
      set({ authLoading: false });
      return false;
    }
    try {
      set({ token: localToken });
      const res = await api.get('/auth/me');
      set({ user: res.data, authLoading: false });
      get().addNotification("Secure session restored.");
      return true;
    } catch (err) {
      localStorage.removeItem('jarvis_token');
      set({ token: null, user: null, authLoading: false });
      return false;
    }
  },

  // Navigation state
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // System status
  cpuUsage: 12,
  ramUsage: 42,
  coreStatus: 'STANDBY',
  setCoreStatus: (status) => set({ coreStatus: status }),
  notifications: ['System initialized. Secure grid ready.', 'Welcome back, Operator.'],
  addNotification: (msg) => {
    const list = [...get().notifications, `[${new Date().toLocaleTimeString()}] ${msg}`];
    set({ notifications: list.slice(-15) }); // Keep last 15 logs
  },
  updateSystemStats: () => {
    // Holographic stat fluctuation
    set({
      cpuUsage: Math.floor(Math.random() * 35) + 10,
      ramUsage: Math.floor(Math.random() * 15) + 40,
    });
  },

  // Chat details
  messages: [],
  activeConversationId: null,
  isVoiceActive: true,
  setVoiceActive: (active) => set({ isVoiceActive: active }),
  voicePlaybackUrl: null,
  setVoicePlaybackUrl: (url) => set({ voicePlaybackUrl: url }),
  wsConnected: false,
  wsLog: [],

  fetchChatHistory: async (conversationId) => {
    // Mocks / Loading is handled simply.
    // In our backend, there is no explicit listing route for messages except loading one conversation
    // or through LangGraph updates. Let's create fallback chat context if empty.
  },

  sendChatMessage: async (content) => {
    set({ coreStatus: 'THINKING' });
    try {
      const response = await api.post('/chat', {
        content,
        conversation_id: get().activeConversationId || undefined,
        voice_output: get().isVoiceActive
      });

      const { response: replyText, voice_url, conversation_id } = response.data;
      
      const newMessages = [
        ...get().messages,
        { id: Date.now() - 1, role: 'user', content, created_at: new Date().toISOString() } as Message,
        { id: Date.now(), role: 'assistant', content: replyText, voice_url, created_at: new Date().toISOString() } as Message
      ];

      set({
        messages: newMessages,
        activeConversationId: conversation_id,
        coreStatus: voice_url ? 'SPEAKING' : 'STANDBY',
        voicePlaybackUrl: voice_url || null
      });

      if (voice_url) {
        get().addNotification("Voice synthesizer output generated.");
      }
    } catch (err) {
      console.error(err);
      set({ coreStatus: 'STANDBY' });
    }
  },

  initWebSocket: () => {
    if (socket) return;
    const token = localStorage.getItem('jarvis_token');
    if (!token) return;
    
    // Connect WebSocket
    const wsUrl = `ws://localhost:8000/api/v1/chat/ws?token=${token}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({ wsConnected: true });
      get().addNotification("Voice stream uplink connected via WebSocket.");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          // Add transcribed user input
          set((state) => ({
            messages: [...state.messages, { id: Date.now() - 1, role: 'user', content: data.text, created_at: new Date().toISOString() }]
          }));
          get().addNotification(`Transcription synced: "${data.text}"`);
          set({ coreStatus: 'THINKING' });
        } else if (data.type === 'agent_response') {
          set((state) => ({
            messages: [...state.messages, { id: Date.now(), role: 'assistant', content: data.text, voice_url: data.voice_url, created_at: new Date().toISOString() }],
            coreStatus: data.voice_url ? 'SPEAKING' : 'STANDBY',
            voicePlaybackUrl: data.voice_url || null
          }));
        } else if (data.error) {
          get().addNotification(`Uplink warning: ${data.error}`);
          set({ coreStatus: 'STANDBY' });
        }
      } catch (e) {
        console.error("WebSocket message parsing error:", e);
      }
    };

    socket.onclose = () => {
      set({ wsConnected: false });
      socket = null;
      get().addNotification("Voice stream uplink offline.");
    };

    socket.onerror = (err) => {
      console.error("WS connection error:", err);
      set({ wsConnected: false });
    };
  },

  closeWebSocket: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  },

  sendVoiceChunk: async (audioBlob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      set({ coreStatus: 'LISTENING' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      socket.send(arrayBuffer);
    } else {
      get().addNotification("Uplink inactive. Cannot stream audio.");
    }
  },

  // File Center
  files: [],
  fetchFiles: async () => {
    try {
      const res = await api.get('/files/list');
      set({ files: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      get().addNotification(`File upload authorized: ${file.name}. Processing in background...`);
      get().fetchFiles();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // Agent workspace
  agentTasks: [],
  auditLogs: [],
  fetchAgentTasks: async () => {
    try {
      const res = await api.get('/agents/tasks');
      set({ agentTasks: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchAuditLogs: async () => {
    try {
      const res = await api.get('/agents/logs');
      set({ auditLogs: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  createAgentTask: async (title, description) => {
    try {
      await api.post('/agents/tasks', { title, description });
      get().addNotification(`Scheduled agent workspace task: ${title}`);
      get().fetchAgentTasks();
    } catch (err) {
      console.error(err);
    }
  },

  // Browser automation
  browserUrl: '',
  browserStatus: 'idle',
  browserScreenshotUrl: null,
  browserTitle: null,
  browserText: null,
  browserActionsLog: [],

  runBrowserAutomation: async (url, actions) => {
    set({ browserUrl: url, browserStatus: 'running', browserScreenshotUrl: null });
    get().addNotification(`Launching virtual browser grid for: ${url}`);
    try {
      const res = await api.post('/browser/browse', { url, actions });
      set({
        browserStatus: 'completed',
        browserScreenshotUrl: res.data.screenshot_url,
        browserTitle: res.data.title,
        browserText: res.data.extracted_text,
        browserActionsLog: res.data.actions_log || []
      });
      get().addNotification(`Browser automation completed. Target title: "${res.data.title}"`);
    } catch (err: any) {
      console.error(err);
      set({ browserStatus: 'failed' });
      get().addNotification(`Browser automation aborted: ${err.response?.data?.detail || err.message}`);
    }
  },

  // Memory utilities
  memories: [],
  fetchMemories: async (query) => {
    try {
      const endpoint = query ? `/memory/search?query=${encodeURIComponent(query)}` : '/memory/search?query=';
      const res = await api.get(endpoint);
      set({ memories: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  addMemory: async (content) => {
    try {
      await api.post('/memory/add', { content });
      get().addNotification(`Fact cached: "${content}"`);
      get().fetchMemories();
    } catch (err) {
      console.error(err);
    }
  },

  deleteMemory: async (id) => {
    try {
      await api.delete(`/memory/delete/${id}`);
      get().addNotification(`Memory token deleted.`);
      get().fetchMemories();
    } catch (err) {
      console.error(err);
    }
  },

  // Gmail API requests
  emails: [],
  fetchEmails: async () => {
    try {
      const res = await api.get('/gmail/inbox');
      set({ emails: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  sendEmail: async (to, subject, body) => {
    try {
      await api.post('/gmail/send', { to, subject, body });
      get().addNotification(`Mail successfully queued for delivery to ${to}.`);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  generateSmartReply: async (emailId, snippet) => {
    try {
      const res = await api.post('/gmail/reply', { email_id: emailId, snippet });
      return res.data.suggested_reply;
    } catch (err) {
      console.error(err);
      return "Understood. I will follow up.";
    }
  },

  // Calendar API requests
  events: [],
  scheduleSuggestions: [],
  fetchEvents: async () => {
    try {
      const res = await api.get('/calendar/events');
      set({ events: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  createEvent: async (summary, start, end, description) => {
    try {
      await api.post('/calendar/events', { summary, start_time: start, end_time: end, description });
      get().addNotification(`Event synchronized: "${summary}"`);
      get().fetchEvents();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  fetchSuggestions: async () => {
    try {
      const res = await api.get('/calendar/suggestions');
      set({ scheduleSuggestions: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  // Settings config
  llmModel: 'gpt-4o',
  setLlmModel: (model) => set({ llmModel: model }),
  ttsVoice: '21m00Tcm4TlvDq8ikWAM',
  setTtsVoice: (voice) => set({ ttsVoice: voice }),
}));
