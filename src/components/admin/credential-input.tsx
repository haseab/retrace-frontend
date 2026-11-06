"use client";

import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";

type CredentialInputProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "autoFocus">;

export function CredentialInput(props: CredentialInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Chrome app windows can retain macOS Secure Input while a password field
    // stays focused in the background. Release focus without revealing its value.
    const releaseFocus = () => {
      if (document.activeElement === input) {
        input.blur();
      }
    };
    const releaseFocusWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        releaseFocus();
      }
    };
    const form = input.form;

    window.addEventListener("blur", releaseFocus);
    window.addEventListener("pagehide", releaseFocus);
    document.addEventListener("visibilitychange", releaseFocusWhenHidden);
    form?.addEventListener("submit", releaseFocus);

    return () => {
      // Blur before React removes the field after successful authentication.
      releaseFocus();
      window.removeEventListener("blur", releaseFocus);
      window.removeEventListener("pagehide", releaseFocus);
      document.removeEventListener("visibilitychange", releaseFocusWhenHidden);
      form?.removeEventListener("submit", releaseFocus);
    };
  }, []);

  return <input {...props} ref={inputRef} type="password" />;
}
