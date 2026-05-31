"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTitle } from "@/components/qa/page-title";
import { JIRA_RETRY_QUEUE_STORAGE_KEY, JIRA_SETTINGS_STORAGE_KEY } from "@/lib/jira";
import type {
  ExecutionRunResult,
  HumanFriendlyBugReport,
  JiraCreateIssueResponse,
  JiraIntegrationSettings,
} from "@/types";

type Finding = {
  title: string;
  severity: "High" | "Medium";
  details: string;
  actualResult?: string;
  impactedArea: string;
  suggestedAction: string;
};

interface JiraRetryQueueItem {
  id: string;
  bugReport: HumanFriendlyBugReport;
  createdAt: string;
  attempts: number;
  lastMessage?: string;
}

interface RetryChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const EMPTY_JIRA_SETTINGS: JiraIntegrationSettings = {
  baseUrl: "",
  projectKey: "",
  issueType: "Bug",
  defaultAssignee: "",
  apiEmail: "",
  apiToken: "",
};

function loadJiraSettingsFromStorage(): JiraIntegrationSettings {
  if (typeof window === "undefined") {
    return EMPTY_JIRA_SETTINGS;
  }
  const raw = window.localStorage.getItem(JIRA_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return EMPTY_JIRA_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw) as JiraIntegrationSettings;
    return {
      baseUrl: parsed.baseUrl ?? "",
      projectKey: parsed.projectKey ?? "",
      issueType: parsed.issueType ?? "Bug",
      defaultAssignee: parsed.defaultAssignee ?? "",
      apiEmail: parsed.apiEmail ?? "",
      apiToken: parsed.apiToken ?? "",
    };
  } catch {
    return EMPTY_JIRA_SETTINGS;
  }
}

function isJiraFullyConfigured(settings: JiraIntegrationSettings): boolean {
  return Boolean(
    settings.baseUrl.trim() &&
      settings.projectKey.trim() &&
      settings.issueType.trim() &&
      (settings.apiEmail ?? "").trim() &&
      (settings.apiToken ?? "").trim()
  );
}

function loadRetryQueueFromStorage(): JiraRetryQueueItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(JIRA_RETRY_QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as JiraRetryQueueItem[];
  } catch {
    return [];
  }
}

function formatLocalTime(timestamp: string): string {
  if (!timestamp) {
    return "--:--:--";
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "--:--:--";
  }
  return parsed.toLocaleTimeString();
}

function formatLocalDateTime(timestamp: string): string {
  if (!timestamp) {
    return "--";
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }
  return parsed.toLocaleString();
}

function responsiveFindingKey(
  item: { viewport: string; screenshotPath?: string },
  index: number
): string {
  return item.screenshotPath ?? `${item.viewport}-${index}`;
}

function responsiveFindingLabel(item: { viewport: string; screenshotPath?: string }): string {
  const fileName = item.screenshotPath?.split(/[/\\]/).pop() ?? "";
  if (!fileName || fileName === "desktop-viewport.png") {
    return item.viewport;
  }
  const pageSlug = fileName.replace(/^desktop-/, "").replace(/\.png$/i, "");
  return `${item.viewport} · ${pageSlug}`;
}

