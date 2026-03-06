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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useActivateScript, useDeactivateScript, useDeleteScript, useRunScript } from '@/hooks/useScripts';
import type { Script } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import cronstrue from 'cronstrue';

interface ScriptCardProps {
  script: Script;
}

export function ScriptCard({ script }: ScriptCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const activateMutation = useActivateScript();
  const deactivateMutation = useDeactivateScript();
  const deleteMutation = useDeleteScript();
  const runMutation = useRunScript();

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              {script.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {script.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{cronDescription}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={script.is_active ? 'default' : 'secondary'}>
            {script.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(script.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleActive}
          disabled={activateMutation.isPending || deactivateMutation.isPending}
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
        >
          <Play className="mr-2 h-4 w-4" />
          Run
        </Button>
      </CardFooter>
    </Card>
  );
}
