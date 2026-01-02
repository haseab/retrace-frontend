"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  text?: string;
  mobileText?: string;
  className?: string;
  showIcon?: boolean;
}

export function DownloadButton({
  text = "Download Retrace v0.1",
  mobileText = "Go on Desktop to Download",
  className = "",
  showIcon = true,
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

      {/* Desktop: Show download button with tooltip */}
      <div className="hidden sm:block w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                size="lg"
                variant="outline"
                disabled
                className={`text-lg px-8 py-6 rounded-xl transition-all border-0 w-full cursor-not-allowed opacity-50 ${className}`}
              >
                {showIcon && <Download className="mr-2 h-5 w-5" />}
                {text}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available Jan 20</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
