
export interface CloudConfig {
  url: string;
  key: string;
}

/**
 * Supabase configuration for Daily Transactions.
 * Hardcoded to ensure zero-setup cross-device synchronization.
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
 * PostgREST API helper for Supabase.
 */
async function cloudRequest(method: 'GET' | 'POST', key: string, data?: any) {
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
      return result.length > 0 ? result[0].value : undefined;
    } else {
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
      
      return response.ok ? true : null;
    }
  } catch (error) {
    console.error("Cloud Error:", error);
    return null;
  }
}

const getNormalizedId = (userId: string) => userId.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

export const cloudSave = async (userId: string, key: string, data: any) => {
  const fullKey = `supa_v45_${key}_${getNormalizedId(userId)}`;
  return await cloudRequest('POST', fullKey, data);
};

/**
 * RESILIENT FETCH: Searches multiple keys to find valid array data
 */
export const cloudFetch = async (userId: string, key: string) => {
  const id = getNormalizedId(userId);
  const possibleKeys = [
    `supa_v45_${key}_${id}`, 
    `supa_v2_${key}_${id}`, 
    `daily-transactions-${key}-${userId}`
  ];

  for (const k of possibleKeys) {
    const result = await cloudRequest('GET', k);
    if (result !== undefined && result !== null) {
      // If the result is a wrapper object { data: [], ... }
      if (result.data && Array.isArray(result.data)) return result.data;
      // If the result is a direct array
      if (Array.isArray(result)) return result;
    }
  }
  return undefined;
};

export const cloudGetUsers = async (): Promise<Record<string, { passwordHash: string }>> => {
  const result = await cloudRequest('GET', "global_user_registry");
  return result || {};
};

export const cloudSaveUsers = async (users: Record<string, { passwordHash: string }>) => {
  return await cloudRequest('POST', "global_user_registry", users);
};
