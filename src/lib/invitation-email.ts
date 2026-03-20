type InvitationEmailData = {
  id: string;
  email: string;
  invitation?: {
    fullName?: string;
  };
  organization?: {
    name?: string;
    slug?: string;
  };
  inviter?: {
    user?: {
      name?: string;
      email?: string;
    };
  };
};

function buildInvitationContent(data: InvitationEmailData, inviteLink: string) {
  const organizationName = data.organization?.name || "your organization";
  const inviterName = data.inviter?.user?.name || data.inviter?.user?.email || "A teammate";

  const subject = `You're invited to join ${organizationName}`;

  const text = [
    `${inviterName} invited you to join ${organizationName}.`,
    "",
    `Accept invitation: ${inviteLink}`,
    "",
    "If you did not expect this invite, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">You're invited</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">
        <strong>${inviterName}</strong> invited you to join <strong>${organizationName}</strong>.
      </p>
      <p style="margin: 18px 0;">
        <a
          href="${inviteLink}"
          style="display: inline-block; padding: 10px 14px; background: #111; color: #fff; text-decoration: none; border-radius: 10px; font-size: 14px;"
        >Accept invitation</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #444;">
        If the button doesn't work, copy and paste this URL into your browser:<br />
        <a href="${inviteLink}" style="color: #111;">${inviteLink}</a>
      </p>
    </div>
  `;

  return { subject, text, html };
}

async function sendWithResend(payload: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${payload.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend invitation email failed (${response.status}): ${errorBody}`);
  }
}

async function sendWithPostmark(payload: {
  serverToken: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": payload.serverToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      From: payload.from,
      To: payload.to,
      Subject: payload.subject,
      HtmlBody: payload.html,
      TextBody: payload.text,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Postmark invitation email failed (${response.status}): ${errorBody}`);
  }
}

async function sendWithSes(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error("AWS_REGION or AWS_DEFAULT_REGION is required for SES invitation emails.");
  }

  const { SESv2Client, SendEmailCommand } = await import("@aws-sdk/client-sesv2");

  const client = new SESv2Client({ region });
  const command = new SendEmailCommand({
    FromEmailAddress: payload.from,
    Destination: {
      ToAddresses: [payload.to],
    },
    Content: {
      Simple: {
        Subject: { Data: payload.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: payload.html, Charset: "UTF-8" },
          Text: { Data: payload.text, Charset: "UTF-8" },
        },
      },
    },
  });

  await client.send(command);
}

export async function sendOrganizationInvitationEmail(data: InvitationEmailData, baseURL: string) {
  const provider = (process.env.INVITE_EMAIL_PROVIDER || "resend").toLowerCase();
  const from = process.env.INVITE_EMAIL_FROM;

  if (!from) {
    throw new Error("INVITE_EMAIL_FROM is required for invitation email delivery.");
  }

  const inviteUrl = new URL("/accept-invitation", baseURL);
  inviteUrl.searchParams.set("invitationId", data.id);
  inviteUrl.searchParams.set("email", data.email);
  if (data.invitation?.fullName?.trim()) {
    inviteUrl.searchParams.set("fullName", data.invitation.fullName.trim());
  }

  const inviteLink = inviteUrl.toString();
  const content = buildInvitationContent(data, inviteLink);

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required when INVITE_EMAIL_PROVIDER=resend.");
    }

    await sendWithResend({
      apiKey,
      from,
      to: data.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    return;
  }

  if (provider === "postmark") {
    const serverToken = process.env.POSTMARK_SERVER_TOKEN;
    if (!serverToken) {
      throw new Error("POSTMARK_SERVER_TOKEN is required when INVITE_EMAIL_PROVIDER=postmark.");
    }

    await sendWithPostmark({
      serverToken,
      from,
      to: data.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    return;
  }

  if (provider === "ses") {
    await sendWithSes({
      from,
      to: data.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    return;
  }

  throw new Error("Unsupported INVITE_EMAIL_PROVIDER. Use 'resend', 'postmark', or 'ses'.");
}
