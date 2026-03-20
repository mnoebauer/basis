import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { waitlist } from "@/lib/db/schema/waitlist";
import { Resend } from "resend";

function buildWaitlistEmailHtml() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://withbasis.app";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're on the waitlist</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111111;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.06); padding: 48px 40px;">
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.04em;">Basis</span>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0 0 24px; font-size: 32px; font-weight: 600; line-height: 1.1; letter-spacing: -0.035em; color: #111111;">
                    You're on the list
                  </h1>
                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: rgba(17, 17, 17, 0.62); max-width: 460px;">
                    Thank you for joining the Basis waitlist. We are building a calmer operating system for hiring teams, and we'll let you know as soon as a spot opens up for you.
                  </p>
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="border-radius: 8px;" bgcolor="#111111">
                        <a href="${appUrl}" target="_blank" style="font-size: 15px; font-weight: 500; text-decoration: none; color: #ffffff; background-color: #111111; border: 1px solid #111111; border-radius: 8px; padding: 12px 24px; display: inline-block;">
                          Learn more about Basis
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 48px; border-top: 1px solid rgba(17, 17, 17, 0.08); margin-top: 48px;">
                  <p style="margin: 0; font-size: 14px; color: rgba(17, 17, 17, 0.45);">
                    Basis &copy; ${new Date().getFullYear()} &middot; A calmer operating system for hiring
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const id = randomUUID();

    await db.insert(waitlist).values({
      id,
      email: email.toLowerCase().trim(),
    }).onConflictDoNothing({ target: waitlist.email });
    
    // Send confirmation email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = process.env.INVITE_EMAIL_FROM || "office@withbasis.app";
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You're on the Basis waitlist",
        html: buildWaitlistEmailHtml(),
      });
    } else {
      console.warn("RESEND_API_KEY is not set; skipping waitlist confirmation email.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}