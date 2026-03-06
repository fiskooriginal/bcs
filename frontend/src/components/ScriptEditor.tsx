import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function ScriptEditor({
  value,
  onChange,
  readOnly = false,
  height = '500px',
}: ScriptEditorProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      {isLoading && (
        <div className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <Editor
        height={height}
        defaultLanguage="python"
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        onMount={() => setIsLoading(false)}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
        }}
        theme="vs-dark"
      />
    </div>
  );
}
