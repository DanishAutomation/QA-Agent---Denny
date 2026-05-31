import { appConfig } from "@/core/configManager";
import type { DatabaseProvider } from "@/types";

export interface DatabaseClient {
  provider: DatabaseProvider;
  connectionUrl: string;
}

export function createDatabaseClient(): DatabaseClient {
  return {
    provider: appConfig.database.provider,
    connectionUrl: appConfig.database.connectionUrl,
  };
}

export const databaseClient = createDatabaseClient();
