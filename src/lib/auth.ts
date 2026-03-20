import { randomBytes } from "node:crypto";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

import { db } from "@/lib/db/client";
import { sendOrganizationInvitationEmail } from "@/lib/invitation-email";
import * as schema from "@/lib/db/schema/auth";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const secret = process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex");

export const auth = betterAuth({
  baseURL,
  secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      schema: {
        invitation: {
          additionalFields: {
            fullName: {
              type: "string",
              required: false,
              input: true,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        await sendOrganizationInvitationEmail(data, baseURL);
      },
    }),
  ],
  trustedOrigins: [baseURL],
});
