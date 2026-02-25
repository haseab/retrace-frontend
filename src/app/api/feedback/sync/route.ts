import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import type { FeedbackPriority, FeedbackStatus, FeedbackType } from "@/lib/types/feedback";
import { extractLeadingBracketTokens, stripLeadingBracketPrefixes } from "@/lib/feedback-display";
import { createApiRouteLogger } from "@/lib/api-route-logger";

type ExternalSource = "github" | "featurebase";

interface ExternalFeedbackRecord {
  source: ExternalSource;
  externalId: string;
  externalUrl: string;
  title: string;
  body: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExistingExternalFeedbackRow {
  id: number;
  externalId: string;
  status: FeedbackStatus;
  tags: string[];
}

interface SourceSyncSummary {
  fetched: number;
  inserted: number;
  updated: number;
  reopened: number;
  resolved: number;
  skipped: boolean;
  skipReason?: string;
}

interface FeaturebaseFetchResult {
  items: ExternalFeedbackRecord[];
  skipped: boolean;
  skipReason?: string;
}

interface UpsertExternalItemsOptions {
  resolveMissing: boolean;
}

type ApiRouteLogger = ReturnType<typeof createApiRouteLogger>;

const GH_PRIORITY_CRITICAL = ["critical", "p0", "urgent", "blocker"];
const GH_PRIORITY_HIGH = ["high", "p1", "important"];
const GH_PRIORITY_LOW = ["low", "p3", "minor", "nice-to-have"];
const BUG_KEYWORDS = ["bug", "crash", "broken", "regression", "error", "failure", "fix"];
const QUESTION_KEYWORDS = ["question", "support", "help"];
const FEATURE_KEYWORDS = ["feature", "enhancement", "request", "idea"];
const CLOSED_STATUS_KEYWORDS = ["complete", "completed", "closed", "done", "cancel", "decline", "duplicate", "archive"];
const FEATUREBASE_IN_REVIEW_KEYWORDS = ["in review", "in-review", "in_review", "reviewing"];
const MAX_DESCRIPTION_BODY_CHARS = 7000;
const DEFAULT_GITHUB_OWNER = "haseab";
const DEFAULT_GITHUB_REPO = "retrace";
const DEFAULT_FEATUREBASE_ORG = "retrace";

const EMPTY_ARRAY = "[]";
const EMPTY_OBJECT = "{}";
const EMPTY_DISPLAY_INFO = JSON.stringify({ count: 0, displays: [], mainDisplayIndex: 0 });
const EMPTY_PROCESS_INFO = JSON.stringify({
  totalRunning: 0,
  eventMonitoringApps: 0,
  windowManagementApps: 0,
  securityApps: 0,
  hasJamf: false,
  hasKandji: false,
  axuiServerCPU: 0,
  windowServerCPU: 0,
});
const EMPTY_ACCESSIBILITY_INFO = JSON.stringify({
  voiceOverEnabled: false,
  switchControlEnabled: false,
  reduceMotionEnabled: false,
  increaseContrastEnabled: false,
  reduceTransparencyEnabled: false,
  differentiateWithoutColorEnabled: false,
  displayHasInvertedColors: false,
});
const EMPTY_PERFORMANCE_INFO = JSON.stringify({
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
});

let initialized = false;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function toInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function parseTags(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((tag) => toStringValue(tag).trim())
      .filter((tag) => tag.length > 0);
  } catch {
    return [];
  }
}

function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mergeTags(existing: string[], incoming: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const tag of [...existing, ...incoming]) {
    const trimmed = tag.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    merged.push(trimmed);
  }

  return merged;
}

function normalizeTimestamp(value: unknown, fallbackIso: string): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallbackIso;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackIso;
  }

  return parsed.toISOString();
}

