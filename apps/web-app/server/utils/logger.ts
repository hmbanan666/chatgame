import { consola } from 'consola'

/**
 * Centralized logger factory. All server-side logging goes through this.
 *
 * ## Convention
 *
 * 1. One logger per file, created at module level:
 *    `const logger = useLogger('upload')`
 *
 * 2. Tag naming — kebab-case, short, describes the domain:
 *    - Utilities:   `useLogger('s3')`, `useLogger('hot-storage')`
 *    - API routes:  `useLogger('upload')`, `useLogger('subscription')`
 *    - Tasks:       `useLogger('transcode')`, `useLogger('catalog-sync')`
 *    - Plugins:     `useLogger('renewal')`
 *
 * 3. Log levels:
 *    - `logger.info()`  — successful operations worth noting (upload done, sync complete)
 *    - `logger.warn()`  — recoverable issues (skipped item, fallback used)
 *    - `logger.error()` — failures that need attention (S3 down, DB error)
 *    - `logger.debug()` — verbose details for development only
 *
 * 4. Never use `console.log/warn/error` directly — always `useLogger()`.
 *
 * 5. Error logging pattern — pass the error object as the last argument:
 *    `logger.error('S3 cleanup failed:', err)`
 *
 * 6. Include context identifiers (truncated hashes, user IDs) but never secrets:
 *    `logger.info(\`Uploaded \${sha256.slice(0, 8)} for user \${userId}\`)`
 */
export function useLogger(tag?: string) {
  return tag ? consola.withTag(tag) : consola
}
