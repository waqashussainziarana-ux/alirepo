
export interface VercelConfig {
  url: string;
  token: string;
}

/**
 * Gets the configuration for the Vercel KV database exclusively from the environment.
 * This ensures the app is "hard-wired" to the Vercel backend for all users.
 */
const getConfig = (): VercelConfig | null => {
  // Vercel automatically injects these into the environment when the KV store is linked.
  const envUrl = (process.env as any).KV_REST_API_URL;
  const envToken = (process.env as any).KV_REST_API_TOKEN;

  if (envUrl && envToken) {
    return { url: envUrl, token: envToken };
  }

  console.warn("Vercel KV environment variables are missing. Ensure your KV store is linked in the Vercel dashboard.");
  return null;
};

export const isVercelEnabled = () => {
  const config = getConfig();
  return !!(config?.url && config?.token);
};

async function kvRequest(command: any[]) {
  const config = getConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      throw new Error(`Cloud Storage Error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error("Vercel KV Communication Error:", error);
    return null;
  }
}

/**
 * Saves data to the cloud using the user ID as part of the key.
 * This partitions data so users only see their own records.
 */
export const cloudSave = async (userId: string, key: string, data: any) => {
  const fullKey = `dt_app_${key}_${userId.toLowerCase().trim()}`;
  return await kvRequest(["SET", fullKey, JSON.stringify(data)]);
};

/**
 * Fetches data from the cloud for a specific user.
 */
export const cloudFetch = async (userId: string, key: string) => {
  const fullKey = `dt_app_${key}_${userId.toLowerCase().trim()}`;
  const result = await kvRequest(["GET", fullKey]);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};
