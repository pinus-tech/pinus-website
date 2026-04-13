import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailjet, { Client } from "node-mailjet";

/**
 * NOTE:
 * - Mailjet MUST NOT be initialized at import time, otherwise the whole server will crash
 *   when MAILJET_* env vars are missing.
 * - This file now lazily creates the Mailjet client only when sendApprovalEmail() is called.
 */

// --- ENV (JWT) ---
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // keep as-is for now

// --- ENV (Mailjet) ---
const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;

/** Public site origin for absolute image URLs in emails (Mailjet requires publicly reachable URLs). */
const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://pinusonline.org";

let mailjetClient : Client | null = null;

/**
 * Lazily create Mailjet client.
 * Returns null if env vars are missing (prevents import-time crash).
 */
function getMailjetClient() : Client | null {
  if (mailjetClient) {
    return mailjetClient;
  }

  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !secretKey) return null;
  mailjetClient = mailjet.apiConnect(apiKey, secretKey);

  return mailjetClient;
}

/** Best-effort parse of node-mailjet / axios errors so we can log and surface real API messages. */
function formatMailjetError(error: unknown): string {
  if (error && typeof error === "object") {
    const o = error as {
      response?: { data?: unknown; status?: number };
      message?: string;
      statusCode?: number;
    };
    if (o.response?.data != null) {
      try {
        const d = o.response.data;
        return typeof d === "string" ? d : JSON.stringify(d);
      } catch {
        /* fall through */
      }
    }
    if (typeof o.message === "string" && o.message.length > 0) {
      return o.message;
    }
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export type SendVerificationEmailResult =
  | { ok: true }
  | { ok: false; error: string };

// Define proper types for permissions and user
interface UserPermissions {
  canCreateForms: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}

interface User {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  permissions: UserPermissions;
}

export interface JWTPayload {
  userId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: UserPermissions;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (
  userId: string,
  isAdmin: boolean,
  isSuperAdmin: boolean = false,
  permissions: UserPermissions = {
    canCreateForms: false,
    canManageUsers: false,
    canViewAnalytics: false,
  }
): string => {
  return jwt.sign(
    {
      userId,
      isAdmin,
      isSuperAdmin,
      permissions,
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

// Permission checking utilities
export const hasPermission = (
  user: User,
  permission: keyof UserPermissions
): boolean => {
  if (user.isSuperAdmin) return true; // Super admin has all permissions
  return user.permissions && user.permissions[permission];
};

export const canCreateForms = (user: User): boolean => {
  return (
    user.isSuperAdmin || (user.isAdmin && hasPermission(user, "canCreateForms"))
  );
};

export const canManageUsers = (user: User): boolean => {
  return (
    user.isSuperAdmin || (user.isAdmin && hasPermission(user, "canManageUsers"))
  );
};

export const canViewAnalytics = (user: User): boolean => {
  return (
    user.isSuperAdmin ||
    (user.isAdmin && hasPermission(user, "canViewAnalytics"))
  );
};

export const sendApprovalEmail = async (
  email: string,
  name: string
): Promise<void> => {
  try {
    // ✅ Create Mailjet client only when sending email
    const mailjetClient = getMailjetClient();

    if (!mailjetClient) {
      throw new Error(
        "Mailjet is not configured (missing MAILJET_API_KEY / MAILJET_SECRET_KEY)"
      );
    }

    if (!MAILJET_FROM_EMAIL) {
      throw new Error("Mailjet is not configured (missing MAILJET_FROM_EMAIL)");
    }

    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: "PINUS Online",
          },
          To: [
            {
              Email: email,
              Name: name,
            },
          ],
          Subject: "Welcome to PINUS Online - Your Account Has Been Approved!",
          HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${PUBLIC_SITE_ORIGIN}/logo-icon-pinus.svg" alt="PINUS Logo" style="height: 60px;">
                  <h1 style="color: #2563eb; margin-top: 10px;">PINUS Online</h1>
                </div>

                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
                  <h2 style="color: #1e293b; margin-top: 0;">Congratulations, ${name}!</h2>

                  <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    We're excited to inform you that your PINUS Online account has been approved by our admin team!
                  </p>

                  <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    You can now access all the features and resources available on our platform.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pinusonline.org/login"
                       style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Login to Your Account
                    </a>
                  </div>

                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                  </p>

                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

                  <p style="color: #64748b; font-size: 12px; text-align: center;">
                    This email was sent by PINUS Online. If you didn't request this, please ignore this email.
                  </p>
                </div>
              </div>
            `,
          TextPart: `
              Congratulations, ${name}!

              Your PINUS Online account has been approved by our admin team.
              You can now login at: https://pinusonline.org/login

              If you have any questions, please contact our support team.

              Best regards,
              PINUS Online Team
            `,
        },
      ],
    });

    await request;
  } catch (error) {
    console.error("Error sending approval email:", error);
    throw new Error("Failed to send approval email");
  }
};

export const sendVerificationEmail = async (
  email: string,
  verificationCode: string
): Promise<SendVerificationEmailResult> => {
  try {
    const mailjetClient = getMailjetClient();

    if (!mailjetClient) {
      return {
        ok: false,
        error:
          "Mailjet is not configured (missing MAILJET_API_KEY / MAILJET_SECRET_KEY)",
      };
    }

    if (!MAILJET_FROM_EMAIL) {
      return {
        ok: false,
        error: "Mailjet is not configured (missing MAILJET_FROM_EMAIL)",
      };
    }

    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: "PINUS Team",
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: "Verify your email — PINUS",
          HTMLPart: `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;padding:0;background-color:#eef1f8;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border-collapse:separate;box-shadow:0 4px 24px rgba(35,46,110,0.12);">
        <tr>
          <td style="background-color:#232E6E;padding:28px 20px;text-align:center;border-bottom:4px solid #EBB726;">
            <img src="${PUBLIC_SITE_ORIGIN}/logo-icon-pinus.svg" alt="PINUS" width="56" height="56" style="display:inline-block;height:56px;width:auto;border:0;" />
            <div style="margin-top:10px;font-family:Georgia,Times New Roman,serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.04em;">PINUS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#232E6E;">Email verification</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">Hello,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">Thank you for registering with PINUS! To complete your registration, enter this verification code on the website:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td align="center" style="padding:22px 16px;background-color:#f4f6fb;border-radius:8px;border-left:5px solid #F7423B;">
                  <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#232E6E;font-family:Courier New,Consolas,monospace;line-height:1.2;">${verificationCode}</div>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 8px;font-size:14px;line-height:1.5;color:#6b7280;">This code will expire in <strong style="color:#232E6E;">10 minutes</strong>.</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#6b7280;">If you did not create an account with us, you can safely ignore this email.</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:20px;">Best regards,<br><span style="color:#232E6E;font-weight:600;">The PINUS Team</span></p>
          </td>
        </tr>
        <tr>
          <td style="background:#232E6E;padding:14px 20px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#c7d1ea;letter-spacing:0.02em;">Perhimpunan Indonesia NUS · <span style="color:#EBB726;">pinusonline.org</span></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
          `,
          TextPart: `
Verify your email — PINUS

Hello,

Thank you for registering with PINUS! To complete your registration, use this verification code on the website:

${verificationCode}

This code will expire in 10 minutes.

If you did not create an account with us, you can safely ignore this email.

Best regards,
The PINUS Team
          `,
        },
      ],
    });

    await request;
    return { ok: true };
  } catch (error) {
    const detail = formatMailjetError(error);
    console.error("Error sending verification email:", detail, error);
    return { ok: false, error: detail };
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};
