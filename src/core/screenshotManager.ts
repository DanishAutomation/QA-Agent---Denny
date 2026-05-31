export interface ScreenshotArtifact {
  id: string;
  runId: string;
  label: string;
  path: string;
}

export class ScreenshotManager {
  getStorageRoot(): string {
    return "./src/reports/screenshots";
  }
}

export const screenshotManager = new ScreenshotManager();
