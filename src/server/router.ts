export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  description: string;
}

export const apiRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/api/health",
    description: "Service availability checks for platform dependencies.",
  },
  {
    method: "GET",
    path: "/api/agents",
    description: "Returns registered QA agent modules and metadata.",
  },
  {
    method: "POST",
    path: "/api/runs",
    description: "Creates an AI QA run using orchestration workflows.",
  },
];
