
export const getDeviceId = () => {
  let id = localStorage.getItem('dt-device-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('dt-device-id', id);
  }
  return id;
};

const SUPABASE_URL = "https://einilxwsgjrpuhvpsipe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbmlseHdzZ2pycHVodnBzaXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc0NDIsImV4cCI6MjA3NzYwMzQ0Mn0.mjHXBDaOzovXuIybQze59Bg4UB3yyMmvlmJknqA1o_8";

async function sessionRequest(method: 'GET' | 'POST' | 'DELETE', query: string, body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/active_sessions${query}`;
  const headers: any = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (method === 'POST') {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // Short timeout to prevent UI hang
      signal: AbortSignal.timeout(5000) 
    });

    // Case: Table not set up yet
    if (response.status === 404) {
      return method === 'GET' ? [] : true;
    }

    if (!response.ok) return null;
    
    // For DELETE/POST we often don't need the JSON response
    if (method === 'GET') {
      return await response.json();
    }
    
    return true;
  } catch (e) {
    // Silently log network errors to console to avoid bothering the user
    console.warn(`[SessionService] ${method} request failed:`, (e as Error).message);
    return null;
  }
}

export const sessionService = {
  async ping(username: string) {
    if (!username) return false;
    const deviceId = getDeviceId();
    const result = await sessionRequest('POST', '', {
      username: username.toLowerCase().trim(),
      device_id: deviceId,
      last_seen: new Date().toISOString()
    });
    return !!result;
  },

  async verifySelf(username: string) {
    if (!username) return false;
    const deviceId = getDeviceId();
    const data = await sessionRequest('GET', `?username=eq.${username.toLowerCase().trim()}&device_id=eq.${deviceId}&select=id`);
    // If request failed (null), we treat as 'alive' to be safe
    if (data === null) return true; 
    return data.length > 0;
  },

  async getIdleSessions(username: string) {
    if (!username) return [];
    // Only fetch sessions older than 5 minutes that are NOT this device
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const deviceId = getDeviceId();
    const data = await sessionRequest('GET', `?username=eq.${username.toLowerCase().trim()}&device_id=neq.${deviceId}&last_seen=lt.${fiveMinsAgo}&select=*`);
    return data || [];
  },

  async terminateSessions(ids: string[]) {
    if (!ids || ids.length === 0) return true;
    return !!(await sessionRequest('DELETE', `?id=in.(${ids.join(',')})`));
  },

  async logout(username: string) {
    if (!username) return true;
    const deviceId = getDeviceId();
    return !!(await sessionRequest('DELETE', `?username=eq.${username.toLowerCase().trim()}&device_id=eq.${deviceId}`));
  }
};
