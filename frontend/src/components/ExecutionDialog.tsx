import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { LogViewer } from './LogViewer';
import { Button } from './ui/button';
import { FileCode, Loader2, Square } from 'lucide-react';
import { useScript } from '@/hooks/useScripts';
import { useExecution, useStopExecution } from '@/hooks/useExecutions';

interface ExecutionDialogProps {
  executionId: string | null;
  scriptId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ExecutionDialog({
  executionId,
  scriptId,
  onOpenChange,
}: ExecutionDialogProps) {
  const open = !!executionId;
  const { data: script } = useScript(scriptId || '');
  const { data: execution } = useExecution(executionId || '');
  const stopMutation = useStopExecution(scriptId || undefined);

  const isRunning =
    execution?.status === 'running' || execution?.status === 'pending';

  if (!executionId || !scriptId || !script) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileCode className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle>Live Execution: {script.name}</DialogTitle>
                <DialogDescription>{script.filename}</DialogDescription>
              </div>
            </div>
            {isRunning && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => stopMutation.mutate(executionId)}
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
          </div>
        </DialogHeader>

        <div className="mt-4">
          <LogViewer executionId={executionId} realTime />
        </div>
      </DialogContent>
    </Dialog>
  );
}
