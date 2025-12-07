interface LifelogEntry {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  markdown?: string;
  transcript?: string;
  actionItems?: string[];
  summary?: string;
}

interface LifelogsResponse {
  lifelogs: LifelogEntry[];
  total: number;
}

interface LimitlessConfig {
  apiKey: string;
  baseUrl?: string;
}

export class LimitlessClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LimitlessConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.limitless.ai';
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Limitless API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLifelogs(options?: {
    limit?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    timezone?: string;
  }): Promise<LifelogsResponse> {
    const params: Record<string, string> = {};
    
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.date) params.date = options.date;
    if (options?.dateFrom) params.date_from = options.dateFrom;
    if (options?.dateTo) params.date_to = options.dateTo;
    if (options?.timezone) params.timezone = options.timezone;

    return this.request<LifelogsResponse>('/v1/lifelogs', params);
  }

  async getLifelogById(id: string): Promise<LifelogEntry> {
    return this.request<LifelogEntry>(`/v1/lifelogs/${id}`);
  }

  async downloadAudio(startMs: number, endMs: number): Promise<ArrayBuffer> {
    const maxDuration = 7200000; // 2 hours max
    if (endMs - startMs > maxDuration) {
      throw new Error('Audio download limited to 2 hours max');
    }

    const url = new URL(`${this.baseUrl}/v1/download-audio`);
    url.searchParams.append('startMs', startMs.toString());
    url.searchParams.append('endMs', endMs.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Limitless API error: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async getChats(options?: {
    limit?: number;
    direction?: 'asc' | 'desc';
  }): Promise<{ chats: any[] }> {
    const params: Record<string, string> = {};
    
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.direction) params.direction = options.direction;

    return this.request<{ chats: any[] }>('/v1/chats', params);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getLifelogs({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

let limitlessClient: LimitlessClient | null = null;

export function getLimitlessClient(): LimitlessClient | null {
  if (limitlessClient) return limitlessClient;
  
  const apiKey = process.env.LIMITLESS_API_KEY;
  if (!apiKey) return null;
  
  limitlessClient = new LimitlessClient({ apiKey });
  return limitlessClient;
}

export function formatLifelogAsTranscript(lifelog: LifelogEntry): string {
  let transcript = '';
  
  if (lifelog.markdown) {
    transcript = lifelog.markdown;
  } else if (lifelog.transcript) {
    transcript = lifelog.transcript;
  }
  
  return transcript;
}

export function extractDuration(lifelog: LifelogEntry): number {
  if (lifelog.duration) return lifelog.duration;
  
  const start = new Date(lifelog.startTime).getTime();
  const end = new Date(lifelog.endTime).getTime();
  return Math.round((end - start) / 1000);
}
