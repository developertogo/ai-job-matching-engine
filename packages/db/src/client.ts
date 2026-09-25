import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

// Support TURSO_DATABASE_URL or fall back to local sqlite file in workspace root
function getDbUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  // Default to local.db at workspace root
  const defaultLocalDb = path.resolve(__dirname, '../../../local.db');
  return `file:${defaultLocalDb}`;
}

export const libsqlClient: Client = createClient({
  url: getDbUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(libsqlClient, { schema });
export { schema };
