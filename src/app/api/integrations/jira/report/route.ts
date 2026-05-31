import { NextRequest, NextResponse } from "next/server";
import {
  buildBugDescription,
  buildJiraAdfDescription,
  buildJiraBasicAuthHeader,
  buildJiraProjectCreateUrl,
  hasJiraApiCredentials,
  normalizeJiraBaseUrl,
  normalizeProjectKey,
} from "@/lib/jira";
import type {
  JiraCreateIssueRequest,
  JiraCreateIssueResponse,
} from "@/types";

export const runtime = "nodejs";

async function resolveAssigneeAccountId(
  baseUrl: string,
  authHeader: string,
  assigneeQuery: string
): Promise<string | undefined> {
  const query = assigneeQuery.trim();
  if (!query) {
    return undefined;
  }

  const searchUrl = `${baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(query)}&maxResults=5`;
  const response = await fetch(searchUrl, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const users = (await response.json().catch(() => [])) as Array<{
    accountId?: string;
    emailAddress?: string;
    displayName?: string;
  }>;

  if (users.length === 0) {
    return undefined;
  }

  const normalizedQuery = query.toLowerCase();
  const exactMatch = users.find(
    (user) =>
      user.emailAddress?.toLowerCase() === normalizedQuery ||
      user.displayName?.toLowerCase() === normalizedQuery
  );

  return (exactMatch ?? users[0]).accountId;
}

async function createJiraIssue(
  baseUrl: string,
  authHeader: string,
  fields: Record<string, unknown>
): Promise<{ ok: true; key: string } | { ok: false; message: string }> {
  const jiraApiUrl = `${baseUrl}/rest/api/3/issue`;
  const response = await fetch(jiraApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ fields }),
  });

  const raw = (await response.json().catch(() => ({}))) as {
    key?: string;
    errors?: Record<string, string>;
    errorMessages?: string[];
  };

  if (!response.ok || !raw.key) {
    return {
      ok: false,
      message:
        raw.errorMessages?.join(", ") ||
        Object.values(raw.errors ?? {}).join(", ") ||
        `JIRA issue creation failed (${response.status}).`,
    };
  }

  return { ok: true, key: raw.key };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as JiraCreateIssueRequest | null;
  if (!body?.bugReport || !body?.settings) {
    const payload: JiraCreateIssueResponse = {
      ok: false,
      message: "bugReport and settings are required.",
    };
    return NextResponse.json(payload, { status: 400 });
  }

  const settings = body.settings;
  const summary = body.bugReport.summary.slice(0, 200);
  const description = buildBugDescription(body.bugReport);
  const fallbackCreateUrl = buildJiraProjectCreateUrl(settings);

  if (!hasJiraApiCredentials(settings)) {
    const payload: JiraCreateIssueResponse = {
      ok: false,
      fallbackCreateUrl,
      message:
        "JIRA API is not fully configured. Add your Atlassian account email, API token, and project key (QA) in Settings, then save.",
      copiedPayloadText: description,
    };
    return NextResponse.json(payload);
  }

  const projectKeyResult = normalizeProjectKey(settings.projectKey);
  if (projectKeyResult.error) {
    const payload: JiraCreateIssueResponse = {
      ok: false,
      fallbackCreateUrl,
      message: projectKeyResult.error,
      copiedPayloadText: description,
    };
    return NextResponse.json(payload);
  }

  const baseUrl = normalizeJiraBaseUrl(settings.baseUrl);
  const authHeader = buildJiraBasicAuthHeader(settings.apiEmail!, settings.apiToken!);

  const issueFields: Record<string, unknown> = {
    project: { key: projectKeyResult.key },
    issuetype: { name: settings.issueType.trim() },
    summary,
    description: buildJiraAdfDescription(description),
  };

  if (settings.defaultAssignee?.trim()) {
    try {
      const accountId = await resolveAssigneeAccountId(
        baseUrl,
        authHeader,
        settings.defaultAssignee
      );
      if (accountId) {
        issueFields.assignee = { id: accountId };
      }
    } catch {
      // Assignee is optional; continue without it if lookup fails.
    }
  }

  try {
    let createResult = await createJiraIssue(baseUrl, authHeader, issueFields);

    if (
      !createResult.ok &&
      settings.defaultAssignee?.trim() &&
      /assignee/i.test(createResult.message)
    ) {
      const fieldsWithoutAssignee = { ...issueFields };
      delete fieldsWithoutAssignee.assignee;
      createResult = await createJiraIssue(baseUrl, authHeader, fieldsWithoutAssignee);
    }

    if (!createResult.ok) {
      const payload: JiraCreateIssueResponse = {
        ok: false,
        fallbackCreateUrl,
        message: createResult.message,
        copiedPayloadText: description,
      };
      return NextResponse.json(payload, { status: 200 });
    }

    const issueUrl = `${baseUrl}/browse/${createResult.key}`;
    const payload: JiraCreateIssueResponse = {
      ok: true,
      issueKey: createResult.key,
      issueUrl,
      message: `JIRA issue ${createResult.key} created successfully.`,
    };
    return NextResponse.json(payload);
  } catch {
    const payload: JiraCreateIssueResponse = {
      ok: false,
      fallbackCreateUrl,
      message: "Could not reach JIRA API. Check your base URL, email, and API token in Settings.",
      copiedPayloadText: description,
    };
    return NextResponse.json(payload, { status: 200 });
  }
}
