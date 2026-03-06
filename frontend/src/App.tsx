import { useState } from 'react';
import { ScriptList } from './components/ScriptList';
import { CreateScriptDialog } from './components/CreateScriptDialog';
import { ImportScriptDialog } from './components/ImportScriptDialog';
import { Button } from './components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Python Script Scheduler</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and schedule your Python scripts
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setImportDialogOpen(true)} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Script
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Script
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ScriptList />
        </main>

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
