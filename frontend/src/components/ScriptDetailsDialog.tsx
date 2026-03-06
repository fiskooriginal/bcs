import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CronEditor } from './CronEditor';
import { LogViewer } from './LogViewer';
import {
  useScript,
  useUpdateScript,
  useActivateScript,
  useDeactivateScript,
} from '@/hooks/useScripts';
import { useScriptExecutions } from '@/hooks/useExecutions';
import { Loader2, Save, Play, Pause, FileCode } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatRelativeTime } from '@/lib/date-utils';

interface ScriptDetailsDialogProps {
  scriptId: string | null;
  onOpenChange: (open: boolean) => void;
  onRun?: () => void;
  onExecutionOpen?: (executionId: string) => void;
}

export function ScriptDetailsDialog({
  scriptId,
  onOpenChange,
  onRun,
  onExecutionOpen,
}: ScriptDetailsDialogProps) {
  const open = !!scriptId;
  const { data: script } = useScript(scriptId || '');
  const { data: executions } = useScriptExecutions(scriptId || '');

  const [cronExpression, setCronExpression] = useState('');
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());

  const updateMutation = useUpdateScript();
  const activateMutation = useActivateScript();
  const deactivateMutation = useDeactivateScript();

  useEffect(() => {
    if (script) {
      setCronExpression(script.cron_expression || '');
    }
  }, [script]);

  useEffect(() => {
    if (executions && executions.length > 0) {
      setExpandedExecutions(new Set([executions[0].id]));
    }
  }, [executions]);

  const handleSaveCron = async () => {
    if (!scriptId) return;

    try {
      await updateMutation.mutateAsync({
        id: scriptId,
        data: { cron_expression: cronExpression || null },
      });
    } catch (error) {
      console.error('Failed to update cron expression:', error);
    }
  };

  const handleToggleActive = async () => {
    if (!scriptId) return;

    try {
      if (script?.is_active) {
        await deactivateMutation.mutateAsync(scriptId);
      } else {
        await activateMutation.mutateAsync(scriptId);
      }
    } catch (error) {
      console.error('Failed to toggle script activation:', error);
    }
  };

  const toggleExecution = (executionId: string) => {
    setExpandedExecutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const hasCronChanges = script && cronExpression !== (script.cron_expression || '');

  if (!scriptId || !script) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle>{script.name}</DialogTitle>
                <DialogDescription>{script.filename}</DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={script.is_active ? 'default' : 'secondary'}>
                {script.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {onRun && (
                <Button size="sm" onClick={onRun}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="executions" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="executions">
              Executions
              {executions && executions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {executions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="space-y-4 mt-4">
            {!executions || executions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No execution history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Run this script to see execution logs
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div 
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleExecution(execution.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              execution.status === 'completed'
                                ? 'default'
                                : execution.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {execution.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {execution.triggered_by}
                          </span>
                          {execution.exit_code !== null && (
                            <Badge
                              variant={execution.exit_code === 0 ? 'default' : 'destructive'}
                            >
                              Exit: {execution.exit_code}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(execution.started_at)}
                          </span>
                          {onExecutionOpen && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExecutionOpen(execution.id);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Open Live View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedExecutions.has(execution.id) && (
                      <div className="border-t bg-muted/20 p-4">
                        <LogViewer
                          executionId={execution.id}
                          realTime={execution.status === 'running' || execution.status === 'pending'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-4">
            <CronEditor value={cronExpression} onChange={setCronExpression} />

            <div className="flex items-center justify-between pt-4 border-t gap-3">
              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={
                  !cronExpression ||
                  activateMutation.isPending ||
                  deactivateMutation.isPending
                }
              >
                {activateMutation.isPending || deactivateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : script.is_active ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {script.is_active ? 'Deactivate' : 'Activate'}
              </Button>

              <Button
                onClick={handleSaveCron}
                disabled={!hasCronChanges || updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
