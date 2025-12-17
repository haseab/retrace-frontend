"use client";

import { useEffect } from "react";

export function CrispChat() {
  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "95e35a9d-15cb-4bb8-9f5b-db005155a5c2";

    // Create and append script
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.getElementsByTagName("head")[0].appendChild(script);

    // Cleanup function
    return () => {
      // Remove Crisp on component unmount
      const crispScript = document.querySelector(
        'script[src="https://client.crisp.chat/l.js"]'
      );
      if (crispScript) {
        crispScript.remove();
      }
      // Clean up global variables
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, []);

  return null;
}

// Type declarations for TypeScript
declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}
