"use client";

import { Button } from "@/components/ui/button";
import { handleDownloadClick } from "@/lib/track-download";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  text?: string;
  mobileText?: string;
  className?: string;
  showIcon?: boolean;
  source?: string;
}

export function DownloadButton({
  text = "Download Retrace v0.6.0",
  mobileText = "Go on Desktop to Download",
  className = "",
  showIcon = true,
  source = "website",
}: DownloadButtonProps) {
  return (
    <>
      {/* Mobile: Show simplified message */}
      <div className="sm:hidden w-full">
        <Button
          size="lg"
          variant="outline"
          disabled
          className={`text-base px-6 py-6 rounded-xl transition-all border-0 w-full cursor-not-allowed opacity-50 ${className}`}
        >
          {mobileText}
        </Button>
      </div>

      {/* Desktop: Show download button with glowing border */}
      <div className="hidden sm:block w-full">
        <div className="relative">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleDownloadClick(source)}
            className={`text-lg px-8 py-6 rounded-xl hover:bg-blue-500/10 transition-all border-0 w-full ${className}`}
          >
            {showIcon && <Download className="mr-2 h-5 w-5" />}
            {text}
          </Button>
          <div
            className="absolute inset-0 rounded-xl border-2 pointer-events-none animate-pulse"
            style={{ borderColor: "#3b82f6" }}
          />
        </div>
      </div>
    </>
  );
}
