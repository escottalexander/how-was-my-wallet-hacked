import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

// Returns the D1 binding for the current request. Available in route handlers
// and server components during a request; works under `next dev` because
// next.config.ts calls initOpenNextCloudflareForDev().
export function getDb(): D1Database {
  return getCloudflareContext().env.DB as D1Database;
}
