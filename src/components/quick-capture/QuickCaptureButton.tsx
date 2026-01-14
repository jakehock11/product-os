import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";

export function QuickCaptureButton() {
  const { open } = useQuickCapture();

  return (
    <Button
      onClick={open}
      className="w-full justify-start gap-2.5 h-8 text-[13px] shadow-sm"
      variant="default"
    >
      <Zap className="h-3.5 w-3.5" />
      Capture
    </Button>
  );
}
