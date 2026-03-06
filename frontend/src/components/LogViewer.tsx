import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useExecutionLogs } from '@/hooks/useExecutions';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ScriptLog } from '@/types';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LogViewerProps {
  executionId: string;
  realTime?: boolean;
}

export function LogViewer({ executionId, realTime = false }: LogViewerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: historicalLogs, isLoading } = useExecutionLogs(executionId);
  const { logs: realtimeLogs, status, exitCode, isConnected } = useWebSocket(
    realTime ? executionId : null
  );

  const logs = realTime ? realtimeLogs : historicalLogs || [];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getLogColor = (log: ScriptLog) => {
    if (log.stream === 'stderr') return 'text-red-500';
    if (log.level === 'error') return 'text-red-500';
    if (log.level === 'warning') return 'text-yellow-500';
    return 'text-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
          <div className="flex items-center gap-2">
            {realTime && (
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Live' : 'Disconnected'}
              </Badge>
            )}
            {status && (
              <Badge
                variant={
                  status === 'completed'
                    ? 'default'
                    : status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {status}
              </Badge>
            )}
            {exitCode !== null && (
              <Badge variant={exitCode === 0 ? 'default' : 'destructive'}>
                Exit Code: {exitCode}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black text-white font-mono text-sm p-4 rounded-lg max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No logs yet...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2 mb-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
                <span className={getLogColor(log)}>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}
