import { useEffect, useRef, useState, useCallback } from 'react';
import type { ScriptLog, WebSocketMessage, ExecutionStatus } from '@/types';

const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

interface UseWebSocketReturn {
  logs: ScriptLog[];
  status: ExecutionStatus | null;
  exitCode: number | null;
  isConnected: boolean;
  error: string | null;
}

export const useWebSocket = (executionId: string | null): UseWebSocketReturn => {
  const [logs, setLogs] = useState<ScriptLog[]>([]);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!executionId) return;

    setLogs([]);
    setStatus(null);
    setExitCode(null);
    setError(null);

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(`${wsUrl}/ws/logs/${executionId}`);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === 'log') {
          setLogs((prev) => [...prev, message.data as ScriptLog]);
        } else if (message.type === 'status') {
          const statusData = message.data as { status: ExecutionStatus; exit_code?: number };
          setStatus(statusData.status);
          if (statusData.exit_code !== undefined) {
            setExitCode(statusData.exit_code);
          }
        } else if (message.type === 'error') {
          const errorData = message.data as { message: string };
          setError(errorData.message);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [executionId]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { logs, status, exitCode, isConnected, error };
};
