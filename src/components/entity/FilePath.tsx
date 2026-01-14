import { useState, useEffect } from 'react';
import { Copy, FolderOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntityFilePath, useOpenEntityFolder } from '@/hooks/useEntities';
import { useToast } from '@/hooks/use-toast';

interface FilePathProps {
  entityId: string;
}

export function FilePath({ entityId }: FilePathProps) {
  const { data: pathData } = useEntityFilePath(entityId);
  const openFolder = useOpenEntityFolder();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!pathData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pathData.absolutePath);
      setCopied(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy path.', variant: 'destructive' });
    }
  };

  const handleOpenFolder = async () => {
    try {
      await openFolder.mutateAsync(entityId);
    } catch {
      toast({ title: 'Error', description: 'Failed to open folder.', variant: 'destructive' });
    }
  };

  // Convert backslashes to forward slashes for cleaner display
  const displayPath = pathData.relativePath.replace(/\\/g, '/');

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono mt-1">
      <span className="truncate max-w-[300px]" title={pathData.absolutePath}>
        {displayPath}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 hover:text-foreground"
        onClick={handleCopy}
        title="Copy full path"
      >
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 hover:text-foreground"
        onClick={handleOpenFolder}
        title="Open folder in Explorer"
      >
        <FolderOpen className="h-3 w-3" />
      </Button>
    </div>
  );
}
