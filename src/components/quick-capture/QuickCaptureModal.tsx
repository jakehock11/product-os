import { useState } from "react";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProductContext } from "@/contexts/ProductContext";
import { useCreateEntity } from "@/hooks/useEntities";
import { useToast } from "@/hooks/use-toast";

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCaptureModal({ open, onOpenChange }: QuickCaptureModalProps) {
  const [content, setContent] = useState("");
  const { currentProductId } = useProductContext();
  const createEntity = useCreateEntity();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || !currentProductId) return;

    try {
      await createEntity.mutateAsync({
        type: "quick_capture",
        productId: currentProductId,
        title: content.slice(0, 100),
        body: content,
      });

      toast({
        title: "Captured!",
        description: "Your thought has been saved.",
      });

      setContent("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save capture.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4 text-primary" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought, observation, or idea..."
            className="min-h-[150px] resize-none text-sm"
            autoFocus
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press ⌘+Enter to save
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || createEntity.isPending}
              >
                {createEntity.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
