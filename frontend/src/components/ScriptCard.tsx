import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Play,
  Pause,
  Trash2,
  Edit,
  FileCode,
  Calendar,
  MoreVertical,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useActivateScript, useDeactivateScript, useDeleteScript, useRunScript } from '@/hooks/useScripts';
import { useScriptExecutions } from '@/hooks/useExecutions';
import type { Script } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import cronstrue from 'cronstrue';
import { ScriptDetailsDialog } from './ScriptDetailsDialog';

interface ScriptCardProps {
  script: Script;
}

export function ScriptCard({ script }: ScriptCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const activateMutation = useActivateScript();
  const deactivateMutation = useDeactivateScript();
  const deleteMutation = useDeleteScript();
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
    await runMutation.mutateAsync(script.id);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${script.name}"?`)) {
      await deleteMutation.mutateAsync(script.id);
    }
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

  return (
    <>
      <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-transparent hover:border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <FileCode className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{script.name}</span>
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
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
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRun} disabled={runMutation.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Last run:</span>
              <Badge
                variant={
                  lastExecution.status === 'completed'
                    ? 'default'
                    : lastExecution.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {lastExecution.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(lastExecution.started_at), { addSuffix: true })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge 
              variant={script.is_active ? 'default' : 'secondary'}
              className="font-medium"
            >
              {script.is_active ? '● Active' : '○ Inactive'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(script.updated_at), { addSuffix: true })}
            </span>
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
        onDelete={handleDelete}
        onRun={handleRun}
      />
    </>
  );
}
