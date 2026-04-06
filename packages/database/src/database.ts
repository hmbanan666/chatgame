import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import * as tables from './tables'

let _db: ReturnType<typeof drizzle<typeof tables>> | null = null
let _migrationPromise: Promise<void> | null = null

export function useCreateDatabase(url: string) {
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: false,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })

  pool.on('error', (err) => {
    console.error('[database] Pool connection error:', err.message)
  })

  _db = drizzle({ client: pool, schema: tables })
}

export function useDatabase() {
  if (!_db) {
    throw new Error('Database is not created. Call useCreateDatabase() first.')
  }
  return _db
}

export async function useMigrateDatabase(migrationsFolder: string) {
  if (!_db) {
    throw new Error('Database is not created')
  }

  _migrationPromise = migrate(_db, {
    migrationsFolder: resolve(migrationsFolder),
  })

  await _migrationPromise
}

export async function waitForMigration() {
  if (_migrationPromise) {
    await _migrationPromise
  }
}

/** Base query interface — compatible with both full DB connections and transactions */
export type Database = PgDatabase<NodePgQueryResultHKT, typeof tables>
