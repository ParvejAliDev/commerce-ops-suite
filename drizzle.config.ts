import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://ops_app:ops_app@localhost:55432/ops_dashboard',
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/db/schema.ts',
});
