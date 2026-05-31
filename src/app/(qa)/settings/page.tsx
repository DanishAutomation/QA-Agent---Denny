"use client";

import { useState } from "react";
import { PageTitle } from "@/components/qa/page-title";
import { Badge } from "@/components/ui/badge";
import { JIRA_SETTINGS_STORAGE_KEY } from "@/lib/jira";
import type { JiraIntegrationSettings } from "@/types";

export default function SettingsPage() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [darkReports, setDarkReports] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);
  const [jiraSettings, setJiraSettings] = useState<JiraIntegrationSettings>(() => {
    if (typeof window === "undefined") {
      return {
        baseUrl: "",
        projectKey: "",
        issueType: "Bug",
        defaultAssignee: "",
        apiEmail: "",
        apiToken: "",
      };
    }

    const raw = window.localStorage.getItem(JIRA_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        baseUrl: "",
        projectKey: "",
        issueType: "Bug",
        defaultAssignee: "",
        apiEmail: "",
        apiToken: "",
      };
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
      return {
        baseUrl: "",
        projectKey: "",
        issueType: "Bug",
        defaultAssignee: "",
        apiEmail: "",
        apiToken: "",
      };
    }
  });
  const [saved, setSaved] = useState(false);

  const saveJiraSettings = () => {
    window.localStorage.setItem(JIRA_SETTINGS_STORAGE_KEY, JSON.stringify(jiraSettings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="space-y-4">
      <PageTitle
        title="Settings"
        subtitle="Tune platform defaults and reporting preferences."
        tag="Workspace"
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <h3 className="font-semibold">General Preferences</h3>
          <div className="mt-4 space-y-3">
            <SettingToggle
              label="Execution Alerts"
              description="Get notified when live runs finish or fail."
              enabled={alertsEnabled}
              onToggle={() => setAlertsEnabled((value) => !value)}
            />
            <SettingToggle
              label="Dark Report Theme"
              description="Use dark style for exported report templates."
              enabled={darkReports}
              onToggle={() => setDarkReports((value) => !value)}
            />
            <SettingToggle
              label="Auto Retry Recommendations"
              description="Let retry assistant pre-suggest rerun strategies."
              enabled={autoRetry}
              onToggle={() => setAutoRetry((value) => !value)}
            />
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <h3 className="font-semibold">Platform Configuration</h3>
          <div className="mt-4 space-y-3 text-sm">
            <ConfigRow label="Data Provider" value="SQLite (migration-ready)" />
            <ConfigRow label="Execution Engine" value="Playwright MCP (live)" />
            <ConfigRow label="Agent Profile" value="DennyQA vNext Core Stack" />
            <ConfigRow label="Environment" value="Development" />
          </div>
          <div className="mt-4 rounded-lg border bg-muted/50 p-3">
            <Badge variant="secondary">Info</Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              These settings apply to live execution paths and report integrations.
            </p>
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">JIRA Integration</h3>
            <Badge variant="secondary">Secure local settings</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">JIRA Base URL</span>
              <input
                value={jiraSettings.baseUrl}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, baseUrl: event.target.value }))
                }
                placeholder="https://your-domain.atlassian.net"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Project Key</span>
              <input
                value={jiraSettings.projectKey}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, projectKey: event.target.value }))
                }
                placeholder="QA"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
              <span className="text-xs text-muted-foreground">
                Use the short project key (for example QA), not the project display name (QA Testing).
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Issue Type</span>
              <input
                value={jiraSettings.issueType}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, issueType: event.target.value }))
                }
                placeholder="Bug"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Default Assignee (optional)</span>
              <input
                value={jiraSettings.defaultAssignee}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, defaultAssignee: event.target.value }))
                }
                placeholder="your.email@example.com or display name"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Atlassian Account Email</span>
              <input
                type="email"
                value={jiraSettings.apiEmail ?? ""}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, apiEmail: event.target.value }))
                }
                placeholder="you@example.com"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">API Token</span>
              <input
                type="password"
                value={jiraSettings.apiToken}
                onChange={(event) =>
                  setJiraSettings((prev) => ({ ...prev, apiToken: event.target.value }))
                }
                placeholder="Create at id.atlassian.com/manage-profile/security/api-tokens"
                className="h-10 w-full rounded-lg border px-3 text-foreground placeholder:text-muted-foreground"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={saveJiraSettings}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              Save JIRA Settings
            </button>
            {saved ? (
              <span className="text-xs text-emerald-600">Saved locally.</span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Direct issue creation uses the JIRA REST API with your email and API token. Credentials
            are stored only in local browser storage and are not shown in UI logs.
          </p>
        </article>
      </section>
    </main>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="pr-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? "bg-indigo-600" : "bg-slate-300"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white transition ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
