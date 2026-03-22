"use client";

import { Button } from "@/components/ui/button";
import { WindowsDownloadDialog } from "@/components/ui/windows-download-dialog";
import { RETRACE_VERSION_LABEL } from "@/lib/retrace-release";
import { handleDownloadClick, isWindowsMachine } from "@/lib/track-download";
import { useState } from "react";
import { FaApple } from "react-icons/fa";

interface DownloadButtonProps {
  text?: string;
  className?: string;
  showIcon?: boolean;
  source?: string;
}

export function DownloadButton({
  text = `Download (${RETRACE_VERSION_LABEL})`,
  className = "",
  showIcon = true,
  source = "website",
}: DownloadButtonProps) {
  const [showWindowsDialog, setShowWindowsDialog] = useState(false);

  const handleClick = () => {
    if (isWindowsMachine()) {
      setShowWindowsDialog(true);
      return;
    }

    handleDownloadClick(source);
  };

  return (
    <>
      <div className="hidden sm:block w-full">
        <div className="relative">
          <Button
            size="lg"
            variant="outline"
            onClick={handleClick}
            className={`text-lg px-8 py-6 rounded-xl hover:bg-blue-500/10 transition-all border-0 w-full [&_svg]:size-6 ${className}`}
          >
            {showIcon && <FaApple className="mb-1" />}
            {text}
          </Button>
          <div
            className="absolute inset-0 rounded-xl border-2 pointer-events-none animate-pulse"
            style={{ borderColor: "#3b82f6" }}
          />
        </div>
      </div>

      <WindowsDownloadDialog
        open={showWindowsDialog}
        onOpenChange={setShowWindowsDialog}
      />
    </>
  );
}