function trimBody(body: string): string {
  const normalized = body.trim();
  if (normalized.length <= MAX_DESCRIPTION_BODY_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_DESCRIPTION_BODY_CHARS)}\n\n[truncated]`;
}

function hasAnyKeyword(input: string, keywords: string[]): boolean {
  const normalized = input.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function hasInReviewKeyword(input: string): boolean {
  return FEATUREBASE_IN_REVIEW_KEYWORDS.some((keyword) => input.includes(keyword));
}

function inferPriorityFromLabels(labels: string[]): FeedbackPriority {
  const normalized = labels.map((label) => label.toLowerCase());

  if (normalized.some((label) => GH_PRIORITY_CRITICAL.some((needle) => label.includes(needle)))) {
    return "critical";
  }
  if (normalized.some((label) => GH_PRIORITY_HIGH.some((needle) => label.includes(needle)))) {
    return "high";
  }
  if (normalized.some((label) => GH_PRIORITY_LOW.some((needle) => label.includes(needle)))) {
    return "low";
  }
  return "medium";
}

function inferType(title: string, body: string, labels: string[]): FeedbackType {
  const leadingTitleMetadata = extractLeadingBracketTokens(title).tokens.map((token) => token.toLowerCase());
  if (leadingTitleMetadata.some((token) => BUG_KEYWORDS.some((keyword) => token.includes(keyword)))) {
    return "Bug Report";
  }
  if (leadingTitleMetadata.some((token) => token === "q" || QUESTION_KEYWORDS.some((keyword) => token.includes(keyword)))) {
    return "Question";
  }
  if (leadingTitleMetadata.some((token) => FEATURE_KEYWORDS.some((keyword) => token.includes(keyword)))) {
    return "Feature Request";
  }

  const joined = `${title}\n${body}\n${labels.join("\n")}`;
  if (hasAnyKeyword(joined, BUG_KEYWORDS)) {
    return "Bug Report";
  }
  if (hasAnyKeyword(joined, QUESTION_KEYWORDS)) {
    return "Question";
  }
  return "Feature Request";
}

function buildDescription(record: ExternalFeedbackRecord): string {
  const cleanedTitle = stripLeadingBracketPrefixes(record.title.trim());
  const parts = [
    cleanedTitle.length > 0 ? cleanedTitle : record.title.trim(),
    record.externalUrl,
  ];

  const body = trimBody(record.body);
  if (body.length > 0) {
    parts.push(body);
  }

  return parts.join("\n\n");
}

function parseLinkHeaderNext(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  const parts = linkHeader.split(",");
  for (const part of parts) {
    if (!part.includes('rel="next"')) {
      continue;
    }
    const match = part.match(/<([^>]+)>/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function parseGitHubLabels(rawLabels: unknown): string[] {
  if (!Array.isArray(rawLabels)) {
    return [];
  }

  const labels: string[] = [];
  for (const rawLabel of rawLabels) {
    if (typeof rawLabel === "string") {
      labels.push(rawLabel.trim());
      continue;
    }
    const record = asRecord(rawLabel);
    if (!record) {
      continue;
    }
    const name = toStringValue(record.name).trim();
    if (name.length > 0) {
      labels.push(name);
    }
  }

  return labels;
}

async function fetchGitHubOutstanding(): Promise<ExternalFeedbackRecord[]> {
  const owner = process.env.FEEDBACK_SYNC_GITHUB_OWNER || DEFAULT_GITHUB_OWNER;
  const repo = process.env.FEEDBACK_SYNC_GITHUB_REPO || DEFAULT_GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "retrace-feedback-sync",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const records: ExternalFeedbackRecord[] = [];
  let nextUrl: string | null =
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    "/issues?state=open&sort=updated&direction=desc&per_page=100";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 500);
      throw new Error(`GitHub sync failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("GitHub sync failed: expected an array response.");
    }

    for (const item of payload) {
      const issue = asRecord(item);
      if (!issue) {
        continue;
      }

      // The issues endpoint returns pull requests too; skip them.
      if (issue.pull_request !== undefined) {
        continue;
      }

      const issueNumber = toInteger(issue.number);
      if (issueNumber === null) {
        continue;
      }

      const issueUrl = toStringValue(issue.html_url).trim();
      const title = toStringValue(issue.title).trim();
      if (issueUrl.length === 0 || title.length === 0) {
        continue;
      }

      const body = toStringValue(issue.body).trim();
      const labels = parseGitHubLabels(issue.labels);
      const createdAt = normalizeTimestamp(issue.created_at, new Date().toISOString());
      const updatedAt = normalizeTimestamp(issue.updated_at, createdAt);

      const labelTags = labels
        .map((label) => normalizeTag(label))
        .filter((label) => label.length > 0)
        .map((label) => `gh:${label}`);

      records.push({
        source: "github",
        externalId: String(issueNumber),
        externalUrl: issueUrl,
        title,
        body,
        type: inferType(title, body, labels),
        priority: inferPriorityFromLabels(labels),
        tags: mergeTags(["source:github"], labelTags),
        createdAt,
        updatedAt,
      });
    }

    nextUrl = parseLinkHeaderNext(response.headers.get("link"));
  }

  return records;
}

