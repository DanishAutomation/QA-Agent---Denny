export interface DeviceProfile {
  id: string;
  label: string;
  viewport: { width: number; height: number };
}

const DEFAULT_PROFILES: DeviceProfile[] = [
  { id: "desktop", label: "Desktop 1440p", viewport: { width: 1440, height: 900 } },
  { id: "tablet", label: "Tablet", viewport: { width: 834, height: 1112 } },
  { id: "mobile", label: "Mobile", viewport: { width: 390, height: 844 } },
];

export class DeviceManager {
  listProfiles(): DeviceProfile[] {
    return DEFAULT_PROFILES;
  }
}

export const deviceManager = new DeviceManager();
