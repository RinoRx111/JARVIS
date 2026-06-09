import { create } from 'zustand';
import api from '../services/api';

import { ToolExecutionProps } from '../components/chat/ToolExecutionNode';

export interface Message {
  id: number | string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  voice_url?: string;
  created_at: string;
  toolCalls?: ToolExecutionProps[];
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  nickname?: string;
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
  needsSetup: boolean;
  checkSetupStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setToken: (token: string | null, refreshToken?: string | null) => void;

  // Navigation
  activeTab: 'dashboard' | 'chat' | 'agents' | 'browser' | 'gmail' | 'calendar' | 'memory' | 'settings' | 'profile' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'agents' | 'browser' | 'gmail' | 'calendar' | 'memory' | 'settings' | 'profile' | 'analytics') => void;

  // System Stats
  cpuUsage: number;
  ramUsage: number;
  coreStatus: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING';
  setCoreStatus: (status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING') => void;
  notifications: string[];
  addNotification: (msg: string) => void;
  updateSystemStats: () => void;

  // Chat/Voice State
  conversations: any[];
  fetchConversations: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
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
  startNewChat: () => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (chunk: string) => void;
  addToolCallToLastMessage: (toolName: string) => void;
  currentPlan: string[];
  setPlan: (plan: string[]) => void;
  alerts: any[];
  addAlert: (alert: any) => void;

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
  addMemory: (fact: string) => Promise<void>;
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

  // Settings & Preferences
  llmModel: string;
  setLlmModel: (model: string) => void;
  ttsVoice: string;
  setTtsVoice: (voice: string) => void;
  tokenUsage: { prompt: number; completion: number; total: number };
  setTokenUsage: (usage: { prompt: number; completion: number; total: number }) => void;
  userPreferences: any;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: any) => Promise<boolean>;
  
  // Local Models
  localModels: string[];
  fetchLocalModels: () => Promise<void>;
  
  // Agent Config
  agentConfig: any;
  fetchAgentConfig: () => Promise<void>;
  updateAgentConfig: (config: any) => Promise<boolean>;

  // Analytics
  analyticsData: any;
  fetchAnalytics: () => Promise<void>;
}

