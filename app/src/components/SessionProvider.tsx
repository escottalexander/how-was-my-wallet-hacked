'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SessionContextType {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: null,
  isLoading: true,
  error: null,
});

export function useSession() {
  return useContext(SessionContext);
}

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSession() {
      try {
        // Check for existing session in localStorage
        const existingSessionId = localStorage.getItem('howwasihacked_session_id');

        if (existingSessionId) {
          // Verify the session still exists
          const response = await fetch(`/api/session?id=${existingSessionId}`);
          if (response.ok) {
            setSessionId(existingSessionId);
            setIsLoading(false);
            return;
          }
          // Session no longer exists, remove from localStorage
          localStorage.removeItem('howwasihacked_session_id');
        }

        // Create new session
        const response = await fetch('/api/session', { method: 'POST' });
        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        localStorage.setItem('howwasihacked_session_id', data.sessionId);
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, isLoading, error }}>
      {children}
    </SessionContext.Provider>
  );
}
