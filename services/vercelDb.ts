
export interface CloudConfig {
  url: string;
  key: string;
}

/**
 * Configuration provided by user for auto-linking.
 */
const getConfig = (): CloudConfig | null => {
  const url = "https://einilxwsgjrpuhvpsipe.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbmlseHdzZ2pycHVodnBzaXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc0NDIsImV4cCI6MjA3NzYwMzQ0Mn0.mjHXBDaOzovXuIybQze59Bg4UB3yyMmvlmJknqA1o_8";

  return { url, key };
};

export const isVercelEnabled = () => {
  const config = getConfig();
  return !!(config.url && config.key);
};

/**
 * Supabase PostgREST API request helper.
 * Includes a timeout signal to prevent hanging in PWA/Mobile environments.
 */
async function cloudRequest(method: 'GET' | 'UPSERT', key: string, data?: any) {
  const config = getConfig();
  if (!config) return null;

  const url = `${config.url}/rest/v1/kv_store`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const options: RequestInit = {
      method: method === 'GET' ? 'GET' : 'POST',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    };

    if (method === 'UPSERT') {
      options.headers = {
        ...options.headers,
        'Prefer': 'resolution=merge-duplicates',
      };
      options.body = JSON.stringify({ id: key, value: data });
    }

    const fetchUrl = method === 'GET' ? `${url}?id=eq.${key}&select=value` : url;
    const response = await fetch(fetchUrl, options);
    
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    
    if (method === 'GET') {
      const result = await response.json();
      return result.length > 0 ? result[0].value : null;
    }
    
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.warn("Cloud request timed out.");
    } else {
      console.error("Supabase Connection Failed:", error);
    }
    return null;
  }
}

export const cloudGetUsers = async (): Promise<Record<string, { passwordHash: string }>> => {
  const result = await cloudRequest('GET', "global_user_registry");
  return result || {};
};

export const cloudSaveUsers = async (users: Record<string, { passwordHash: string }>) => {
  return await cloudRequest('UPSERT', "global_user_registry", users);
};

export const cloudSave = async (userId: string, key: string, data: any) => {
  const normalizedUser = userId.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const fullKey = `supa_v2_${key}_${normalizedUser}`;
  return await cloudRequest('UPSERT', fullKey, data);
};

export const cloudFetch = async (userId: string, key: string) => {
  const normalizedUser = userId.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const fullKey = `supa_v2_${key}_${normalizedUser}`;
  return await cloudRequest('GET', fullKey);
};
