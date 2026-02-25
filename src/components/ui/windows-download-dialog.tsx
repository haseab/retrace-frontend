"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonitorX } from "lucide-react";

interface WindowsDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WindowsDownloadDialog({
  open,
  onOpenChange,
}: WindowsDownloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MonitorX className="h-5 w-5 text-yellow-400" />
            Only for macOS :(
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            We sensed you&apos;re on a Windows machine. Retrace is currently
            only available for macOS 13+.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Want Windows support sooner?{" "}
          <a
            href="https://retrace.featurebase.app/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Upvote or create a request on Featurebase
          </a>.
        </p>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
