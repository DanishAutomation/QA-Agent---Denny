import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  CreateExecutionHistoryInput,
  ExecutionHistoryRun,
  UpdateExecutionHistoryInput,
} from "@/types";

interface ExecutionRow {
  execution_id: string;
  website_url: string;
  test_type: string;
  browser: string;
  mode: string;
  devices_json: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  total_cases: number;
  passed: number;
  failed: number;
  skipped: number;
  bugs_found: number;
  report_path: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const dbFilePath = path.join(process.cwd(), "src", "database", "dennyqa.sqlite");
fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

const db = new Database(dbFilePath);

function mapRow(row: ExecutionRow): ExecutionHistoryRun {
  return {
    executionId: row.execution_id,
    websiteUrl: row.website_url,
    testType: row.test_type,
    browser: row.browser,
    mode: row.mode as ExecutionHistoryRun["mode"],
    devices: JSON.parse(row.devices_json) as string[],
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: row.duration_seconds,
    totalCases: row.total_cases,
    passed: row.passed,
    failed: row.failed,
    skipped: row.skipped,
    bugsFound: row.bugs_found,
    reportPath: row.report_path,
    status: row.status as ExecutionHistoryRun["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function initializeExecutionHistoryTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_history_runs (
      execution_id TEXT PRIMARY KEY,
      website_url TEXT NOT NULL,
      test_type TEXT NOT NULL,
      browser TEXT NOT NULL,
      mode TEXT NOT NULL,
      devices_json TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      total_cases INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      bugs_found INTEGER NOT NULL DEFAULT 0,
      report_path TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function createExecutionHistoryRun(
  input: CreateExecutionHistoryInput
): ExecutionHistoryRun {
  initializeExecutionHistoryTable();

  const now = new Date().toISOString();
  const executionId = `EX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const statement = db.prepare(`
    INSERT INTO execution_history_runs (
      execution_id, website_url, test_type, browser, mode, devices_json,
      start_time, end_time, duration_seconds, total_cases, passed, failed,
      skipped, bugs_found, report_path, status, created_at, updated_at
    ) VALUES (
      @execution_id, @website_url, @test_type, @browser, @mode, @devices_json,
      @start_time, @end_time, @duration_seconds, @total_cases, @passed, @failed,
      @skipped, @bugs_found, @report_path, @status, @created_at, @updated_at
    );
  `);

  statement.run({
    execution_id: executionId,
    website_url: input.websiteUrl,
    test_type: input.testType,
    browser: input.browser,
    mode: input.mode,
    devices_json: JSON.stringify(input.devices),
    start_time: input.startTime,
    end_time: input.endTime,
    duration_seconds: input.durationSeconds,
    total_cases: input.totalCases,
    passed: input.passed,
    failed: input.failed,
    skipped: input.skipped,
    bugs_found: input.bugsFound,
    report_path: input.reportPath,
    status: input.status,
    created_at: now,
    updated_at: now,
  });

  return getExecutionHistoryRunById(executionId)!;
}

export function getExecutionHistoryRunById(
  executionId: string
): ExecutionHistoryRun | undefined {
  initializeExecutionHistoryTable();

  const row = db
    .prepare("SELECT * FROM execution_history_runs WHERE execution_id = ?")
    .get(executionId) as ExecutionRow | undefined;
  return row ? mapRow(row) : undefined;
}

export function listExecutionHistoryRuns(): ExecutionHistoryRun[] {
  initializeExecutionHistoryTable();

  const rows = db
    .prepare("SELECT * FROM execution_history_runs ORDER BY start_time DESC")
    .all() as ExecutionRow[];
  return rows.map(mapRow);
}

export function updateExecutionHistoryRun(
  executionId: string,
  input: UpdateExecutionHistoryInput
): ExecutionHistoryRun | undefined {
  initializeExecutionHistoryTable();
  const existing = getExecutionHistoryRunById(executionId);
  if (!existing) {
    return undefined;
  }

  const next = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE execution_history_runs
    SET end_time = @end_time,
        duration_seconds = @duration_seconds,
        total_cases = @total_cases,
        passed = @passed,
        failed = @failed,
        skipped = @skipped,
        bugs_found = @bugs_found,
        report_path = @report_path,
        status = @status,
        updated_at = @updated_at
    WHERE execution_id = @execution_id
  `).run({
    execution_id: executionId,
    end_time: next.endTime,
    duration_seconds: next.durationSeconds,
    total_cases: next.totalCases,
    passed: next.passed,
    failed: next.failed,
    skipped: next.skipped,
    bugs_found: next.bugsFound,
    report_path: next.reportPath,
    status: next.status,
    updated_at: next.updatedAt,
  });

  return getExecutionHistoryRunById(executionId);
}

export function deleteExecutionHistoryRun(executionId: string): boolean {
  initializeExecutionHistoryTable();
  const result = db
    .prepare("DELETE FROM execution_history_runs WHERE execution_id = ?")
    .run(executionId);
  return result.changes > 0;
}

export function seedMockExecutionHistoryRuns(): void {
  initializeExecutionHistoryTable();
  const countResult = db
    .prepare("SELECT COUNT(*) as count FROM execution_history_runs")
    .get() as { count: number };

  if (countResult.count > 0) {
    return;
  }

  const now = Date.now();
  const seedEntries: CreateExecutionHistoryInput[] = [
    {
      websiteUrl: "https://storefront.demo",
      testType: "Ecommerce Journey",
      browser: "Chrome",
      mode: "Headless",
      devices: ["Desktop", "iPhone"],
      startTime: new Date(now - 1000 * 60 * 30).toISOString(),
      endTime: new Date(now - 1000 * 60 * 24).toISOString(),
      durationSeconds: 360,
      totalCases: 18,
      passed: 15,
      failed: 2,
      skipped: 1,
      bugsFound: 2,
      reportPath: "/reports/mock-report-run-1.html",
      status: "completed",
    },
    {
      websiteUrl: "https://marketing.demo",
      testType: "Broken Links",
      browser: "Edge",
      mode: "Headed",
      devices: ["Desktop"],
      startTime: new Date(now - 1000 * 60 * 15).toISOString(),
      endTime: null,
      durationSeconds: 420,
      totalCases: 12,
      passed: 8,
      failed: 1,
      skipped: 0,
      bugsFound: 1,
      reportPath: "/reports/mock-report-run-2.html",
      status: "running",
    },
    {
      websiteUrl: "https://portal.demo",
      testType: "Login",
      browser: "Firefox",
      mode: "Headless",
      devices: ["Desktop", "Android"],
      startTime: new Date(now - 1000 * 60 * 90).toISOString(),
      endTime: new Date(now - 1000 * 60 * 80).toISOString(),
      durationSeconds: 600,
      totalCases: 10,
      passed: 6,
      failed: 3,
      skipped: 1,
      bugsFound: 3,
      reportPath: "/reports/mock-report-run-3.html",
      status: "failed",
    },
  ];

  for (const entry of seedEntries) {
    createExecutionHistoryRun(entry);
  }
}
