import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import cronstrue from 'cronstrue';
import { Clock } from 'lucide-react';

interface CronEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at noon', value: '0 12 * * *' },
  { label: 'Weekly on Monday', value: '0 0 * * 1' },
  { label: 'Monthly on 1st', value: '0 0 1 * *' },
];

export function CronEditor({ value, onChange }: CronEditorProps) {
  const [cronDescription, setCronDescription] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!value) {
      setCronDescription('');
      setIsValid(true);
      return;
    }

    try {
      const description = cronstrue.toString(value);
      setCronDescription(description);
      setIsValid(true);
    } catch (error) {
      setCronDescription('Invalid cron expression');
      setIsValid(false);
    }
  }, [value]);

  const handlePresetSelect = (preset: string) => {
    onChange(preset);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cron">Cron Expression</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="cron"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="0 0 * * * (daily at midnight)"
              className={`pl-10 ${!isValid && value ? 'border-destructive' : ''}`}
            />
          </div>
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Presets" />
            </SelectTrigger>
            <SelectContent>
              {CRON_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {cronDescription && (
          <p
            className={`text-sm ${
              isValid ? 'text-muted-foreground' : 'text-destructive'
            }`}
          >
            {cronDescription}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Format: minute hour day month weekday (e.g., 0 0 * * * = daily at midnight)
        </p>
      </div>

      <div className="rounded-lg bg-muted p-4 space-y-2">
        <p className="text-sm font-medium">Common Examples:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start h-auto py-1"
            onClick={() => handlePresetSelect('0 0 * * *')}
          >
            <code className="mr-2">0 0 * * *</code> - Daily at midnight
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start h-auto py-1"
            onClick={() => handlePresetSelect('0 */6 * * *')}
          >
            <code className="mr-2">0 */6 * * *</code> - Every 6 hours
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start h-auto py-1"
            onClick={() => handlePresetSelect('0 9 * * 1-5')}
          >
            <code className="mr-2">0 9 * * 1-5</code> - Weekdays at 9 AM
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start h-auto py-1"
            onClick={() => handlePresetSelect('0 0 1 * *')}
          >
            <code className="mr-2">0 0 1 * *</code> - First of month
          </Button>
        </div>
      </div>
    </div>
  );
}
