import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCaptureModal } from "./QuickCaptureModal";

export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-3"
        variant="default"
      >
        <Zap className="h-4 w-4" />
        Quick Capture
      </Button>
      <QuickCaptureModal open={open} onOpenChange={setOpen} />
    </>
  );
}