function parseFeaturebaseTags(rawTags: unknown): string[] {
  if (typeof rawTags === "string") {
    const trimmed = rawTags.trim();
    if (trimmed.length === 0) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseFeaturebaseTags(parsed);
      }
    } catch {
      // Not JSON; continue with a basic CSV-style split.
    }

    return trimmed
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  if (!Array.isArray(rawTags)) {
    return [];
  }

  const tags: string[] = [];
  for (const rawTag of rawTags) {
    if (typeof rawTag === "string") {
      tags.push(rawTag.trim());
      continue;
    }
    const record = asRecord(rawTag);
    if (!record) {
      continue;
    }
    const name = toStringValue(record.name).trim();
    if (name.length > 0) {
      tags.push(name);
      continue;
    }
    const key = toStringValue(record.key).trim();
    if (key.length > 0) {
      tags.push(key);
    }
  }

  return tags;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlToText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeSlug(slug: string): string {
  const normalized = slug
    .replace(/^\/+/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : "Untitled Featurebase post";
}

function collectFeaturebasePostCandidates(
  value: unknown,
  candidates: Record<string, unknown>[]
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFeaturebasePostCandidates(item, candidates);
    }
    return;
  }

  const record = asRecord(value);
  if (!record) {
    return;
  }

  const title = toStringValue(record.title).trim();
  const hasPostMarker =
    title.length > 0 &&
    (
      typeof record.postUrl === "string" ||
      typeof record.slug === "string" ||
      record.postNumber !== undefined ||
      record.content !== undefined ||
      record.tags !== undefined ||
      record.status !== undefined ||
      record.postStatus !== undefined
    );

  if (hasPostMarker) {
    candidates.push(record);
  }

  for (const nested of Object.values(record)) {
    if (Array.isArray(nested) || (nested && typeof nested === "object")) {
      collectFeaturebasePostCandidates(nested, candidates);
    }
  }
}

function collectFeaturebaseStatusStrings(post: Record<string, unknown>): string[] {
  const values: string[] = [];

  const pushValue = (value: unknown) => {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized.length > 0) {
        values.push(normalized);
      }
      return;
    }

    const record = asRecord(value);
    if (!record) {
      return;
    }

    const candidateKeys = ["type", "name", "key", "label", "title", "text", "status", "value"];
    for (const key of candidateKeys) {
      const candidateValue = toStringValue(record[key]).trim().toLowerCase();
      if (candidateValue.length > 0) {
        values.push(candidateValue);
      }
    }
  };

  pushValue(post.status);
  pushValue(post.postStatus);
  pushValue(post.postStatusType);
  pushValue(post.post_status);
  pushValue(post.post_status_type);
  pushValue(post.statusName);
  pushValue(post.state);
  pushValue(post.workflowStatus);
  pushValue(post.workflow_state);
  pushValue(post.badge);
  pushValue(post.flag);

  for (const collection of [post.badges, post.flags]) {
    if (!Array.isArray(collection)) {
      continue;
    }
    for (const item of collection) {
      pushValue(item);
    }
  }

  return values;
}

function isFeaturebaseInReview(post: Record<string, unknown>): boolean {
  const statusValues = collectFeaturebaseStatusStrings(post);
  if (statusValues.length === 0) {
    return false;
  }

  return statusValues.some((statusValue) => hasInReviewKeyword(statusValue));
}

