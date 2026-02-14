
import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionService } from '../services/sessionService';

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 Minutes
const PING_INTERVAL_MS = 30000;        // 30 Seconds
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 Minutes of no interaction

export const useSessionSecurity = (username: string | null, onForceLogout: (reason: string) => void) => {
  const [idleSessions, setIdleSessions] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  
  // Persistence refs
  const sessionStartTime = useRef<number>(0);
  const lastSuccessfulPing = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());
  const isFirstCheckAfterLogin = useRef<boolean>(true);

  // Track User Activity
  useEffect(() => {
    const recordActivity = () => {
      lastActivityTime.current = Date.now();
    };

    window.addEventListener('mousemove', recordActivity);
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('touchstart', recordActivity);
    window.addEventListener('click', recordActivity);

    return () => {
      window.removeEventListener('mousemove', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('click', recordActivity);
    };
  }, []);

  const checkSessions = useCallback(async (isInitial: boolean = false) => {
    if (!username) return;

    const now = Date.now();
    const inactiveDuration = now - lastActivityTime.current;

    /**
     * 1. Heartbeat Logic
     * We ONLY ping the server if:
     * a) It's the initial login check
     * b) The user has been active within the last 5 minutes
     */
    if (isInitial || inactiveDuration < IDLE_THRESHOLD_MS) {
      try {
        const pingOk = await sessionService.ping(username);
        if (pingOk) {
          lastSuccessfulPing.current = now;
        }
      } catch (e) {
        console.warn("Security heartbeat failed. Retrying...");
      }
    } else {
      console.debug("Session is idle. Heartbeat suspended.");
    }

    /**
     * 2. Identity Verification (Anti-Hijack / Remote Termination)
     */
    const sessionAge = now - sessionStartTime.current;
    
    if (sessionAge > GRACE_PERIOD_MS && !isInitial && !isFirstCheckAfterLogin.current) {
      try {
        const stillAlive = await sessionService.verifySelf(username);
        
        // If we are missing from the DB AND it's been a while since we successfully reached the DB
        if (!stillAlive && (now - lastSuccessfulPing.current > 3 * 60 * 1000)) {
          onForceLogout("Security Notice: This session was terminated by another device or has expired.");
          return;
        }
      } catch (e) {
        console.error("Security verification skipped due to network error.");
      }
    }
    
    if (isInitial) {
      isFirstCheckAfterLogin.current = false;
    }

    /**
     * 3. Idle Detection for OTHER devices
     * We look for sessions where last_seen > 5 minutes ago.
     */
    try {
      const idle = await sessionService.getIdleSessions(username);
      if (idle.length > 0) {
        setIdleSessions(idle);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    } catch (e) {
      // Background check failed
    }
  }, [username, onForceLogout]);

  useEffect(() => {
    if (!username) {
      sessionStartTime.current = 0;
      isFirstCheckAfterLogin.current = true;
      setIdleSessions([]);
      setShowWarning(false);
      return;
    }

    sessionStartTime.current = Date.now();
    lastSuccessfulPing.current = Date.now();
    lastActivityTime.current = Date.now();

    checkSessions(true);

    const interval = setInterval(() => checkSessions(false), PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [username, checkSessions]);

  const terminateIdle = async () => {
    if (idleSessions.length === 0) return;
    
    const ids = idleSessions.map(s => s.id);
    try {
      const success = await sessionService.terminateSessions(ids);
      if (success) {
        setIdleSessions([]);
        setShowWarning(false);
      }
    } catch (e) {
      alert("Could not terminate sessions. Please try again.");
    }
  };

  return {
    showWarning,
    setShowWarning,
    terminateIdle,
    idleCount: idleSessions.length,
    triggerManualCheck: () => checkSessions(false)
  };
};
