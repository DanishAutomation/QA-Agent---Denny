-- SQLite-first schema with PostgreSQL-compatible naming conventions.

CREATE TABLE IF NOT EXISTS qa_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qa_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY(project_id) REFERENCES qa_projects(id)
);

CREATE TABLE IF NOT EXISTS bug_insights (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  FOREIGN KEY(run_id) REFERENCES qa_runs(id)
);
