import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { LogViewer } from './LogViewer';
import { FileCode } from 'lucide-react';
import { useScript } from '@/hooks/useScripts';

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

  if (!executionId || !scriptId || !script) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileCode className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>Live Execution: {script.name}</DialogTitle>
              <DialogDescription>{script.filename}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <LogViewer executionId={executionId} realTime />
        </div>
      </DialogContent>
    </Dialog>
  );
}
