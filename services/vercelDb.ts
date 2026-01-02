
export interface CloudConfig {
  url: string;
  key: string;
}

/**
 * Configuration provided by user for auto-linking.
 * Using hardcoded values to ensure zero-setup cross-device sync.
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
 * Manages the 'kv_store' table created by the user.
 */
async function cloudRequest(method: 'GET' | 'UPSERT', key: string, data?: any) {
  const config = getConfig();
  if (!config) return null;

  const url = `${config.url}/rest/v1/kv_store`;

  try {
    if (method === 'GET') {
      const response = await fetch(`${url}?id=eq.${key}&select=value`, {
        method: 'GET',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) return null;
      const result = await response.json();
      return result.length > 0 ? result[0].value : null;
    } else {
      // UPSERT using PostgREST syntax
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ id: key, value: data }),
      });
      
      return response.ok;
    }
  } catch (error) {
    console.error("Supabase Connection Failed:", error);
    return null;
  }
}

/** 
 * USER REGISTRY (Global)
 * Stores account information across all devices.
 */
export const cloudGetUsers = async (): Promise<Record<string, { passwordHash: string }>> => {
  const result = await cloudRequest('GET', "global_user_registry");
  return result || {};
};

export const cloudSaveUsers = async (users: Record<string, { passwordHash: string }>) => {
  return await cloudRequest('UPSERT', "global_user_registry", users);
};

/** 
 * TRANSACTION DATA (User-specific)
 */
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
