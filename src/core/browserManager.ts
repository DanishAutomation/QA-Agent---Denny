export interface BrowserSessionDescriptor {
  sessionId: string;
  provider: "playwright-mcp";
  state: "ready" | "busy" | "closed";
}

export class BrowserManager {
  createSession(): BrowserSessionDescriptor {
    return {
      sessionId: `session-${Date.now()}`,
      provider: "playwright-mcp",
      state: "ready",
    };
  }
}

export const browserManager = new BrowserManager();
