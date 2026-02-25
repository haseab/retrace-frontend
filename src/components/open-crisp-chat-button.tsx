"use client";

import { useEffect, useState } from "react";
import type { ButtonHTMLAttributes } from "react";

interface OpenCrispChatButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  openLabel?: string;
  closeLabel?: string;
}

export function OpenCrispChatButton({
  openLabel = "Launch Live Chat",
  closeLabel = "Close Live Chat",
  ...props
}: OpenCrispChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.$crisp = window.$crisp || [];
    const handleOpened = () => setIsOpen(true);
    const handleClosed = () => setIsOpen(false);

    window.$crisp.push(["on", "chat:opened", handleOpened]);
    window.$crisp.push(["on", "chat:closed", handleClosed]);

    const syncState = () => {
      const crisp = window.$crisp as any;
      if (crisp && typeof crisp.is === "function") {
        setIsOpen(Boolean(crisp.is("chat:opened")));
        return true;
      }
      return false;
    };

    if (syncState()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (syncState()) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleToggleChat = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.$crisp = window.$crisp || [];

    if (isOpen) {
      window.$crisp.push(["do", "chat:close"]);
      setIsOpen(false);
      return;
    }

    window.$crisp.push(["do", "chat:show"]);
    window.$crisp.push(["do", "chat:open"]);
    setIsOpen(true);
  };

  return (
    <button type="button" {...props} onClick={handleToggleChat}>
      {isOpen ? closeLabel : openLabel}
    </button>
  );
}
