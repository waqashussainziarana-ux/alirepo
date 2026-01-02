
export interface VercelConfig {
  url: string;
  token: string;
}

const getConfig = (): VercelConfig | null => {
  const url = localStorage.getItem('vercel-kv-url');
  const token = localStorage.getItem('vercel-kv-token');
  if (!url || !token) return null;
  return { url, token };
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
    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error("Vercel KV Error:", error);
    return null;
  }
}

export const cloudSave = async (userId: string, key: string, data: any) => {
  const fullKey = `kb_${key}_${userId}`;
  return await kvRequest(["SET", fullKey, JSON.stringify(data)]);
};

export const cloudFetch = async (userId: string, key: string) => {
  const fullKey = `kb_${key}_${userId}`;
  const result = await kvRequest(["GET", fullKey]);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};
