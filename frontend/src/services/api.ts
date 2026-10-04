// Demo mode: when no real backend is available (e.g., Vercel web deployment)
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Explicit env flag
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  // On Vercel or non-localhost hosts without a configured API, use demo mode
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1' && !import.meta.env.VITE_API_BASE_URL) return true;
  return false;
};

let currentApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7860';

export const getApiBaseUrl = () => currentApiBaseUrl;

export const setApiBaseUrl = (url: string) => {
  currentApiBaseUrl = url;
};

// In Electron desktop environment, automatically query dynamic backend port if available
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        const port = await electronAPI.getBackendPort();
        if (port && typeof port === 'number' && port > 0) {
          currentApiBaseUrl = `http://127.0.0.1:${port}`;
          console.log(`[AeroEdge-X Electron Desktop] Connected to local AI backend on port ${port}`);
        }
      }
    } catch {
      // In browser dev mode, default port 7860 is used
    }
  })();
}

export const API_BASE_URL = currentApiBaseUrl;

export interface Detection {
  defect_type: string;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
  location: { x_center: number; y_center: number; width: number; height: number };
}

export interface VisionResult {
  agent: string;
  timestamp: string;
  image: string;
  annotated_image: string;
  primary_defect: string;
  total_detections: number;
  detections: Detection[];
  status: 'defect_found' | 'no_defect';
}

export interface RagResult {
  query: string;
  procedure: string;
  source: string;
  page: number;
  chunks: { text: string; source: string; page: number }[];
}

// Simple fetch with timeout, no authentication overhead
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 60000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
};

export interface ReasoningStep {
  number: number;
  title: string;
  description: string;
}

export interface ReasoningResult {
  defect_type: string;
  severity: string;
  steps: ReasoningStep[];
  raw_response: string;
}

export interface AnalyzeResponse {
  inspection_id: number;
  image_url: string;
  vision: VisionResult;
  rag: RagResult;
  reasoning: ReasoningResult;
}

export interface InspectionHistoryItem {
  id: number;
  timestamp: string;
  primary_defect: string;
  severity: string;
  source: string;
  page: number;
  image_path?: string;
  annotated_image?: string;
}

export interface SearchResultItem extends InspectionHistoryItem {}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'warning' | 'info' | 'success';
  entity_type: string;
  entity_id: number;
  created_at: string;
  is_read: boolean;
}

export interface User {
  id: number;
  username: string;
  role: string;
  full_name?: string;
  email?: string;
  technician_id?: string;
  station?: string;
  phone?: string;
  detection_threshold?: number;
  audio_alerts?: boolean;
  auto_refresh?: boolean;
}

export interface SystemDiagnosticsResponse {
  status: string;
  latency_ms: number;
  timestamp: string;
  telemetry: {
    vision: {
      name: string;
      model: string;
      status: string;
      classes: number;
      weights_mb: number;
      device: string;
    };
    rag: {
      name: string;
      engine: string;
      status: string;
      chunks_count: number;
      manuals_count: number;
      embeddings: string;
    };
    reasoning: {
      name: string;
      engine: string;
      status: string;
      temperature: number;
      max_tokens: number;
    };
    database: {
      name: string;
      status: string;
      size_mb: number;
      inspections: number;
      notifications: number;
      audit_logs: number;
      users: number;
    };
  };
}


export interface SystemStatus {
  version: string;
  database: string;
  last_sync: string;
}

// ── Demo data for Vercel web demonstration ──
const DEMO_VISION: VisionResult = {
  agent: 'VisionAgent',
  timestamp: new Date().toISOString(),
  image: '',
  annotated_image: '',
  primary_defect: 'crack',
  total_detections: 1,
  detections: [{
    defect_type: 'crack',
    confidence: 0.87,
    severity: 'high',
    location: { x_center: 0.45, y_center: 0.52, width: 0.12, height: 0.08 }
  }],
  status: 'defect_found'
};

const DEMO_RAG: RagResult = {
  query: 'crack',
  procedure: 'Refer to AC 43.13-1B Chapter 4 Section 3 — Visual inspection of surface cracks. Measure crack length and depth. If crack exceeds allowable limits per AMM, initiate repair per SRM Chapter 51-70-11.',
  source: 'ac_43.13-1b_w-chg1.pdf',
  page: 42,
  chunks: [{ text: 'Surface crack inspection procedure per AC 43.13-1B.', source: 'ac_43.13-1b_w-chg1.pdf', page: 42 }]
};

const DEMO_REASONING: ReasoningResult = {
  defect_type: 'crack',
  severity: 'high',
  steps: [
    { number: 1, title: 'Isolate Area', description: 'Cordon off the affected area and document the crack location with photographs.' },
    { number: 2, title: 'Measure Defect', description: 'Use calibrated tools to measure crack length, width, and depth.' },
    { number: 3, title: 'Consult SRM', description: 'Reference Structural Repair Manual Chapter 51-70-11 for allowable damage limits.' },
    { number: 4, title: 'Initiate Repair', description: 'If crack exceeds limits, prepare NDT inspection and submit repair order.' },
    { number: 5, title: 'Document Findings', description: 'Log inspection results in maintenance tracking system and generate report.' }
  ],
  raw_response: 'Demo mode — sample AI reasoning output for web demonstration.'
};

const DEMO_HISTORY: InspectionHistoryItem[] = [
  { id: 1, timestamp: '2026-09-28T14:32:00', primary_defect: 'crack', severity: 'high', source: 'ac_43.13-1b_w-chg1.pdf', page: 42 },
  { id: 2, timestamp: '2026-09-27T09:15:00', primary_defect: 'corrosion', severity: 'medium', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 18 },
  { id: 3, timestamp: '2026-09-26T16:45:00', primary_defect: 'dent', severity: 'low', source: 'ac_43.13-1b_w-chg1.pdf', page: 67 },
];

