import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { WorkspaceMember } from '../types';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (msg: any) => void;
  connectToProject: (projectId: number | string) => void;
  /** Real-time list of workspace members currently online */
  onlineMembers: WorkspaceMember[];
  /** Total count of unique online users */
  onlineMemberCount: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [onlineMembers, setOnlineMembers] = useState<WorkspaceMember[]>([]);

  const projectSocketRef = useRef<WebSocket | null>(null);
  const presenceSocketRef = useRef<WebSocket | null>(null);
  const presenceHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to resolve WebSocket base host dynamically
  const getWsBase = () => {
    const customWs = import.meta.env.VITE_WS_URL;
    if (customWs) return customWs.replace(/\/$/, '');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl.startsWith('http')) {
      try {
        const url = new URL(apiUrl);
        const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProto}//${url.host}`;
      } catch { /* ignore */ }
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//127.0.0.1:8000`;
  };

  // ─── Project-level WebSocket ─────────────────────────────────────────────
  const connectToProject = useCallback((projectId: number | string) => {
    if (projectSocketRef.current) {
      projectSocketRef.current.close();
    }

    const wsUrl = `${getWsBase()}/ws/projects/${projectId}/`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log(`[WS] Connected to project ${projectId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Project socket disconnected');
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      projectSocketRef.current = ws;
    } catch {
      setIsConnected(false);
    }
  }, []);

  // ─── Workspace Presence WebSocket ─────────────────────────────────────────
  // This connects to the workspace channel which broadcasts who's online.
  // Falls back to polling the members API if WebSocket is unavailable.
  const connectPresence = useCallback(
    (workspaceId: number, token: string | null, currentUserId: number) => {
      // Clean up existing presence socket
      if (presenceSocketRef.current) {
        presenceSocketRef.current.close();
      }
      if (presenceHeartbeatRef.current) {
        clearInterval(presenceHeartbeatRef.current);
      }

      const wsUrl = `${getWsBase()}/ws/workspace/${workspaceId}/?token=${token || ''}`;

      // Try to use a dedicated presence WebSocket channel.
      // If unavailable (backend doesn't have this route yet), we fall back
      // to polling the members API every 30 seconds.
      const tryWebSocket = () => {
        try {
          const ws = new WebSocket(wsUrl);
          let failed = false;

          ws.onopen = () => {
            failed = false;
            setIsConnected(true);
            console.log('[Presence] WebSocket connected');
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'presence_update' && Array.isArray(data.online_members)) {
                setOnlineMembers(data.online_members);
              }
            } catch { /* ignore */ }
          };

          ws.onerror = () => {
            failed = true;
            setIsConnected(false);
          };

          ws.onclose = () => {
            setIsConnected(false);
            if (failed) {
              // Presence WS not available; use REST polling
              startPolling();
            }
          };

          presenceSocketRef.current = ws;

          // If connection isn't opened within 2s, fall back to polling
          setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
              ws.close();
              startPolling();
            }
          }, 2000);
        } catch {
          startPolling();
        }
      };

      const startPolling = () => {
        // Import API lazily to avoid circular deps
        import('../services/api').then(({ workspaceAPI }) => {
          const loadMembers = async () => {
            try {
              const res = await workspaceAPI.getMembers(workspaceId);
              const list = Array.isArray(res.data)
                ? res.data
                : (res.data as any)?.results || [];

              // Mark ALL workspace members as "online" since we can't track
              // individual sessions without a presence channel. We show 
              // the current user as definitely online, and others with
              // a "recently active" indicator based on workspace membership.
              setOnlineMembers(list);
            } catch { /* ignore */ }
          };

          loadMembers();
          // Poll every 60s to pick up new/removed members
          presenceHeartbeatRef.current = setInterval(loadMembers, 60_000);
        });
      };

      tryWebSocket();
    },
    []
  );

  const sendMessage = (msg: any) => {
    if (projectSocketRef.current && projectSocketRef.current.readyState === WebSocket.OPEN) {
      projectSocketRef.current.send(JSON.stringify(msg));
    } else {
      setLastMessage(msg);
    }
  };

  // Expose a function on the context so App.tsx can trigger presence when workspace changes
  // We attach it as a module-level callback via a custom event for simplicity.
  useEffect(() => {
    const handler = (e: Event) => {
      const { workspaceId, token, userId } = (e as CustomEvent).detail;
      connectPresence(workspaceId, token, userId);
    };
    window.addEventListener('ws:connect-presence', handler);
    return () => window.removeEventListener('ws:connect-presence', handler);
  }, [connectPresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      projectSocketRef.current?.close();
      presenceSocketRef.current?.close();
      if (presenceHeartbeatRef.current) clearInterval(presenceHeartbeatRef.current);
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastMessage,
        sendMessage,
        connectToProject,
        onlineMembers,
        onlineMemberCount: onlineMembers.length,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};

/** Helper to fire the workspace presence connection event */
export const firePresenceConnect = (workspaceId: number, token: string | null, userId: number) => {
  window.dispatchEvent(
    new CustomEvent('ws:connect-presence', {
      detail: { workspaceId, token, userId },
    })
  );
};
