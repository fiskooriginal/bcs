import { useScripts } from '@/hooks/useScripts';
import { ScriptCard } from './ScriptCard';
import { Loader2 } from 'lucide-react';

export function ScriptList() {
  const { data: scripts, isLoading, error } = useScripts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load scripts</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!scripts || scripts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No scripts yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first script to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scripts.map((script) => (
        <ScriptCard key={script.id} script={script} />
      ))}
    </div>
  );
}
