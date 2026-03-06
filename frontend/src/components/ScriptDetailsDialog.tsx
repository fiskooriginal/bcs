import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CronEditor } from './CronEditor';
import { LogViewer } from './LogViewer';
import { ScriptEditor } from './ScriptEditor';
import {
  useScript,
  useScriptContent,
  useUpdateScript,
  useActivateScript,
  useDeactivateScript,
} from '@/hooks/useScripts';
import {
  useScriptExecutionsInfinite,
  useScriptExecutionsCount,
  useStopExecution,
} from '@/hooks/useExecutions';
import { Loader2, Save, Play, Pause, FileCode, Copy, Check, Square } from 'lucide-react';
import { Badge } from './ui/badge';
import { RelativeTime } from './RelativeTime';

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
  const { data: content, isLoading: isContentLoading } = useScriptContent(
    scriptId || ''
  );
  const {
    data: executionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isExecutionsLoading,
  } = useScriptExecutionsInfinite(scriptId || '');

  const { data: executionsCountData } = useScriptExecutionsCount(scriptId || '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const executions = executionsData?.pages.flatMap((p) => p) ?? [];
  const latestExecution = executions[0];
  const pastExecutions = executions.slice(1);

  const handleCopyCode = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const updateMutation = useUpdateScript();
  const activateMutation = useActivateScript();
  const deactivateMutation = useDeactivateScript();
  const stopMutation = useStopExecution(scriptId || undefined);

  useEffect(() => {
    if (script) {
      setName(script.name || '');
      setDescription(script.description || '');
      setCronExpression(script.cron_expression || '');
    }
  }, [script]);

  const loadMoreCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || !scrollContainerRef.current || !hasNextPage || isFetchingNextPage) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            fetchNextPage();
          }
        },
        {
          root: scrollContainerRef.current,
          threshold: 0.1,
          rootMargin: '100px',
        }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleSaveDetails = async () => {
    if (!scriptId || !name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: scriptId,
        data: {
          name: name.trim(),
          description: description.trim() || null,
        },
      });
    } catch (error) {
      console.error('Failed to update script details:', error);
    }
  };

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

  const hasDetailsChanges =
    script &&
    (name.trim() !== (script.name || '') || description !== (script.description || ''));
  const isDetailsValid = name.trim().length > 0;
  const hasCronChanges = script && cronExpression !== (script.cron_expression || '');

  if (!scriptId || !script) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={scrollContainerRef}
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle>{name || script.name}</DialogTitle>
                <DialogDescription>{script.filename}</DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={script.is_active ? 'default' : 'secondary'}>
                {script.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleActive}
                disabled={
                  !script.cron_expression ||
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
              {onRun && (
                <Button size="sm" onClick={onRun}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="executions">
              Executions
              {executionsCountData && executionsCountData.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {executionsCountData.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script-name">Name</Label>
                <Input
                  id="script-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Script display name"
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  Names may be duplicated; filename is unique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="script-description">Description</Label>
                <Textarea
                  id="script-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Filename</Label>
                <Input value={script.filename} disabled className="font-mono" />
                <p className="text-xs text-muted-foreground">
                  File path (read-only)
                </p>
              </div>

              <Button
                onClick={handleSaveDetails}
                disabled={
                  !hasDetailsChanges ||
                  !isDetailsValid ||
                  updateMutation.isPending
                }
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Details
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {script.filename}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={isContentLoading || !content}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy all
                  </>
                )}
              </Button>
            </div>

            {isContentLoading ? (
              <div className="flex items-center justify-center border rounded-lg h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScriptEditor
                value={content ?? ''}
                readOnly
                height="400px"
                filename={script.filename}
              />
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4 mt-4">
            {isExecutionsLoading ? (
              <div className="flex justify-center py-12 border-2 border-dashed rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !executions || executions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No execution history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Run this script to see execution logs
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {latestExecution && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Last run
                    </h3>
                    <div className="border rounded-lg overflow-hidden bg-muted/20">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                              variant={
                                latestExecution.status === 'completed'
                                  ? 'default'
                                  : latestExecution.status === 'failed'
                                  ? 'destructive'
                                  : latestExecution.status === 'cancelled'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {latestExecution.status}
                            </Badge>
                            <span className="text-sm font-medium">
                              {latestExecution.triggered_by}
                            </span>
                            {latestExecution.exit_code !== null && (
                              <Badge
                                variant={
                                  latestExecution.exit_code === 0 ? 'default' : 'destructive'
                                }
                              >
                                Exit: {latestExecution.exit_code}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <RelativeTime
                              dateString={latestExecution.started_at}
                              className="text-sm text-muted-foreground"
                            />
                            {(latestExecution.status === 'running' ||
                              latestExecution.status === 'pending') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => stopMutation.mutate(latestExecution.id)}
                                disabled={stopMutation.isPending}
                              >
                                {stopMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Square className="h-4 w-4 mr-2" />
                                )}
                                Stop
                              </Button>
                            )}
                            {onExecutionOpen && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onExecutionOpen(latestExecution.id)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Open Live View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t bg-muted/30 p-4">
                        <LogViewer
                          executionId={latestExecution.id}
                          realTime={
                            latestExecution.status === 'running' ||
                            latestExecution.status === 'pending'
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {pastExecutions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Past runs
                    </h3>
                    <div className="space-y-2">
                      {pastExecutions.map((execution) => (
                        <div
                          key={execution.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div
                            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => toggleExecution(execution.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge
                                  variant={
                                    execution.status === 'completed'
                                      ? 'default'
                                      : execution.status === 'failed'
                                      ? 'destructive'
                                      : execution.status === 'cancelled'
                                      ? 'outline'
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
                                    variant={
                                      execution.exit_code === 0 ? 'default' : 'destructive'
                                    }
                                  >
                                    Exit: {execution.exit_code}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <RelativeTime
                                  dateString={execution.started_at}
                                  className="text-sm text-muted-foreground"
                                />
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
                                realTime={
                                  execution.status === 'running' ||
                                  execution.status === 'pending'
                                }
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {hasNextPage && (
                        <div
                          ref={loadMoreCallbackRef}
                          className="flex justify-center py-4"
                        >
                          {isFetchingNextPage && (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