function resolveFeaturebasePostUrl(rawUrl: string, organization: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `https://${organization}.featurebase.app${trimmed}`;
  }
  if (trimmed.length === 0) {
    return `https://${organization}.featurebase.app`;
  }
  return `https://${organization}.featurebase.app/${trimmed}`;
}

function featurebaseCandidateToRecord(
  post: Record<string, unknown>,
  organization: string,
  nowIso: string
): ExternalFeedbackRecord | null {
  if (!isFeaturebaseInReview(post)) {
    return null;
  }

  const title = toStringValue(post.title).trim();
  if (title.length === 0) {
    return null;
  }

  const postNumber = toInteger(post.postNumber ?? post.number);
  const postId = toStringValue(post.id).trim();
  const slug = toStringValue(post.slug).trim();
  const externalId = postNumber === null
    ? (postId.length > 0 ? postId : slug)
    : String(postNumber);
  if (externalId.length === 0) {
    return null;
  }

  const postUrlRaw =
    toStringValue(post.postUrl || post.url || post.path).trim() ||
    (slug.length > 0 ? `/p/${slug}` : "");
  const postUrl = resolveFeaturebasePostUrl(postUrlRaw, organization);

  const contentRaw = toStringValue(post.content || post.description || post.body).trim();
  const content = stripHtmlToText(contentRaw);
  const tags = parseFeaturebaseTags(post.tags || post.labels || post.tagNames || post.postTags);
  const createdAt = normalizeTimestamp(post.createdAt || post.created_at, nowIso);
  const updatedAt = normalizeTimestamp(post.updatedAt || post.updated_at, createdAt);
  const featurebaseTags = tags
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0)
    .map((tag) => `fb:${tag}`);

  return {
    source: "featurebase",
    externalId,
    externalUrl: postUrl,
    title,
    body: content,
    type: inferType(title, content, tags),
    priority: inferPriorityFromLabels(tags),
    tags: mergeTags(["source:featurebase"], featurebaseTags),
    createdAt,
    updatedAt,
  };
}

function extractFeaturebaseRecordsFromEmbeddedJson(html: string, organization: string): ExternalFeedbackRecord[] {
  const scriptRegex = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const payload = match[1]?.trim();
    if (!payload) {
      continue;
    }
    try {
      const parsed = JSON.parse(payload);
      collectFeaturebasePostCandidates(parsed, candidates);
    } catch {
      // Ignore unrelated script blocks.
    }
  }

  const nowIso = new Date().toISOString();
  const records: ExternalFeedbackRecord[] = [];
  const seenExternalIds = new Set<string>();
  for (const candidate of candidates) {
    const record = featurebaseCandidateToRecord(candidate, organization, nowIso);
    if (!record) {
      continue;
    }
    if (seenExternalIds.has(record.externalId)) {
      continue;
    }
    seenExternalIds.add(record.externalId);
    records.push(record);
  }

  return records;
}

