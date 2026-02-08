const DOWNLOAD_URL = "https://cdn.retrace.to/Retrace-v0.6.0.dmg";

export function trackDownload(source: string) {
  // Collect browser/system info
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const referrer = document.referrer;

  // Parse OS info from user agent
  let os = "Unknown";
  let osVersion = "";
  if (userAgent.includes("Mac OS X")) {
    os = "macOS";
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (match) osVersion = match[1].replace(/_/g, ".");
  } else if (userAgent.includes("Windows")) {
    os = "Windows";
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) osVersion = match[1];
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  }

  // Parse browser info
  let browser = "Unknown";
  let browserVersion = "";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  // Check for Apple Silicon vs Intel
  let architecture = "Unknown";
  if (os === "macOS") {
    // Can't reliably detect, but we can check for ARM hints
    if (userAgent.includes("ARM") || platform === "MacIntel") {
      architecture = "Apple Silicon (likely)";
    }
  }

  // Fire non-blocking request
  fetch("/api/downloads/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version: "0.6.0",
      source,
      timestamp: new Date().toISOString(),
      os,
      osVersion,
      browser,
      browserVersion,
      architecture,
      platform,
      language,
      screenResolution,
      timezone,
      referrer,
      userAgent,
    }),
  }).catch(() => {
    // Silently fail - don't block download
  });
}

export function handleDownloadClick(source: string) {
  trackDownload(source);
  window.location.href = DOWNLOAD_URL;
}

export { DOWNLOAD_URL };