export default function ResultsPage() {
  const [executionRun, setExecutionRun] = useState<ExecutionRunResult | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [jiraMessage, setJiraMessage] = useState<string | null>(null);
  const [jiraConfigured, setJiraConfigured] = useState(() =>
    isJiraFullyConfigured(loadJiraSettingsFromStorage())
  );
  const [jiraRetryQueue, setJiraRetryQueue] = useState<JiraRetryQueueItem[]>(() =>
    loadRetryQueueFromStorage()
  );
  const [retrying, setRetrying] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [selectedRetryScenarioId, setSelectedRetryScenarioId] = useState("");
  const [retryChat, setRetryChat] = useState<RetryChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Retry Assistant ready. Tell me how to retry a failed case (CSS, XPath, Playwright locator, natural language, Urdu/English mix).",
      timestamp: "",
    },
  ]);
  const [retryBusy, setRetryBusy] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const retryQueueCounterRef = useRef(jiraRetryQueue.length);
  const chatMessageCounterRef = useRef(1);

  useEffect(() => {
    const loadLatestRun = async () => {
      try {
        const response = await fetch("/api/execution/latest-report", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          data: ExecutionRunResult | null;
        };
        if (payload.ok && payload.data) {
          setExecutionRun(payload.data);
        }
      } finally {
        setLoadingRun(false);
      }
    };
    void loadLatestRun();
  }, []);

  const activeBugReports = executionRun?.bugReports ?? [];

  const summaryMetrics = executionRun
    ? {
        runId: executionRun.runId,
        passCount: executionRun.passed,
        failCount: executionRun.failed,
        skippedCount: executionRun.skipped,
        confidence:
          activeBugReports.length > 0
            ? Math.round(
                activeBugReports.reduce((sum, bug) => sum + bug.confidenceScore, 0) /
                  activeBugReports.length
              )
            : 0,
      }
    : {
        runId: "No live run",
        passCount: 0,
        failCount: 0,
        skippedCount: 0,
        confidence: 0,
      };

  const dynamicFindings: Finding[] = activeBugReports.slice(0, 6).map((bug) => ({
    title: bug.summary,
    severity: bug.severity === "Low" ? "Medium" : bug.severity === "Critical" ? "High" : bug.severity,
    details: bug.description || bug.actualResult,
    actualResult: bug.actualResult,
    impactedArea: bug.userImpact || bug.businessImpact,
    suggestedAction: bug.suggestedFix,
  }));

  const failedScenarioOptions = (executionRun?.scenarios ?? []).filter(
    (scenario) => scenario.status === "failed"
  );

  const effectiveSelectedRetryScenarioId = useMemo(() => {
    if (
      selectedRetryScenarioId &&
      failedScenarioOptions.some((scenario) => scenario.scenarioId === selectedRetryScenarioId)
    ) {
      return selectedRetryScenarioId;
    }
    return failedScenarioOptions[0]?.scenarioId ?? "";
  }, [failedScenarioOptions, selectedRetryScenarioId]);

  const persistQueue = (queue: JiraRetryQueueItem[]) => {
    setJiraRetryQueue(queue);
    window.localStorage.setItem(JIRA_RETRY_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  };

  const enqueueRetry = (bug: HumanFriendlyBugReport, lastMessage: string) => {
    const existing = jiraRetryQueue.find((item) => item.bugReport.summary === bug.summary);
    if (existing) {
      const updated = jiraRetryQueue.map((item) =>
        item.id === existing.id
          ? { ...item, attempts: item.attempts + 1, lastMessage }
          : item
      );
      persistQueue(updated);
      return;
    }
    persistQueue([
      ...jiraRetryQueue,
      {
        id: `jira-retry-${(retryQueueCounterRef.current += 1)}`,
        bugReport: bug,
        createdAt: new Date().toISOString(),
        attempts: 1,
        lastMessage,
      },
    ]);
  };

  const removeRetryItem = (id: string) => {
    persistQueue(jiraRetryQueue.filter((item) => item.id !== id));
  };

  const reportBugToJira = async (bug: HumanFriendlyBugReport) => {
    setJiraMessage(null);
    const settings = loadJiraSettingsFromStorage();
    setJiraConfigured(isJiraFullyConfigured(settings));

    if (!settings.baseUrl) {
      setJiraMessage("Configure JIRA settings first in the Settings page.");
      return;
    }

    const response = await fetch("/api/integrations/jira/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bugReport: bug, settings }),
    });
    const payload = (await response.json()) as JiraCreateIssueResponse;

    if (payload.ok && payload.issueUrl) {
      window.open(payload.issueUrl, "_blank", "noopener,noreferrer");
      setJiraMessage(payload.message);
      const matched = jiraRetryQueue.find((item) => item.bugReport.summary === bug.summary);
      if (matched) {
        removeRetryItem(matched.id);
      }
      return;
    }

    if (payload.copiedPayloadText) {
      await navigator.clipboard.writeText(payload.copiedPayloadText).catch(() => undefined);
    }
    enqueueRetry(bug, payload.message);
    setJiraMessage(
      payload.fallbackCreateUrl
        ? `${payload.message} Bug details copied to clipboard. Log into JIRA and create the issue manually in your project.`
        : payload.message
    );
  };

  const retryQueuedItem = async (item: JiraRetryQueueItem) => {
    await reportBugToJira(item.bugReport);
  };

  const retryAllQueuedItems = async () => {
    if (jiraRetryQueue.length === 0) {
      return;
    }
    setRetrying(true);
    try {
      for (const item of jiraRetryQueue) {
        await retryQueuedItem(item);
      }
    } finally {
      setRetrying(false);
    }
  };

  const sendRetryInstruction = async () => {
    const instruction = chatInput.trim();
    if (!instruction || retryBusy) {
      return;
    }

    setRetryChat((prev) => [
      ...prev,
      {
        id: `user-${(chatMessageCounterRef.current += 1)}`,
        role: "user",
        text: instruction,
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatInput("");
    setRetryBusy(true);

    try {
      const response = await fetch("/api/execution/retry-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          targetScenarioId: effectiveSelectedRetryScenarioId || undefined,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        data?: { run?: ExecutionRunResult };
        error?: { message?: string };
      };

      if (payload.ok) {
        if (payload.data?.run) {
          setExecutionRun(payload.data.run);
        }
        setRetryChat((prev) => [
          ...prev,
          {
            id: `assistant-${(chatMessageCounterRef.current += 1)}`,
            role: "assistant",
            text:
              payload.message ??
              "Retry completed and latest result has been updated on this page.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setRetryChat((prev) => [
          ...prev,
          {
            id: `assistant-${(chatMessageCounterRef.current += 1)}`,
            role: "assistant",
            text: payload.error?.message ?? "Retry failed. Please refine instruction and retry.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setRetryChat((prev) => [
        ...prev,
        {
          id: `assistant-${(chatMessageCounterRef.current += 1)}`,
          role: "assistant",
          text: "Retry assistant could not reach backend service.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setRetryBusy(false);
    }
  };

  useEffect(() => {
    if (!selectedFinding) {
      previousFocusRef.current?.focus();
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }

    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedFinding) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedFinding(null);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );

      if (!focusable || focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedFinding]);

  return (
    <main className="space-y-4">
      <PageTitle
        title="Results"
        subtitle="Summarized QA outcomes with confidence and actionable insights."
        tag={summaryMetrics.runId}
      />

      <section className="flex flex-wrap items-center gap-2">
        <Badge variant={jiraConfigured ? "success" : "outline"}>
          {jiraConfigured ? "JIRA configured" : "JIRA credentials missing"}
        </Badge>
        {jiraRetryQueue.length > 0 ? (
          <Badge variant="warning">{jiraRetryQueue.length} failed JIRA submissions queued</Badge>
        ) : (
          <Badge variant="secondary">No queued JIRA retries</Badge>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-xs text-muted-foreground">Passed</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {summaryMetrics.passCount}
          </p>
        </article>
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">
            {summaryMetrics.failCount}
          </p>
        </article>
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-xs text-muted-foreground">Skipped</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {summaryMetrics.skippedCount}
          </p>
        </article>
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-xs text-muted-foreground">AI Confidence</p>
          <p className="mt-1 text-2xl font-semibold">{summaryMetrics.confidence}%</p>
          <Progress value={summaryMetrics.confidence} className="mt-2" />
        </article>
      </section>

      {executionRun ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Scenario Outcomes</h3>
            <Badge variant="secondary">Final status after post-run analysis</Badge>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Scenarios may pass during browser execution, then fail when post-run checks
            (accessibility, responsive, console defects, links) find issues.
          </p>
          <div className="space-y-2">
            {executionRun.scenarios.map((scenario) => (
              <article key={scenario.scenarioId} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {scenario.scenarioId} — {scenario.scenario}
                  </p>
                  <Badge
                    variant={
                      scenario.status === "passed"
                        ? "success"
                        : scenario.status === "failed"
                          ? "danger"
                          : "outline"
                    }
                  >
                    {scenario.status}
                  </Badge>
                </div>
                {scenario.errorReason ? (
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                    {scenario.errorReason}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {executionRun?.productionReportPaths ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Download Reports</h3>
            <Badge variant="secondary">Client-shareable artifacts</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/execution/report-file?runId=${encodeURIComponent(
                executionRun.runId
              )}&file=${encodeURIComponent("client-report.html")}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Download HTML
            </a>
            <a
              href={`/api/execution/report-file?runId=${encodeURIComponent(
                executionRun.runId
              )}&file=${encodeURIComponent("client-report.json")}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Download JSON
            </a>
            <a
              href={`/api/execution/report-file?runId=${encodeURIComponent(
                executionRun.runId
              )}&file=${encodeURIComponent("summary.md")}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Download Markdown
            </a>
          </div>
        </section>
      ) : null}

      {jiraMessage ? (
        <section className="rounded-lg border bg-indigo-50/60 p-3 text-sm text-indigo-700">
          {jiraMessage}
        </section>
      ) : null}

      {jiraRetryQueue.length > 0 ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">JIRA Retry Queue</h3>
            <button
              type="button"
              onClick={retryAllQueuedItems}
              disabled={retrying}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              {retrying ? "Retrying..." : "Retry All"}
            </button>
          </div>
          <div className="space-y-2">
            {jiraRetryQueue.map((item) => (
              <article key={item.id} className="rounded-lg border p-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.bugReport.summary}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => retryQueuedItem(item)}
                      className="rounded-md border px-2 py-1 hover:bg-muted"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRetryItem(item.id)}
                      className="rounded-md border px-2 py-1 hover:bg-muted"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Attempts: {item.attempts} • Last: {item.lastMessage ?? "N/A"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Results Chat Retry Assistant</h3>
          <Badge variant={retryBusy ? "warning" : "secondary"}>
            {retryBusy ? "Retrying..." : "Ready"}
          </Badge>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {retryChat.map((message) => (
            <article
              key={message.id}
              className={`rounded-lg border p-2 text-sm ${
                message.role === "user"
                  ? "ml-8 bg-indigo-50/70 dark:bg-indigo-950/40"
                  : "mr-8 bg-white dark:bg-slate-900"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {message.role === "user" ? "You" : "Retry Assistant"} •{" "}
                {formatLocalTime(message.timestamp)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="w-72">
            <label className="mb-1 block text-xs text-muted-foreground">
              Target failed scenario
            </label>
            <select
              value={effectiveSelectedRetryScenarioId}
              onChange={(event) => setSelectedRetryScenarioId(event.target.value)}
              className="h-10 w-full rounded-lg border px-2 text-xs"
              disabled={failedScenarioOptions.length === 0}
            >
              {failedScenarioOptions.length === 0 ? (
                <option value="">No failed scenario available</option>
              ) : (
                failedScenarioOptions.map((scenario) => (
                  <option key={scenario.scenarioId} value={scenario.scenarioId}>
                    {scenario.scenarioId} - {scenario.feature}
                  </option>
                ))
              )}
            </select>
          </div>
          <textarea
            rows={2}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Try this case again using CSS selector .add-to-cart-btn ... (Urdu/English mix supported)"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <button
            type="button"
            onClick={sendRetryInstruction}
            disabled={retryBusy || chatInput.trim().length === 0}
            className="h-10 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </section>

      {executionRun?.responsiveReport ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Responsive Findings</h3>
            <Badge variant="secondary">
              {executionRun.responsiveReport.summary.issueViewports}/
              {executionRun.responsiveReport.summary.totalViewports} viewports with issues
            </Badge>
          </div>
          <div className="space-y-2">
            {executionRun.responsiveReport.findings.map((item, index) => (
              <article
                key={responsiveFindingKey(item, index)}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{responsiveFindingLabel(item)}</p>
                  <Badge
                    variant={
                      item.layoutBreakage ||
                      item.hiddenCtas ||
                      item.horizontalScroll ||
                      item.menuUsabilityIssue ||
                      item.formVisibilityIssue ||
                      item.overlappingElements ||
                      item.cartOrSearchVisibilityIssue
                        ? "warning"
                        : "success"
                    }
                  >
                    {item.notes.length > 0 ? "Issues detected" : "Healthy"}
                  </Badge>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                  <p>Layout breakage: {item.layoutBreakage ? "Yes" : "No"}</p>
                  <p>Hidden CTAs: {item.hiddenCtas ? "Yes" : "No"}</p>
                  <p>Horizontal scroll: {item.horizontalScroll ? "Yes" : "No"}</p>
                  <p>Menu usability: {item.menuUsabilityIssue ? "Issue" : "OK"}</p>
                  <p>Form visibility: {item.formVisibilityIssue ? "Issue" : "OK"}</p>
                  <p>Overlapping elements: {item.overlappingElements ? "Issue" : "No"}</p>
                  <p>Cart/search visibility: {item.cartOrSearchVisibilityIssue ? "Issue" : "OK"}</p>
                </div>
                {item.notes.length > 0 ? (
                  <div className="mt-2 text-xs">
                    {item.notes.map((note, noteIndex) => (
                      <p key={`${responsiveFindingKey(item, index)}-note-${noteIndex}`}>{note}</p>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {executionRun?.brokenLinksReport ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Broken Links Report</h3>
            <Badge variant={executionRun.brokenLinksReport.failedCount > 0 ? "warning" : "success"}>
              {executionRun.brokenLinksReport.failedCount} failures /{" "}
              {executionRun.brokenLinksReport.checkedCount} checked
            </Badge>
          </div>
          <div className="space-y-2">
            {executionRun.brokenLinksReport.findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No broken links detected in header, footer, CTA, internal, or image links.
              </p>
            ) : (
              executionRun.brokenLinksReport.findings.map((item, index) => (
                <article key={`${item.targetUrl}-${index}`} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{item.targetUrl}</p>
                    <Badge variant="warning">
                      {item.failureType}
                      {item.statusCode ? ` (${item.statusCode})` : ""}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Category: {item.category} • Source: {item.fromUrl}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {executionRun?.formsReport ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Forms Testing Report</h3>
            <Badge variant="secondary">{executionRun.formsReport.formsDetected} forms detected</Badge>
          </div>
          <div className="space-y-2">
            {executionRun.formsReport.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No eligible forms detected.</p>
            ) : (
              executionRun.formsReport.results.map((item, index) => (
                <article key={`${item.formType}-${index}`} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium capitalize">{item.formType} form</p>
                    <Badge
                      variant={
                        item.requiredFieldsOk &&
                        item.invalidEmailValidationOk &&
                        (item.successfulSubmissionPassed || !item.successfulSubmissionAttempted)
                          ? "success"
                          : "warning"
                      }
                    >
                      {item.successfulSubmissionAttempted
                        ? item.successfulSubmissionPassed
                          ? "Submission verified"
                          : "Submission failed"
                        : "Submission skipped/safe"}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Required fields: {item.requiredFieldsOk ? "OK" : "Issue"}</p>
                    <p>Invalid email validation: {item.invalidEmailValidationOk ? "OK" : "Not confirmed"}</p>
                    <p>Validation messages: {item.validationMessageDetected ? "Detected" : "Not detected"}</p>
                    <p>Successful submission attempted: {item.successfulSubmissionAttempted ? "Yes" : "No"}</p>
                  </div>
                  {item.skippedSubmissionReason ? (
                    <p className="mt-1 text-xs text-amber-700">{item.skippedSubmissionReason}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {executionRun?.accessibilityRiskReport ? (
        <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Accessibility Risk Findings</h3>
            <Badge variant={executionRun.accessibilityRiskReport.summary.totalFindings > 0 ? "warning" : "success"}>
              {executionRun.accessibilityRiskReport.summary.totalFindings} findings
            </Badge>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {executionRun.accessibilityRiskReport.disclaimer}
          </p>
          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
            <p>High: {executionRun.accessibilityRiskReport.summary.high}</p>
            <p>Medium: {executionRun.accessibilityRiskReport.summary.medium}</p>
            <p>Low: {executionRun.accessibilityRiskReport.summary.low}</p>
            <p>
              Checked at:{" "}
              {formatLocalDateTime(executionRun.accessibilityRiskReport.checkedAt)}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {executionRun.accessibilityRiskReport.findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No obvious accessibility risk findings detected.</p>
            ) : (
              executionRun.accessibilityRiskReport.findings.map((finding, index) => (
                <article
                  key={`a11y-${index}-${finding.id}-${finding.pageUrl}`}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{finding.category}</p>
                    <Badge
                      variant={
                        finding.severity === "high"
                          ? "danger"
                          : finding.severity === "medium"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {finding.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{finding.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{finding.pageUrl}</p>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Top Findings</h3>
          <Badge variant="secondary">
            {loadingRun ? "Loading latest run..." : executionRun ? "Live execution data" : "No live run yet"}
          </Badge>
        </div>
        <div className="space-y-3">
          {dynamicFindings.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              No findings yet. Run a live execution to populate this view.
            </p>
          ) : (
            dynamicFindings.map((finding, index) => (
              <button
                key={`finding-${index}-${finding.title}`}
                type="button"
                className="qa-card block w-full rounded-lg border p-3 text-left"
                onClick={() => setSelectedFinding(finding)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">{finding.title}</h4>
                  <Badge variant={finding.severity === "High" ? "danger" : "warning"}>
                    {finding.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{finding.details}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Bug Intelligence</h3>
          <Badge variant="secondary">
            {executionRun ? "Connected to latest execution report" : "No live execution report yet"}
          </Badge>
        </div>
        <div className="space-y-3">
          {activeBugReports.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              No bug reports yet. Launch a run and failed scenarios will appear here.
            </p>
          ) : (
            activeBugReports.map((bug, index) => (
              <article key={`bug-${index}-${bug.summary}`} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{bug.summary}</h4>
                <Badge variant={bug.severity === "Critical" ? "danger" : "warning"}>
                  {bug.severity} • {bug.priority}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{bug.description}</p>
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                <strong>Observed:</strong> {bug.actualResult}
              </p>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <p>Confidence: {bug.confidenceScore}%</p>
                <p>User impact: {bug.userImpact}</p>
                <p>Revenue impact: {bug.revenueImpact}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Business impact: {bug.businessImpact}
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => reportBugToJira(bug)}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Report to JIRA
                </button>
              </div>

              <details className="mt-3 rounded-md border p-2">
                <summary className="cursor-pointer text-xs font-medium">
                  Technical details (expand)
                </summary>
                <div className="mt-2 space-y-2 text-xs">
                  <div>
                    <p className="font-medium">Steps to reproduce</p>
                    {bug.stepsToReproduce.map((step, stepIndex) => (
                      <p key={`step-${stepIndex}`}>{step}</p>
                    ))}
                  </div>
                  <p>
                    <strong>Expected:</strong> {bug.expectedResult}
                  </p>
                  <p>
                    <strong>Actual:</strong> {bug.actualResult}
                  </p>
                  <p>
                    <strong>Screenshot ref:</strong> {bug.screenshot ?? "No screenshot available."}
                  </p>
                  <p>
                    <strong>Error:</strong> {bug.technicalDetails.errorReason}
                  </p>
                  <p>
                    <strong>Root cause:</strong> {bug.rootCauseAnalysis}
                  </p>
                  <div>
                    <p className="font-medium">Recovery attempts</p>
                    {bug.recoveryAttempts.map((attempt, attemptIndex) => (
                      <p key={`attempt-${attemptIndex}`}>{attempt}</p>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium">Console errors</p>
                    {bug.technicalDetails.consoleErrors.map((error, errorIndex) => (
                      <p key={`console-${errorIndex}`}>{error}</p>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium">Network errors</p>
                    {bug.technicalDetails.networkErrors.map((error, errorIndex) => (
                      <p key={`network-${errorIndex}`}>{error}</p>
                    ))}
                  </div>
                </div>
              </details>
              </article>
            ))
          )}
        </div>
      </section>

      {selectedFinding ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setSelectedFinding(null)}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            className="absolute right-0 top-0 h-full w-full max-w-md border-l bg-white p-4 shadow-xl dark:bg-slate-950"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finding-detail-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Finding Detail</p>
                <h3 id="finding-detail-title" className="text-lg font-semibold">
                  {selectedFinding.title}
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rounded-md border p-2 text-muted-foreground hover:bg-muted"
                onClick={() => setSelectedFinding(null)}
                aria-label="Close finding details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <Badge variant={selectedFinding.severity === "High" ? "danger" : "warning"}>
                {selectedFinding.severity}
              </Badge>
              <section className="space-y-1 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Issue</p>
                <p>{selectedFinding.details}</p>
                {selectedFinding.actualResult &&
                selectedFinding.actualResult !== selectedFinding.details ? (
                  <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                    <strong>What failed:</strong> {selectedFinding.actualResult}
                  </p>
                ) : null}
              </section>
              <section className="space-y-1 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Impacted Area</p>
                <p>{selectedFinding.impactedArea}</p>
              </section>
              <section className="space-y-1 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Suggested Action</p>
                <p>{selectedFinding.suggestedAction}</p>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
