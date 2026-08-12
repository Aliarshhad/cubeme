import { Download, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hasInstallPrompt,
  isIos,
  isStandalone,
  subscribeInstallState,
  triggerInstallPrompt,
} from "@/lib/install";

/** "Install Cube" row — hidden only once Cube runs as an installed app. */
export function InstallCubeRow() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setIos(isIos());
    setShow(!isStandalone());
    return subscribeInstallState(() => {
      setShow(!isStandalone());
      setTick((t) => t + 1);
    });
  }, []);

  if (!show) return null;

  const onClick = async () => {
    if (ios || !hasInstallPrompt()) {
      setGuideOpen(true);
      return;
    }
    const outcome = await triggerInstallPrompt();
    if (outcome === "unavailable") setGuideOpen(true);
    else if (outcome === "accepted") toast.success("Cube is being added to your home screen");
  };

  return (
    <>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-3xl glass-soft px-5 py-4 text-left transition-colors hover:bg-foreground/5"
      >
        <Download className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Install Cube</span>
          <span className="block text-xs text-muted-foreground">
            Add Cube to your home screen and open it like an app
          </span>
        </span>
      </button>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Cube to your home screen</DialogTitle>
            <DialogDescription>
              {ios
                ? "Safari installs apps manually — two taps and you're done."
                : "Your browser didn't offer an install prompt, so add it from the browser menu."}
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                Tap the <strong>Share</strong> icon {ios ? "at the bottom of Safari" : "or menu"}.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <SquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                Choose <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                Tap <strong>Add</strong> — Cube appears with its own icon.
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
