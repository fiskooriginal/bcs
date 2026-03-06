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
import { Textarea } from './ui/textarea';
import { useCreateScript } from '@/hooks/useScripts';
import { Loader2 } from 'lucide-react';

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateScriptDialog({ open, onOpenChange }: CreateScriptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('#!/usr/bin/env python3\n\nprint("Hello, World!")');
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
      setContent('#!/usr/bin/env python3\n\nprint("Hello, World!")');
      setCronExpression('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create script:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Script</DialogTitle>
            <DialogDescription>
              Create a new Python script to schedule and run
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Script Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my_script"
                required
              />
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
              <Label htmlFor="cron">Cron Expression (optional)</Label>
              <Input
                id="cron"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 0 * * * (daily at midnight)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Script Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="print('Hello, World!')"
                className="font-mono text-sm min-h-[200px]"
                required
              />
            </div>
          </div>

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
