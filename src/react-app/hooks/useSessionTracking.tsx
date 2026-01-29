import { useEffect, useRef } from 'react';

export function useSessionTracking() {
  const sessionId = useRef<string>('');
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Generate unique session ID
    sessionId.current = generateSessionId();
    
    // Start session
    startSession();
    
    // Setup heartbeat
    setupHeartbeat();
    
    // Cleanup on unmount
    return () => {
      endSession();
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startSession = async () => {
    try {
      await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          page_url: window.location.pathname,
          user_agent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const updateHeartbeat = async () => {
    try {
      await fetch('/api/sessions/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          page_url: window.location.pathname,
        }),
      });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  };

  const setupHeartbeat = () => {
    // Send heartbeat every 10 seconds
    heartbeatInterval.current = setInterval(updateHeartbeat, 10000);
  };

  const endSession = async () => {
    try {
      await fetch('/api/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId.current,
        }),
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return {
    sessionId: sessionId.current,
  };
}
