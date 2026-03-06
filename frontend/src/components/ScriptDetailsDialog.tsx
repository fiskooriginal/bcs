import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScriptEditor } from './ScriptEditor';
import { CronEditor } from './CronEditor';
import { LogViewer } from './LogViewer';
import {
  useScript,
  useScriptContent,
  useUpdateScript,
  useUpdateScriptContent,
} from '@/hooks/useScripts';
import { useScriptExecutions } from '@/hooks/useExecutions';
import { Loader2, Save, Play, Trash2, FileCode } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ScriptDetailsDialogProps {
  scriptId: string | null;
  onOpenChange: (open: boolean) => void;
  onDelete?: (scriptId: string) => void;
  onRun?: (scriptId: string) => void;
}

export function ScriptDetailsDialog({
  scriptId,
  onOpenChange,
  onDelete,
  onRun,
}: ScriptDetailsDialogProps) {
  const open = !!scriptId;
  const { data: script } = useScript(scriptId || '');
  const { data: content } = useScriptContent(scriptId || '');
  const { data: executions } = useScriptExecutions(scriptId || '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const updateMutation = useUpdateScript();
  const updateContentMutation = useUpdateScriptContent();

  useEffect(() => {
    if (script) {
      setName(script.name);
      setDescription(script.description || '');
      setCronExpression(script.cron_expression || '');
    }
  }, [script]);

  useEffect(() => {
    if (content) {
      setScriptContent(content);
    }
  }, [content]);

  const handleSaveMetadata = async () => {
    if (!scriptId) return;

    try {
      await updateMutation.mutateAsync({
        id: scriptId,
        data: {
          name,
          description: description || undefined,
          cron_expression: cronExpression || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to update script metadata:', error);
    }
  };

  const handleSaveContent = async () => {
    if (!scriptId) return;

    try {
      await updateContentMutation.mutateAsync({
        id: scriptId,
        content: scriptContent,
      });
    } catch (error) {
      console.error('Failed to update script content:', error);
    }
  };

  const hasMetadataChanges =
    script &&
    (name !== script.name ||
      description !== (script.description || '') ||
      cronExpression !== (script.cron_expression || ''));

  const hasContentChanges = content && scriptContent !== content;

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
                <Button
                  size="sm"
                  onClick={() => onRun(scriptId)}
                  disabled={!scriptId}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete "${script.name}"?`)) {
                      onDelete(scriptId);
                      onOpenChange(false);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="editor" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="executions">
              Execution History
              {executions && executions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {executions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Edit your Python script below
              </p>
              <Button
                onClick={handleSaveContent}
                disabled={!hasContentChanges || updateContentMutation.isPending}
              >
                {updateContentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Code
              </Button>
            </div>
            <ScriptEditor
              value={scriptContent}
              onChange={setScriptContent}
              height="600px"
            />
            {hasContentChanges && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                You have unsaved changes
              </p>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Script Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my_script"
                />
                <p className="text-xs text-muted-foreground">
                  Will be saved as {name || 'my_script'}.py
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this script do?"
                />
              </div>

              <CronEditor value={cronExpression} onChange={setCronExpression} />

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  {hasMetadataChanges && (
                    <span className="text-yellow-600 dark:text-yellow-500">
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveMetadata}
                  disabled={!hasMetadataChanges || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>

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
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedExecutionId(execution.id)}
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
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(execution.started_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedExecutionId && (
          <Dialog
            open={!!selectedExecutionId}
            onOpenChange={() => setSelectedExecutionId(null)}
          >
            <DialogContent className="max-w-5xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Execution Logs</DialogTitle>
              </DialogHeader>
              <LogViewer executionId={selectedExecutionId} realTime={false} />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
