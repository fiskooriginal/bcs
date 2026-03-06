import { useState, useMemo } from 'react';
import { useScripts } from '@/hooks/useScripts';
import { ScriptCard } from './ScriptCard';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Search } from 'lucide-react';

type SortOption = 'name-asc' | 'name-desc' | 'updated-asc' | 'updated-desc' | 'active-first';
type FilterOption = 'all' | 'active' | 'inactive';

export function ScriptList() {
  const { data: scripts, isLoading, error } = useScripts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredAndSortedScripts = useMemo(() => {
    if (!scripts) return [];

    let filtered = [...scripts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (script) =>
          script.name.toLowerCase().includes(search) ||
          script.description?.toLowerCase().includes(search) ||
          script.filename.toLowerCase().includes(search)
      );
    }

    if (filterBy === 'active') {
      filtered = filtered.filter((s) => s.is_active);
    } else if (filterBy === 'inactive') {
      filtered = filtered.filter((s) => !s.is_active);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'updated-asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'updated-desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'active-first':
          if (a.is_active === b.is_active) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          return a.is_active ? -1 : 1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [scripts, searchTerm, sortBy, filterBy]);

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
        <p className="text-destructive font-medium">Failed to load scripts</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts by name, description, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scripts</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated-desc">Recently Updated</SelectItem>
              <SelectItem value="updated-asc">Least Recently Updated</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="active-first">Active First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!scripts || scripts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/30">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No scripts yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Create your first script to get started with automation
          </p>
        </div>
      ) : filteredAndSortedScripts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/30">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No scripts found</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Try adjusting your search or filters to find what you're looking for
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in">
            {filteredAndSortedScripts.map((script) => (
              <ScriptCard key={script.id} script={script} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
              Showing {filteredAndSortedScripts.length} of {scripts.length} script{scripts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
