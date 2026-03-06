import { useState, useMemo } from 'react';
import { ScriptList } from './components/ScriptList';
import { CreateScriptDialog } from './components/CreateScriptDialog';
import { ImportScriptDialog } from './components/ImportScriptDialog';
import { Button } from './components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Plus, Upload, FileCode, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { TooltipProvider } from './components/ui/tooltip';
import { useScripts } from './hooks/useScripts';

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { data: scripts } = useScripts();

  const stats = useMemo(() => {
    if (!scripts) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        scheduled: 0,
      };
    }

    return {
      total: scripts.length,
      active: scripts.filter((s) => s.is_active).length,
      inactive: scripts.filter((s) => !s.is_active).length,
      scheduled: scripts.filter((s) => s.cron_expression).length,
    };
  }, [scripts]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileCode className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Python Script Scheduler
                  </h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Manage and automate your Python scripts
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setImportDialogOpen(true)} 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Script
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Total Scripts
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {stats.active}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Inactive
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-amber-600">
                  {stats.inactive}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {stats.scheduled}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Scripts
            </h2>
            <ScriptList />
          </div>
        </main>

        <footer className="border-t mt-auto py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>Python Script Scheduler &copy; {new Date().getFullYear()}</p>
              <div className="flex items-center gap-4">
                <span>Built with FastAPI + React</span>
                <span className="hidden sm:inline">•</span>
                <span>Powered by APScheduler</span>
              </div>
            </div>
          </div>
        </footer>

        <CreateScriptDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
        <ImportScriptDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
