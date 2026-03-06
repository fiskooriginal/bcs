import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Play,
  Pause,
  FileCode,
  Calendar,
  MoreVertical,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useActivateScript, useDeactivateScript, useRunScript } from '@/hooks/useScripts';
import { useScriptExecutions } from '@/hooks/useExecutions';
import type { Script } from '@/types';
import cronstrue from 'cronstrue';
import { ScriptDetailsDialog } from './ScriptDetailsDialog';
import { ExecutionDialog } from './ExecutionDialog';
import { RelativeTime } from './RelativeTime';

interface ScriptCardProps {
  script: Script;
}

export function ScriptCard({ script }: ScriptCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const activateMutation = useActivateScript();
  const deactivateMutation = useDeactivateScript();
  const runMutation = useRunScript();
  const { data: executions } = useScriptExecutions(script.id);

  const handleToggleActive = async () => {
    if (script.is_active) {
      await deactivateMutation.mutateAsync(script.id);
    } else {
      await activateMutation.mutateAsync(script.id);
    }
  };

  const handleRun = async () => {
    const result = await runMutation.mutateAsync(script.id);
    setExecutionId(result.execution_id);
    setShowDetails(false);
  };

  const handleOpenExecution = (execId: string) => {
    setExecutionId(execId);
    setShowDetails(false);
  };

  const cronDescription = script.cron_expression
    ? (() => {
        try {
          return cronstrue.toString(script.cron_expression);
        } catch {
          return script.cron_expression;
        }
      })()
    : 'No schedule';

  const lastExecution = executions?.[0];

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="menu"]')
    ) {
      return;
    }
    setShowDetails(true);
  };

  return (
    <>
      <Card 
        className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-transparent hover:border-l-primary cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <FileCode className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate">{script.name}</span>
                  <span className="text-xs font-mono font-normal text-muted-foreground truncate">
                    {script.filename}
                  </span>
                </div>
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {script.description || 'No description provided'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleToggleActive}
                  disabled={
                    !script.cron_expression ||
                    activateMutation.isPending ||
                    deactivateMutation.isPending
                  }
                >
                  {script.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRun} disabled={runMutation.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{cronDescription}</span>
          </div>

          {lastExecution && (
            <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded border border-border/40 flex-wrap">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground font-medium">Last run:</span>
              <Badge
                variant={
                  lastExecution.status === 'completed'
                    ? 'default'
                    : lastExecution.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
                className={
                  lastExecution.status === 'completed'
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                    : ''
                }
              >
                {lastExecution.status}
              </Badge>
              <RelativeTime
                dateString={lastExecution.started_at}
                className="text-xs text-muted-foreground"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge
              variant={script.is_active ? 'default' : 'secondary'}
              className="font-medium"
            >
              {script.is_active ? '● Active' : '○ Inactive'}
            </Badge>
            <RelativeTime
              dateString={script.updated_at}
              className="text-xs text-muted-foreground"
              prefix="Updated"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-2 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={
              !script.cron_expression ||
              activateMutation.isPending ||
              deactivateMutation.isPending
            }
            className="flex-1"
          >
            {script.is_active ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRun}
            disabled={runMutation.isPending}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
        </CardFooter>
      </Card>

      <ScriptDetailsDialog
        scriptId={showDetails ? script.id : null}
        onOpenChange={(open) => setShowDetails(open)}
        onRun={handleRun}
        onExecutionOpen={handleOpenExecution}
      />

      <ExecutionDialog
        executionId={executionId}
        scriptId={script.id}
        onOpenChange={(open) => {
          if (!open) setExecutionId(null);
        }}
      />
    </>
  );
}
