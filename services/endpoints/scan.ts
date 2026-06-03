import { z } from "zod";
import {
  AnalyzeResultSchema,
  ReportResponseSchema,
  ScanHistoryItemSchema,
  type AnalyzeResult,
  type Signal
} from "@/utils/schemas";
import {
  API_BASE_URL,
  parseResponse,
  readBody,
  request,
  SafeScanApiError,
  uploadRequest
} from "@/services/apiClient";
import { enhanceAnalyzeResult } from "@/utils/localRisk";

const paths = {
  analyze: "/api/scan",
  file: "/api/scan/file",
  history: "/api/scan/history",
  report: "/api/report"
} as const;

const VALID_REPORT_REASONS = ["phishing", "wallet_drain", "malware", "spam", "other"] as const;

function normalizeReportReason(reason: string) {
  const normalized = reason.toLowerCase();
  if ((VALID_REPORT_REASONS as readonly string[]).includes(normalized)) return normalized;
  if (normalized.includes("wallet")) return "wallet_drain";
  if (normalized.includes("malware")) return "malware";
  if (normalized.includes("spam")) return "spam";
  if (normalized.includes("phish") || normalized.includes("block")) return "phishing";
  return "other";
}

function createUploadForm(file: { uri: string; name: string; mimeType: string }) {
  const form = new FormData();
  form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  return form;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "-")
    .replace(/&nbsp;/g, " ");
}

function textBetween(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : "";
}

function verdictFromWeb(value: string): AnalyzeResult["verdict"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("danger") || normalized.includes("block")) return "danger";
  if (normalized.includes("caution") || normalized.includes("suspicious")) return "warn";
  return "safe";
}

function severityFromWeb(value: string): Signal["severity"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium")) return "medium";
  return "low";
}

function parseWebScanResult(html: string): AnalyzeResult {
  const verdictText = textBetween(html, /<p class="result-support">([\s\S]*?)<\/p>/i);
  const threatText = textBetween(html, /<p class="threat-type-line">[\s\S]*?<strong>Threat type:<\/strong>\s*([\s\S]*?)<\/p>/i);
  const executionText = textBetween(html, /<p class="engine-label">What this QR executes<\/p>\s*<p>([\s\S]*?)<\/p>/i);
  const payload = textBetween(html, /<p class="engine-label">Decoded URL \/ payload<\/p>\s*<p class="mono">([\s\S]*?)<\/p>/i);
  const verdictLabel = textBetween(html, /<h2 id="riskVerdictTitle">([\s\S]*?)<\/h2>/i) || textBetween(html, /<h2>Verdict:\s*([\s\S]*?)<\/h2>/i);
  const scoreMatch = html.match(/data-score="(\d+)"/i) ?? html.match(/<h3>(\d+)\s*\/\s*100<\/h3>/i);
  const score = scoreMatch?.[1] ? Number(scoreMatch[1]) : 0;
  const signals: Signal[] = [];
  const reasonPattern = /<details class="reason-row"[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<span class="severity-badge[^"]*">([\s\S]*?)<\/span>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/details>/gi;
  let reasonMatch: RegExpExecArray | null;

  while ((reasonMatch = reasonPattern.exec(html))) {
    const label = decodeHtml(reasonMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const severity = severityFromWeb(decodeHtml(reasonMatch[2]));
    const description = decodeHtml(reasonMatch[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    signals.push({
      label,
      check: label,
      result: description,
      severity,
      description,
      passed: severity === "low"
    });
  }

  const verdict = verdictFromWeb(verdictLabel);
  const analyzedAt = new Date().toISOString();
  const normalizedPayload = payload || "Uploaded QR payload";

  return enhanceAnalyzeResult({
    scanId: `web-upload:${Date.now()}`,
    url: normalizedPayload,
    riskScore: Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0)),
    verdict,
    verdictText: verdictText || verdictLabel || "Scan complete.",
    signals:
      signals.length > 0
        ? signals
        : [
            {
              label: "Website scanner result",
              check: "Website scanner result",
              result: executionText || "SafeScan decoded the uploaded QR file.",
              severity: verdict === "danger" ? "high" : verdict === "warn" ? "medium" : "low",
              description: executionText || "SafeScan decoded the uploaded QR file.",
              passed: verdict === "safe"
            }
          ],
    analyzedAt,
    overallRisk: verdict === "danger" ? "high" : verdict === "warn" ? "suspicious" : "safe",
    confidenceScore: Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0)),
    scannedAt: analyzedAt,
    counted: undefined,
    scanCount: undefined,
    payloadType: payload ? "url" : "file",
    source: "backend",
    threatType: threatText || undefined
  });
}

async function scanFileViaWebRoute(file: { uri: string; name: string; mimeType: string }) {
  const form = createUploadForm(file);
  form.append("template_variant", "main_site");
  form.append("user_email", "");
  form.append("wallet_address", "");
  form.append("device_fingerprint", "mobile-app");

  const response = await fetch(`${API_BASE_URL}/search_qr_api`, {
    method: "POST",
    body: form
  });
  const body = await readBody(response);
  if (!response.ok) throw new SafeScanApiError(response.status, body);
  if (typeof body !== "string") throw new SafeScanApiError(422, { error: "Unexpected upload response." });
  return parseWebScanResult(body);
}

export async function analyze(payload: string) {
  const body = await request(paths.analyze, {
    method: "POST",
    body: JSON.stringify({ payload })
  });
  return enhanceAnalyzeResult(parseResponse(AnalyzeResultSchema, body));
}

export async function file(asset: { uri: string; name: string; mimeType: string }) {
  // Backend `/api/scan/file` accepts a multipart upload — image (PNG/JPG),
  // SVG, or PDF — decodes the QR, and runs the same analyzer pipeline as a
  // live camera scan. Falls back to the public `/search_qr_api` web route when
  // the authed endpoint rejects the upload.
  try {
    const body = await uploadRequest(paths.file, () => createUploadForm(asset));
    return enhanceAnalyzeResult(parseResponse(AnalyzeResultSchema, body));
  } catch (error) {
    if (error instanceof SafeScanApiError && (error.status === 401 || error.status === 422)) {
      return scanFileViaWebRoute(asset);
    }
    throw error;
  }
}

export async function history() {
  const body = await request(paths.history);
  return parseResponse(z.array(ScanHistoryItemSchema), body);
}

export async function report(scanId: string, reason: string) {
  const body = await request(paths.report, {
    method: "POST",
    body: JSON.stringify({ url: scanId, reason: normalizeReportReason(reason) })
  });
  parseResponse(ReportResponseSchema, body);
}

export async function reportUrl(url: string, reason: string) {
  try {
    const body = await request(paths.report, {
      method: "POST",
      body: JSON.stringify({ url, reason: normalizeReportReason(reason) })
    });
    parseResponse(ReportResponseSchema, body);
    return { queued: false, url, reason };
  } catch {
    return { queued: true, url, reason };
  }
}
