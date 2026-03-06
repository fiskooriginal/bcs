import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScriptEditor } from './ScriptEditor';
import { CronEditor } from './CronEditor';
import { useCreateScript } from '@/hooks/useScripts';
import { Loader2 } from 'lucide-react';

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SCRIPT = `#!/usr/bin/env python3

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`;

export function CreateScriptDialog({ open, onOpenChange }: CreateScriptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState(DEFAULT_SCRIPT);
  const [cronExpression, setCronExpression] = useState('');

  const createMutation = useCreateScript();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        name,
        content,
        description: description || undefined,
        cron_expression: cronExpression || undefined,
      });

      setName('');
      setDescription('');
      setContent(DEFAULT_SCRIPT);
      setCronExpression('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create script:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Script</DialogTitle>
            <DialogDescription>
              Create a new Python script with optional cron scheduling
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Script Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my_script"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Will be saved as {name || 'my_script'}.py
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this script do?"
                />
              </div>

              <div className="space-y-2">
                <Label>Script Content *</Label>
                <ScriptEditor
                  value={content}
                  onChange={setContent}
                  height="400px"
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <CronEditor
                value={cronExpression}
                onChange={setCronExpression}
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to run manually only. You can activate the schedule after creating the script.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Script
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
