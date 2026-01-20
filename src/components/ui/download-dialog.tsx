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
import { handleDownloadClick } from "@/lib/track-download";
import { AlertTriangle, Download, Settings, Shield } from "lucide-react";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
}

export function DownloadDialog({
  open,
  onOpenChange,
  source,
}: DownloadDialogProps) {
  const handleDownload = () => {
    handleDownloadClick(source);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Quick Setup Required
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Retrace is not yet notarized by Apple (it's in progress!). You'll
            need to manually approve it if you want to download it now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 space-y-4">
            <p className="font-medium text-sm">
              After opening the app, if you see "App can't be opened":
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                  1
                </div>
                <div className="text-sm">
                  <p>
                    Open <strong>System Settings</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                  2
                </div>
                <div className="text-sm flex items-center gap-2">
                  <p>Go to</p>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2 py-1 border">
                    <Shield className="h-4 w-4" />
                    <span>Privacy & Security</span>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                  3
                </div>
                <div className="text-sm">
                  <p>
                    Scroll down to the <strong>Security</strong> section
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                  4
                </div>
                <div className="text-sm">
                  <p>
                    Click <strong>"Open Anyway"</strong> next to the Retrace
                    message
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings className="h-4 w-4" />
            <p>
              This is a one-time setup. Apple notarization is in progress and
              will be available soon.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
