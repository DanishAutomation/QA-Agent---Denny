import fs from "node:fs";
import path from "node:path";
import type { DiscoveryEngineOptions, DiscoveryResult } from "@/types";

const CACHE_DIR = path.join(process.cwd(), "src", "reports", "discovery-cache");
const DISCOVERY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedDiscoveryRecord {
  cacheKey: string;
  baseUrl: string;
  storedAtMs: number;
  result: DiscoveryResult;
}

const memoryCache = new Map<string, CachedDiscoveryRecord>();

function cloneDiscoveryResult(result: DiscoveryResult): DiscoveryResult {
  if (typeof structuredClone === "function") {
    return structuredClone(result);
  }
  return JSON.parse(JSON.stringify(result)) as DiscoveryResult;
}

export function buildDiscoveryCacheKey(
  baseUrl: string,
  options: Pick<DiscoveryEngineOptions, "maxDepth" | "maxPages" | "maxLinksPerPage">
): string {
  return JSON.stringify({
    cacheVersion: 4,
    baseUrl,
    maxDepth: options.maxDepth,
    maxPages: options.maxPages,
    maxLinksPerPage: options.maxLinksPerPage,
  });
}

function cacheFileName(cacheKey: string): string {
  let hash = 0;
  for (let i = 0; i < cacheKey.length; i += 1) {
    hash = (hash * 31 + cacheKey.charCodeAt(i)) >>> 0;
  }
  return `discovery-${hash.toString(16)}.json`;
}

function readDiskCache(cacheKey: string): CachedDiscoveryRecord | null {
  const filePath = path.join(CACHE_DIR, cacheFileName(cacheKey));
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as CachedDiscoveryRecord;
  } catch {
    return null;
  }
}

function isFresh(record: CachedDiscoveryRecord, nowMs: number): boolean {
  return nowMs - record.storedAtMs <= DISCOVERY_CACHE_TTL_MS;
}

export function readCachedDiscovery(cacheKey: string): DiscoveryResult | null {
  const nowMs = Date.now();
  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit && isFresh(memoryHit, nowMs)) {
    return cloneDiscoveryResult(memoryHit.result);
  }

  const diskHit = readDiskCache(cacheKey);
  if (!diskHit || diskHit.cacheKey !== cacheKey || !isFresh(diskHit, nowMs)) {
    return null;
  }

  memoryCache.set(cacheKey, diskHit);
  return cloneDiscoveryResult(diskHit.result);
}

export function writeCachedDiscovery(cacheKey: string, baseUrl: string, result: DiscoveryResult): void {
  const record: CachedDiscoveryRecord = {
    cacheKey,
    baseUrl,
    storedAtMs: Date.now(),
    result: cloneDiscoveryResult(result),
  };
  memoryCache.set(cacheKey, record);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CACHE_DIR, cacheFileName(cacheKey)),
    JSON.stringify(record, null, 2),
    "utf-8"
  );
}