function extractFeaturebaseRecordsFromAnchors(html: string, organization: string): ExternalFeedbackRecord[] {
  const anchorRegex = /<a[^>]+href=["'](\/p\/[^"'?#]+(?:\?[^"'#]*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const nowIso = new Date().toISOString();
  const records: ExternalFeedbackRecord[] = [];
  const seenExternalIds = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = toStringValue(match[1]).trim();
    const slug = href.replace(/^\/p\//, "").split(/[?#]/)[0]?.trim();
    if (!slug) {
      continue;
    }

    const externalId = slug.toLowerCase();
    if (seenExternalIds.has(externalId)) {
      continue;
    }
    seenExternalIds.add(externalId);

    const anchorText = stripHtmlToText(toStringValue(match[2]));
    const title = anchorText.length > 0 ? anchorText.slice(0, 220) : humanizeSlug(slug);
    const body = anchorText.length > 0 ? anchorText : "";
    records.push({
      source: "featurebase",
      externalId,
      externalUrl: resolveFeaturebasePostUrl(href, organization),
      title,
      body,
      type: inferType(title, body, []),
      priority: "medium",
      tags: ["source:featurebase", "fb:scraped"],
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return records;
}

async function fetchFeaturebaseOutstanding(): Promise<FeaturebaseFetchResult> {
  const organization = process.env.FEATUREBASE_ORGANIZATION || DEFAULT_FEATUREBASE_ORG;
  const sourceUrls = [
    `https://${organization}.featurebase.app/roadmap`,
    `https://${organization}.featurebase.app/`,
  ];

  const records: ExternalFeedbackRecord[] = [];
  const seenExternalIds = new Set<string>();
  const errors: string[] = [];
  const emptyUrls: string[] = [];

  for (const sourceUrl of sourceUrls) {
    let html = "";
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = (await response.text()).slice(0, 300);
        errors.push(`${sourceUrl} -> ${response.status}: ${errorText}`);
        continue;
      }

      html = await response.text();
    } catch (error) {
      errors.push(`${sourceUrl} -> ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    const pageRecords = extractFeaturebaseRecordsFromEmbeddedJson(html, organization);
    if (pageRecords.length === 0) {
      emptyUrls.push(sourceUrl);
    }
    for (const record of pageRecords) {
      if (seenExternalIds.has(record.externalId)) {
        continue;
      }
      seenExternalIds.add(record.externalId);
      records.push(record);
    }
  }

  if (records.length > 0) {
    return {
      items: records,
      skipped: false,
    };
  }

  if (errors.length === sourceUrls.length) {
    return {
      items: [],
      skipped: true,
      skipReason: `Featurebase scrape failed: ${errors.join(" | ").slice(0, 700)}`,
    };
  }

  if (errors.length > 0) {
    const partialErrors = errors.join(" | ").slice(0, 700);
    return {
      items: [],
      skipped: true,
      skipReason: `Featurebase scrape found no posts marked 'in review'. Partial errors: ${partialErrors}`,
    };
  }

  if (emptyUrls.length > 0) {
    return {
      items: [],
      skipped: true,
      skipReason: `Featurebase scrape found no posts marked 'in review' on: ${emptyUrls.join(", ")}`,
    };
  }

  return {
    items: [],
    skipped: true,
    skipReason: "Featurebase scrape found no posts marked 'in review'.",
  };
}

async function loadExistingExternalRows(source: ExternalSource): Promise<Map<string, ExistingExternalFeedbackRow>> {
  const result = await db.execute({
    sql: `
      SELECT id, external_id, status, tags
      FROM feedback
      WHERE external_source = ? AND external_id IS NOT NULL
      ORDER BY id DESC
    `,
    args: [source],
  });

  const map = new Map<string, ExistingExternalFeedbackRow>();
  for (const row of result.rows as Record<string, unknown>[]) {
    const id = toInteger(row.id);
    if (id === null) {
      continue;
    }

    const externalId = toStringValue(row.external_id).trim();
    if (externalId.length === 0) {
      continue;
    }
    if (map.has(externalId)) {
      continue;
    }

    const rawStatus = toStringValue(row.status, "open");
    const status: FeedbackStatus = (
      rawStatus === "open" ||
      rawStatus === "in_progress" ||
      rawStatus === "to_notify" ||
      rawStatus === "notified" ||
      rawStatus === "resolved" ||
      rawStatus === "closed" ||
      rawStatus === "back_burner"
    )
      ? rawStatus
      : "open";

    map.set(externalId, {
      id,
      externalId,
      status,
      tags: parseTags(row.tags),
    });
  }

  return map;
}

async function upsertExternalItems(
  source: ExternalSource,
  items: ExternalFeedbackRecord[],
  options: UpsertExternalItemsOptions = { resolveMissing: true }
): Promise<SourceSyncSummary> {
  const summary: SourceSyncSummary = {
    fetched: items.length,
    inserted: 0,
    updated: 0,
    reopened: 0,
    resolved: 0,
    skipped: false,
  };

  const existingRows = await loadExistingExternalRows(source);
  const incomingIds = new Set<string>();

  for (const item of items) {
    incomingIds.add(item.externalId);
    const existing = existingRows.get(item.externalId);
    const description = buildDescription(item);

    if (existing) {
      const mergedTags = mergeTags(existing.tags, item.tags);
      let nextStatus = existing.status;
      if (existing.status === "resolved" || existing.status === "closed") {
        nextStatus = "open";
        summary.reopened += 1;
      }

      await db.execute({
        sql: `
          UPDATE feedback
          SET
            type = ?,
            description = ?,
            priority = ?,
            tags = ?,
            status = ?,
            app_version = ?,
            build_number = ?,
            diagnostics_timestamp = ?,
            external_url = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [
          item.type,
          description,
          item.priority,
          JSON.stringify(mergedTags),
          nextStatus,
          "external-sync",
          item.source,
          item.updatedAt,
          item.externalUrl,
          existing.id,
        ],
      });
      summary.updated += 1;
      continue;
    }

    await db.execute({
      sql: `
        INSERT INTO feedback (
          type,
          email,
          description,
          status,
          priority,
          notes,
          tags,
          is_read,
          app_version,
          build_number,
          macos_version,
          device_model,
          total_disk_space,
          free_disk_space,
          recent_errors,
          recent_logs,
          diagnostics_timestamp,
          settings_snapshot,
          display_info,
          process_info,
          accessibility_info,
          performance_info,
          emergency_crash_reports,
          display_count,
          has_screenshot,
          external_source,
          external_id,
          external_url,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        item.type,
        null,
        description,
        "open",
        item.priority,
        "",
        JSON.stringify(item.tags),
        0,
        "external-sync",
        item.source,
        "n/a",
        "n/a",
        "n/a",
        "n/a",
        EMPTY_ARRAY,
        EMPTY_ARRAY,
        item.updatedAt,
        EMPTY_OBJECT,
        EMPTY_DISPLAY_INFO,
        EMPTY_PROCESS_INFO,
        EMPTY_ACCESSIBILITY_INFO,
        EMPTY_PERFORMANCE_INFO,
        EMPTY_ARRAY,
        0,
        0,
        item.source,
        item.externalId,
        item.externalUrl,
        item.createdAt,
        item.updatedAt,
      ],
    });
    summary.inserted += 1;
  }

  if (options.resolveMissing) {
    for (const existing of existingRows.values()) {
      if (incomingIds.has(existing.externalId)) {
        continue;
      }
      if (existing.status === "resolved" || existing.status === "closed") {
        continue;
      }

      await db.execute({
        sql: `
          UPDATE feedback
          SET status = 'resolved', updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [existing.id],
      });
      summary.resolved += 1;
    }
  }

  return summary;
}

