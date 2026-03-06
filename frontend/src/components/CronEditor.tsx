import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import cronstrue from 'cronstrue';

interface CronEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CronEditor({ value, onChange }: CronEditorProps) {
  const [cronDescription, setCronDescription] = useState('');

  const handleChange = (newValue: string) => {
    onChange(newValue);

    try {
      const description = cronstrue.toString(newValue);
      setCronDescription(description);
    } catch (error) {
      setCronDescription('Invalid cron expression');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cron">Cron Expression</Label>
      <Input
        id="cron"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="0 0 * * * (daily at midnight)"
      />
      {cronDescription && (
        <p className="text-sm text-muted-foreground">{cronDescription}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Format: minute hour day month weekday
      </p>
    </div>
  );
}
