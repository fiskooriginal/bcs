import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  py: 'python',
  sh: 'shell',
  bash: 'shell',
  js: 'javascript',
  ts: 'typescript',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  html: 'html',
  css: 'css',
};

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TO_LANGUAGE[ext] ?? 'plaintext';
}

interface ScriptEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  language?: string;
  filename?: string;
}

export function ScriptEditor({
  value,
  onChange,
  readOnly = false,
  height = '500px',
  language,
  filename,
}: ScriptEditorProps) {
  const [isLoading, setIsLoading] = useState(true);

  const resolvedLanguage =
    language ?? (filename ? getLanguageFromFilename(filename) : 'python');

  return (
    <div className="border rounded-lg overflow-hidden">
      {isLoading && (
        <div className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <Editor
        height={height}
        language={resolvedLanguage}
        value={value}
        onChange={(newValue) => onChange?.(newValue || '')}
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

export { getLanguageFromFilename };
