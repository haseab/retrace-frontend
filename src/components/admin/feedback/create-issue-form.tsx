"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { FeedbackType } from "@/lib/types/feedback";
import { authFetch } from "@/lib/client-api";

const FEEDBACK_TYPE_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
  { value: "Bug Report", label: "Bug" },
  { value: "Feature Request", label: "Feature" },
  { value: "Question", label: "Question" },
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

interface CreateIssueFormProps {
  onCreated: () => Promise<void> | void;
  onCancel: () => void;
}

interface FeedbackSubmissionPayload {
  type: FeedbackType;
  email?: string;
  description: string;
  externalSource?: "app" | "manual" | "github" | "featurebase";
  externalId?: string;
  externalUrl?: string;
  diagnostics: {
    appVersion: string;
    buildNumber: string;
    macOSVersion: string;
    deviceModel: string;
    totalDiskSpace: string;
    freeDiskSpace: string;
    databaseStats: {
      sessionCount: number;
      frameCount: number;
      segmentCount: number;
      databaseSizeMB: number;
    };
    settingsSnapshot: Record<string, unknown>;
    recentErrors: string[];
    recentLogs: string[];
    timestamp: string;
    displayInfo: {
      count: number;
      displays: Array<{
        index: number;
        resolution: string;
        backingScaleFactor: string;
        colorSpace: string;
        refreshRate: string;
        isRetina: boolean;
        frame: string;
      }>;
      mainDisplayIndex: number;
    };
    processInfo: {
      totalRunning: number;
      eventMonitoringApps: number;
      windowManagementApps: number;
      securityApps: number;
      hasJamf: boolean;
      hasKandji: boolean;
      axuiServerCPU: number;
      windowServerCPU: number;
    };
    accessibilityInfo: {
      voiceOverEnabled: boolean;
      switchControlEnabled: boolean;
      reduceMotionEnabled: boolean;
      increaseContrastEnabled: boolean;
      reduceTransparencyEnabled: boolean;
      differentiateWithoutColorEnabled: boolean;
      displayHasInvertedColors: boolean;
    };
    performanceInfo: {
      cpuUsagePercent: number;
      memoryUsedGB: number;
      memoryTotalGB: number;
      memoryPressure: string;
      swapUsedGB: number;
      thermalState: string;
      processorCount: number;
      isLowPowerModeEnabled: boolean;
      powerSource: string;
      batteryLevel: number | null;
    };
    emergencyCrashReports: string[];
  };
  includeScreenshot: boolean;
  screenshotData?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read selected image."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode selected image."));
    image.src = src;
  });
}

async function normalizeImageToPngBase64(file: File): Promise<string> {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("Could not process selected image.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image conversion is not available in this browser.");
  }

  context.drawImage(image, 0, 0);
  const pngDataUrl = canvas.toDataURL("image/png");
  const commaIndex = pngDataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid PNG image data.");
  }

  return pngDataUrl.slice(commaIndex + 1);
}

function toImageSizeLabel(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildDiagnostics(timestamp: string): FeedbackSubmissionPayload["diagnostics"] {
  return {
    appVersion: "internal-dashboard",
    buildNumber: "manual-entry",
    macOSVersion: "unknown",
    deviceModel: "unknown",
    totalDiskSpace: "unknown",
    freeDiskSpace: "unknown",
    databaseStats: {
      sessionCount: 0,
      frameCount: 0,
      segmentCount: 0,
      databaseSizeMB: 0,
    },
    settingsSnapshot: {},
    recentErrors: [],
    recentLogs: [],
    timestamp,
    displayInfo: {
      count: 0,
      displays: [],
      mainDisplayIndex: 0,
    },
    processInfo: {
      totalRunning: 0,
      eventMonitoringApps: 0,
      windowManagementApps: 0,
      securityApps: 0,
      hasJamf: false,
      hasKandji: false,
      axuiServerCPU: 0,
      windowServerCPU: 0,
    },
    accessibilityInfo: {
      voiceOverEnabled: false,
      switchControlEnabled: false,
      reduceMotionEnabled: false,
      increaseContrastEnabled: false,
      reduceTransparencyEnabled: false,
      differentiateWithoutColorEnabled: false,
      displayHasInvertedColors: false,
    },
    performanceInfo: {
      cpuUsagePercent: 0,
      memoryUsedGB: 0,
      memoryTotalGB: 0,
      memoryPressure: "unknown",
      swapUsedGB: 0,
      thermalState: "unknown",
      processorCount: 0,
      isLowPowerModeEnabled: false,
      powerSource: "unknown",
      batteryLevel: null,
    },
    emergencyCrashReports: [],
  };
}

export function CreateIssueForm({ onCreated, onCancel }: CreateIssueFormProps) {
  const [type, setType] = useState<FeedbackType>("Bug Report");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearImage = () => {
    setScreenshotData(null);
    setScreenshotFileName(null);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      clearImage();
      return;
    }

    clearImage();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, or WebP).");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(`Image is too large (${toImageSizeLabel(file.size)}). Max size is ${toImageSizeLabel(MAX_IMAGE_SIZE_BYTES)}.`);
      return;
    }

    try {
      const pngBase64 = await normalizeImageToPngBase64(file);
      setScreenshotData(pngBase64);
      setScreenshotFileName(file.name);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to process image.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedDescription = description.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDescription) {
      setErrorMessage("Issue details are required.");
      return;
    }

    setIsSubmitting(true);

    const timestamp = new Date().toISOString();
    const payload: FeedbackSubmissionPayload = {
      type,
      email: trimmedEmail || undefined,
      description: trimmedDescription,
      externalSource: "manual",
      diagnostics: buildDiagnostics(timestamp),
      includeScreenshot: Boolean(screenshotData),
      screenshotData: screenshotData || undefined,
    };

    try {
      const response = await authFetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.error || `Failed to create issue (${response.status})`;
        throw new Error(message);
      }

      setType("Bug Report");
      setEmail("");
      setDescription("");
      clearImage();
      setSuccessMessage("Issue created.");
      await onCreated();
    } catch (error) {
      console.error("Failed to create issue:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 sm:p-5 animate-fade-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold">Create Issue</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Add feedback directly from this dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm">
          <span className="block mb-1 text-[hsl(var(--muted-foreground))]">Category</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as FeedbackType)}
            className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            {FEEDBACK_TYPE_OPTIONS.map((feedbackType) => (
              <option key={feedbackType.value} value={feedbackType.value}>
                {feedbackType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-[hsl(var(--muted-foreground))]">Email (optional)</span>
          <input
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email, URL, or any contact info"
            className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </label>
      </div>

      <label className="block text-sm mb-3">
        <span className="block mb-1 text-[hsl(var(--muted-foreground))]">Issue</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the bug, feature request, or question..."
          rows={4}
          required
          className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-y min-h-[96px]"
        />
      </label>

      <div className="mb-4">
        <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">
          Image upload (optional)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 transition-colors cursor-pointer">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {screenshotFileName && (
            <>
              <span className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[240px]" title={screenshotFileName}>
                {screenshotFileName}
              </span>
              <button
                type="button"
                onClick={clearImage}
                className="px-2 py-1 text-xs rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Remove
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
          PNG, JPG, or WebP up to {toImageSizeLabel(MAX_IMAGE_SIZE_BYTES)}.
        </p>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-400 mb-3">{errorMessage}</p>
      )}
      {successMessage && (
        <p className="text-sm text-emerald-400 mb-3">{successMessage}</p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Issue"}
        </button>
      </div>
    </form>
  );
}
