import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as authSchema from "@/lib/db/schema/auth";
import * as waitlistSchema from "@/lib/db/schema/waitlist";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://invalid:invalid@localhost:5432/invalid";

const queryClient = postgres(databaseUrl, {
  max: 10,
  prepare: false,
});

export const sql = queryClient;

export const db = drizzle(queryClient, {
  schema: { ...authSchema, ...waitlistSchema },
});
