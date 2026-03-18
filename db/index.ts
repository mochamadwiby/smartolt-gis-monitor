import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as smartoltSchema from './schema/smartolt';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...smartoltSchema,
  },
});

// Re-export schema for convenience
export * from './schema/auth';
export * from './schema/smartolt';