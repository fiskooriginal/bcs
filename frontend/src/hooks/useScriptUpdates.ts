import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ExecutionUpdateMessage } from '@/types';

const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

export const useScriptUpdates = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = () => {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(`${wsUrl}/api/ws/updates`);

      ws.onmessage = (event) => {
        try {
          const message: ExecutionUpdateMessage = JSON.parse(event.data);

          if (
            message.type === 'execution_update' &&
            message.data &&
            'script_id' in message.data
          ) {
            const { script_id } = message.data;

            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            queryClient.invalidateQueries({ queryKey: ['scripts', script_id, 'executions'] });
            queryClient.invalidateQueries({ queryKey: ['executions'] });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);
};
