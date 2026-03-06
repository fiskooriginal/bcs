export interface Script {
  id: string;
  name: string;
  filename: string;
  description: string | null;
  cron_expression: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScriptUpdate {
  name?: string | null;
  description?: string | null;
  cron_expression?: string | null;
}

export interface ScriptExecution {
  id: string;
  script_id: string;
  status: ExecutionStatus;
  triggered_by: string;
  started_at: string;
  finished_at: string | null;
  exit_code: number | null;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScriptLog {
  id: string;
  execution_id: string;
  level: LogLevel;
  message: string;
  stream: LogStream;
  timestamp: string;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type LogStream = 'stdout' | 'stderr';

export interface WebSocketMessage {
  type: 'log' | 'status' | 'error';
  data: ScriptLog | { status: ExecutionStatus; exit_code?: number } | { message: string };
}

export interface ExecutionUpdateMessage {
  type: 'execution_update';
  data: {
    script_id: string;
    execution_id: string;
    event: string;
    status?: string;
    exit_code?: number;
  };
}
