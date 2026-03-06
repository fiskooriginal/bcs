import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useExecutionLogs } from '@/hooks/useExecutions';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ScriptLog } from '@/types';
import { Loader2, Search, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface LogViewerProps {
  executionId: string;
  realTime?: boolean;
}

export function LogViewer({ executionId, realTime = false }: LogViewerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: historicalLogs, isLoading, refetch } = useExecutionLogs(executionId);
  const { logs: realtimeLogs, status, exitCode, isConnected } = useWebSocket(
    realTime ? executionId : null
  );

  const logs = realTime ? realtimeLogs : historicalLogs || [];

  const filteredLogs = searchTerm
    ? logs.filter((log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleDownload = () => {
    const logText = logs
      .map(
        (log) =>
          `[${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}] [${log.level.toUpperCase()}] ${log.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getLogColor = (log: ScriptLog) => {
    if (log.stream === 'stderr') return 'text-red-400';
    if (log.level === 'error') return 'text-red-400';
    if (log.level === 'warning') return 'text-yellow-400';
    return 'text-gray-300';
  };

  const getLogIcon = (log: ScriptLog) => {
    if (log.level === 'error' || log.stream === 'stderr') return '✗';
    if (log.level === 'warning') return '⚠';
    return '•';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Execution Logs</CardTitle>
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>

            {!realTime && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Refresh logs"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              disabled={logs.length === 0}
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant={autoScroll ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              Auto-scroll
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black text-white font-mono text-sm p-4 rounded-lg max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground">
              {searchTerm ? 'No matching logs found' : 'No logs yet...'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex gap-3 hover:bg-gray-900/50 px-2 py-1 rounded">
                  <span className="text-gray-500 text-xs whitespace-nowrap flex-shrink-0 w-[140px]">
                    {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                  </span>
                  <span className={`flex-shrink-0 ${getLogColor(log)}`}>
                    {getLogIcon(log)}
                  </span>
                  <span className={`break-all ${getLogColor(log)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div ref={logsEndRef} />
        </div>

        {logs.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground text-right">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'log entry' : 'log entries'}
            {searchTerm && ` (filtered from ${logs.length})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
