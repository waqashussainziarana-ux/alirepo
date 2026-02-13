
export interface CloudConfig {
  url: string;
  key: string;
}

const getConfig = (): CloudConfig | null => {
  // CRITICAL: We MUST NOT use process.env.API_KEY here. 
  // That variable is reserved for Gemini. Using it for Supabase causes 401/400 errors.
  const url = process.env.SUPABASE_URL || "https://einilxwsgjrpuhvpsipe.supabase.co";
  const key = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbmlseHdzZ2pycHVodnBzaXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc0NDIsImV4cCI6MjA3NzYwMzQ0Mn0.mjHXBDaOzovXuIybQze59Bg4UB3yyMmvlmJknqA1o_8";
  
  if (!url || !key || url.includes("your-project") || key.length < 20) return null;
  return { url, key };
};

export const isVercelEnabled = () => {
  const config = getConfig();
  return !!config;
};

/**
 * Robust fetch wrapper for Supabase REST API
 */
async function cloudRequest(method: 'GET' | 'POST', key: string, data?: any) {
  const config = getConfig();
  if (!config) return null;

  const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
  const tableUrl = `${baseUrl}/rest/v1/kv_store`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = {
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    };

    if (method === 'GET') {
      const query = new URLSearchParams({
        id: `eq.${key}`,
        select: 'value',
      });

      const response = await fetch(`${tableUrl}?${query.toString()}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403 || response.status === 400) {
        const err = await response.json().catch(() => ({ message: 'Auth failed' }));
        console.error("Supabase Auth Error:", err);
        throw new Error("AUTH_ERROR");
      }

      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      
      const result = await response.json();
      return (Array.isArray(result) && result.length > 0) ? result[0].value : undefined;
    } else {
      headers['Prefer'] = 'resolution=merge-duplicates';
      
      const response = await fetch(tableUrl, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({ id: key, value: data }),
      });
      
      clearTimeout(timeoutId);
      if (response.status === 401 || response.status === 403 || response.status === 400) {
        throw new Error("AUTH_ERROR");
      }
      if (!response.ok) throw new Error(`SAVE_ERR_${response.status}`);
      return true;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.message === "AUTH_ERROR") {
      // Return a special object so the App knows to disable cloud features
      return { _isAuthError: true };
    }
    throw error;
  }
}

const getNormalizedId = (userId: string) => userId.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

export const cloudSave = async (userId: string, key: string, data: any) => {
  const fullKey = `supa_v45_${key}_${getNormalizedId(userId)}`;
  const payload = {
    data: data,
    ts: Date.now(),
    v: 45
  };
  const res = await cloudRequest('POST', fullKey, payload);
  return res && typeof res === 'object' && res._isAuthError ? null : res;
};

export const cloudFetch = async (userId: string, key: string) => {
  const id = getNormalizedId(userId);
  const fullKey = `supa_v45_${key}_${id}`;
  
  try {
    const result = await cloudRequest('GET', fullKey);
    if (result && result._isAuthError) return null; // Connectivity/Auth error signal
    
    if (result && typeof result === 'object' && 'data' in result) return result;
    if (Array.isArray(result)) return { data: result, ts: 0 };
    return undefined;
  } catch (e) {
    return null; 
  }
};

export const cloudGetUsers = async (): Promise<Record<string, { passwordHash: string }>> => {
  try {
    const result = await cloudRequest('GET', "global_user_registry");
    if (result && result._isAuthError) return {};
    return result || {};
  } catch (e) {
    return {};
  }
};

export const cloudSaveUsers = async (users: Record<string, { passwordHash: string }>) => {
  try {
    const res = await cloudRequest('POST', "global_user_registry", users);
    return res && typeof res === 'object' && res._isAuthError ? false : !!res;
  } catch (e) {
    return false;
  }
}