async function runSync(request: NextRequest, logger: ApiRouteLogger) {
  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  if (!initialized) {
    await initDatabase();
    initialized = true;
    logger.info("database_initialized");
  }

  const startedAt = Date.now();

  const githubItems = await fetchGitHubOutstanding();
  logger.info("github_fetched", { fetched: githubItems.length });
  const github = await upsertExternalItems("github", githubItems);
  logger.info("github_upserted", { summary: github });

  const featurebaseFetched = await fetchFeaturebaseOutstanding();
  let featurebase: SourceSyncSummary;
  if (featurebaseFetched.skipped) {
    featurebase = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      reopened: 0,
      resolved: 0,
      skipped: true,
      skipReason: featurebaseFetched.skipReason,
    };
    logger.warn("featurebase_skipped", {
      reason: featurebaseFetched.skipReason,
    });
  } else {
    featurebase = await upsertExternalItems("featurebase", featurebaseFetched.items, {
      resolveMissing: false,
    });
    logger.info("featurebase_upserted", { summary: featurebase });
  }

  const durationMs = Date.now() - startedAt;
  logger.success({
    status: 200,
    durationMs,
    github,
    featurebase,
  });

  return NextResponse.json({
    success: true,
    startedAt: new Date(startedAt).toISOString(),
    durationMs,
    github,
    featurebase,
  });
}

async function handleSyncRequest(request: NextRequest, routeId: string) {
  const logger = createApiRouteLogger(routeId, { request });
  logger.start();

  try {
    return await runSync(request, logger);
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      {
        success: false,
        error: "Feedback sync failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSyncRequest(request, "feedback.sync.GET");
}

export async function POST(request: NextRequest) {
  return handleSyncRequest(request, "feedback.sync.POST");
}