const speakLocalTTS = (text: string, setCoreStatus?: (status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING') => void) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any currently playing audio
    if (setCoreStatus) setCoreStatus('SPEAKING');
    
    // 1. Remove URLs
    let cleanText = text.replace(/https?:\/\/[^\s]+/g, '');
    // 2. Remove JSON or code blocks (things between ```)
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ' [Code Block Omitted] ');
    // 3. Remove general markdown characters
    cleanText = cleanText.replace(/[*_~`#\[\]()>-]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText.trim() || "No readable text available.");
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft Mark') || v.name.includes('Daniel') || v.name.includes('English'));
    if (voice) utterance.voice = voice;
    
    utterance.onend = () => {
      if (setCoreStatus) setCoreStatus('STANDBY');
    };
    utterance.onerror = () => {
      if (setCoreStatus) setCoreStatus('STANDBY');
    };
    
    window.speechSynthesis.speak(utterance);
  }
};

let socket: WebSocket | null = null;

export const useJarvisStore = create<JarvisState>((set, get) => ({
  // Auth initial state
  token: null,
  user: null,
  authLoading: true,
  needsSetup: false,

  checkSetupStatus: async () => {
    try {
      const res = await api.get('/auth/setup-status');
      set({ needsSetup: res.data.needs_setup });
    } catch (err) {
      console.error(err);
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.access_token;
      const refreshToken = res.data.refresh_token;
      localStorage.setItem('jarvis_token', token);
      if (refreshToken) {
        localStorage.setItem('jarvis_refresh_token', refreshToken);
      }
      set({ token });
      await get().checkAuth();
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  },

  register: async (email, password) => {
    try {
      await api.post('/auth/register', { email, password });
      await get().login(email, password);
      get().checkSetupStatus();
      return true;
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('jarvis_token');
    localStorage.removeItem('jarvis_refresh_token');
    set({ token: null, user: null, messages: [], activeConversationId: null });
  },

  setToken: (token, refreshToken) => {
    if (token) {
      localStorage.setItem('jarvis_token', token);
      set({ token });
    } else {
      localStorage.removeItem('jarvis_token');
      localStorage.removeItem('jarvis_refresh_token');
      set({ token: null });
    }
    if (refreshToken) {
      localStorage.setItem('jarvis_refresh_token', refreshToken);
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('jarvis_token');
    if (!token) {
      set({ token: null, user: null, authLoading: false });
      return false;
    }

    try {
      set({ token });
      const res = await api.get('/auth/me');
      set({ user: res.data, authLoading: false });
      return true;
    } catch (err) {
      console.error('Auth check failed', err);
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
  conversations: [],
  fetchConversations: async () => {
    try {
      const res = await api.get('/chat/conversations');
      set({ conversations: res.data });
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  },
  deleteConversation: async (id: number) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      get().fetchConversations();
      if (get().activeConversationId === id) {
        get().startNewChat();
      }
      get().addNotification("Conversation deleted.");
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  },
  messages: [],
  activeConversationId: null,
  isVoiceActive: true,
  setVoiceActive: (active) => {
    set({ isVoiceActive: active });
    if (!active) {
      // Immediately stop any playing audio
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      set({ voicePlaybackUrl: null, coreStatus: 'STANDBY' });
    }
  },
  voicePlaybackUrl: null,
  setVoicePlaybackUrl: (url) => set({ voicePlaybackUrl: url }),
  wsConnected: false,
  wsLog: [],
  currentPlan: [],
  alerts: [],

  fetchChatHistory: async (conversationId) => {
    try {
      const url = conversationId ? `/chat/history?conversation_id=${conversationId}` : '/chat/history';
      const res = await api.get(url);
      if (res.data && res.data.messages) {
        set({
          messages: res.data.messages,
          activeConversationId: res.data.conversation_id
        });
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  },

  startNewChat: () => {
    set({ messages: [], activeConversationId: null, coreStatus: 'STANDBY', currentPlan: [] });
  },

  addMessage: (msg: Message) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  updateLastMessage: (chunk: string) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        const lastIndex = messages.length - 1;
        const lastMsg = messages[lastIndex];
        let newToolCalls = lastMsg.toolCalls;
        if (newToolCalls && newToolCalls.some(t => t.status === 'running')) {
          newToolCalls = newToolCalls.map(t => t.status === 'running' ? { ...t, status: 'success' as const } : t);
        }
        messages[lastIndex] = { ...lastMsg, content: lastMsg.content + chunk, toolCalls: newToolCalls };
      }
      return { messages };
    });
  },

  addToolCallToLastMessage: (toolName: string) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        const lastIndex = messages.length - 1;
        const lastMsg = messages[lastIndex];
        const newToolCalls = [...(lastMsg.toolCalls || []), { toolName, status: 'running' as const }];
        messages[lastIndex] = { ...lastMsg, toolCalls: newToolCalls };
      }
      return { messages };
    });
  },

  setPlan: (plan: string[]) => set({ currentPlan: plan }),
  addAlert: (alert: any) => set((state) => ({ alerts: [...state.alerts, alert] })),

  sendChatMessage: async (content) => {
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, created_at: new Date().toISOString() } as Message;
    const placeholderAssistant = { id: crypto.randomUUID(), role: 'assistant', content: '[Thinking...]', created_at: new Date().toISOString() } as Message;
    set({ 
      messages: [...get().messages, userMessage, placeholderAssistant],
      coreStatus: 'THINKING' 
    });

    try {
      const response = await api.post('/chat', {
        content,
        conversation_id: get().activeConversationId || undefined,
        voice_output: get().isVoiceActive
      });

      const { response: replyText, voice_url, conversation_id } = response.data;
      
      const assistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: replyText, voice_url, created_at: new Date().toISOString() } as Message;

      const isLocalVoiceActive = !voice_url && get().isVoiceActive;
      set((state) => ({
        messages: [...state.messages.slice(0, -1), assistantMessage],
        activeConversationId: conversation_id,
        coreStatus: (voice_url || isLocalVoiceActive) ? 'SPEAKING' : 'STANDBY',
        voicePlaybackUrl: voice_url || null
      }));

      get().fetchConversations(); // Update history list in case this was a new chat

      if (voice_url) {
        get().addNotification("Voice synthesizer output generated.");
      } else if (get().isVoiceActive) {
        speakLocalTTS(replyText, get().setCoreStatus);
        get().addNotification("Local TTS voice fallback activated.");
      }
    } catch (err) {
      console.error(err);
      set({ coreStatus: 'STANDBY' });
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
    get().addNotification(`Launching virtual browser grid for: ${url}...`);
    try {
      const initRes = await api.post('/browser/browse', { url, actions });
      const taskId = initRes.data.task_id;
      
      if (!taskId) throw new Error("No task ID returned");
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/browser/task/${taskId}`);
          const taskData = statusRes.data;
          
          if (taskData.status === 'success') {
            clearInterval(pollInterval);
            set({
              browserStatus: 'completed',
              browserScreenshotUrl: taskData.screenshot_url,
              browserTitle: taskData.title,
              browserText: taskData.extracted_text,
              browserActionsLog: taskData.actions_log || []
            });
            get().addNotification(`Browser automation completed. Target title: "${taskData.title}"`);
          } else if (taskData.status === 'failed') {
            clearInterval(pollInterval);
            set({ browserStatus: 'failed' });
            get().addNotification(`Browser automation failed: ${taskData.error}`);
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
          clearInterval(pollInterval);
          set({ browserStatus: 'failed' });
        }
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      set({ browserStatus: 'failed' });
      get().addNotification(`Browser automation request failed.`);
    }
  },

  // Memory utilities
  memories: [],
  fetchMemories: async (query) => {
    try {
      const endpoint = query ? `/memory/search?query=${encodeURIComponent(query)}` : '/memory/search?query=';
      const res = await api.get(endpoint);
      set({ memories: res.data?.results || [] });
    } catch (err) {
      console.error(err);
    }
  },

  addMemory: async (content) => {
    try {
      await api.post('/memory/add', null, { params: { fact: content } });
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
  tokenUsage: { prompt: 0, completion: 0, total: 0 },
  setTokenUsage: (usage) => set({ tokenUsage: usage }),
  userPreferences: null,
  fetchPreferences: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ userPreferences: res.data });
    } catch (err) {
      console.error(err);
    }
  },
  updatePreferences: async (prefs) => {
    try {
      await api.put('/auth/me/preferences', prefs);
      get().fetchPreferences();
      get().addNotification("User preferences updated.");
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  
  localModels: [],
  fetchLocalModels: async () => {
    try {
      const res = await api.get('/auth/models/local');
      if (res.data && res.data.models) {
        set({ localModels: res.data.models });
      }
    } catch (err) {
      console.error("Failed to fetch local models:", err);
    }
  },

  agentConfig: null,
  fetchAgentConfig: async () => {
    try {
      const res = await api.get('/agents/config');
      set({ agentConfig: res.data });
    } catch (err) {
      console.error(err);
    }
  },
  updateAgentConfig: async (config) => {
    try {
      await api.put('/agents/config', config);
      get().fetchAgentConfig();
      get().addNotification("Agent marketplace configuration updated.");
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  analyticsData: null,
  fetchAnalytics: async () => {
    try {
      const [tokenRes, toolRes] = await Promise.all([
        api.get('/analytics/tokens'),
        api.get('/analytics/tools')
      ]);
      set({ 
        analyticsData: {
          tokens: tokenRes.data,
          tools: toolRes.data
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}));