export const api = {
  analyze: async (file: File, threshold: number = 0.4): Promise<AnalyzeResponse> => {
    if (isDemoMode()) {
      // Simulate processing delay
      await new Promise(r => setTimeout(r, 2000));
      const imageUrl = URL.createObjectURL(file);
      return {
        inspection_id: Math.floor(Math.random() * 900) + 100,
        image_url: imageUrl,
        vision: { ...DEMO_VISION, image: imageUrl, annotated_image: imageUrl },
        rag: DEMO_RAG,
        reasoning: DEMO_REASONING
      };
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('threshold', threshold.toString());

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/analyze`, {
      method: 'POST',
      body: formData
    }, 120000);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to analyze image');
    }

    return response.json();
  },

  getHistory: async (limit: number = 10): Promise<InspectionHistoryItem[]> => {
    if (isDemoMode()) return DEMO_HISTORY.slice(0, limit);

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  getImageUrl: (filename: string) => {
    if (!filename) return '';
    if (filename.startsWith('blob:')) return filename;
    let normalized = filename.replace(/\\/g, '/');
    if (normalized.startsWith('http')) return normalized;
    if (normalized.startsWith('/')) return `${getApiBaseUrl()}${normalized}`;
    if (normalized.startsWith('uploads/')) return `${getApiBaseUrl()}/${normalized}`;
    if (normalized.match(/^[A-Za-z]:\//)) {
      const parts = normalized.split('/');
      const fname = parts[parts.length - 1];
      return `${getApiBaseUrl()}/uploads/${fname}`;
    }
    return `${getApiBaseUrl()}/uploads/${normalized}`;
  },

  getReportUrl: (inspectionId: number) => {
    if (isDemoMode()) return '#';
    return `${getApiBaseUrl()}/report/${inspectionId}`;
  },

  search: async (query: string, limit: number = 20): Promise<SearchResultItem[]> => {
    if (isDemoMode()) {
      return DEMO_HISTORY.filter(h =>
        h.primary_defect.includes(query.toLowerCase()) ||
        h.severity.includes(query.toLowerCase())
      ).slice(0, limit);
    }

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  getNotifications: async (limit: number = 50): Promise<NotificationItem[]> => {
    if (isDemoMode()) {
      return [{
        id: 1,
        title: 'HIGH Severity Defect Detected',
        message: 'Inspection #1 detected a CRACK classified as HIGH severity.',
        severity: 'high',
        entity_type: 'inspection',
        entity_id: 1,
        created_at: '2026-09-28T14:32:00',
        is_read: false
      }];
    }

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/notifications?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markNotificationsRead: async (): Promise<void> => {
    if (isDemoMode()) return;
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/notifications/read`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
  },

  healthCheck: async (): Promise<boolean> => {
    if (isDemoMode()) return true;
    try {
      const response = await fetch(`${getApiBaseUrl()}/health`, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  },


  getSystemStatus: async (): Promise<SystemStatus> => {
    if (isDemoMode()) {
      return { version: 'v2.6.0-hardened (Demo)', database: 'Demo Mode', last_sync: 'N/A' };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/system/status`);
    if (!response.ok) throw new Error('Failed to fetch system status');
    return response.json();
  },

  updateProfile: async (data: Partial<User>): Promise<{ status: string; message: string; user: User }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — profile not persisted', user: { id: 1, username: 'demo', role: 'technician', ...data } as User };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ status: string; message: string }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — password not changed' };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
    return response.json();
  },

  updatePreferences: async (prefs: {
    detection_threshold?: number;
    audio_alerts?: boolean;
    auto_refresh?: boolean;
  }): Promise<{ status: string; message: string; user: User }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — preferences not persisted', user: { id: 1, username: 'demo', role: 'technician', ...prefs } as User };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update preferences');
    }
    return response.json();
  },

  getDiagnostics: async (): Promise<SystemDiagnosticsResponse> => {
    if (isDemoMode()) {
      return {
        status: 'healthy',
        latency_ms: 12,
        timestamp: new Date().toISOString(),
        telemetry: {
          vision: { name: 'Vision Agent', model: 'YOLOv11 Defect Detector', status: 'Demo', classes: 5, weights_mb: 5.2, device: 'N/A (Demo)' },
          rag: { name: 'Manuals & RAG Index', engine: 'LangChain ChromaDB', status: 'Demo', chunks_count: 247, manuals_count: 2, embeddings: 'all-MiniLM-L6-v2' },
          reasoning: { name: 'Reasoning Agent', engine: 'Ollama (phi3:mini)', status: 'Demo', temperature: 0.1, max_tokens: 500 },
          database: { name: 'Digital Twin SQLite', status: 'Demo', size_mb: 0, inspections: 3, notifications: 1, audit_logs: 0, users: 1 }
        }
      };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/system/diagnostics`);
    if (!response.ok) throw new Error('Failed to fetch system diagnostics');
    return response.json();
  },

  getSyncStatus: async (): Promise<any> => {
    if (isDemoMode()) {
      return { overall_state: 'SYNCED', stats: { PENDING: 0, SYNCING: 0, SYNCED: 42, FAILED: 0 } };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/sync/status`);
    if (!response.ok) throw new Error('Failed to fetch sync status');
    return response.json();
  },

  get: async (endpoint: string, options: any = {}) => {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data } };
    return { data };
  },

  post: async (endpoint: string, payload?: any, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const response = await fetchWithTimeout(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data } };
    return { data };
  }
};

