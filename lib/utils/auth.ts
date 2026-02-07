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
                  <img src="https://pinusonline.org/logo-icon-pinus.svg" alt="PINUS Logo" style="height: 60px;">
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

export const sendVerificationEmail = async (email: string, verificationCode: string): Promise<boolean> => {
  try {
    const request = mailjetClient.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: 'PINUS Team',
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: 'Email Verification - PINUS Website',
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Email Verification</h2>
              <p>Hello,</p>
              <p>Thank you for registering with PINUS! To complete your registration, please use the verification code below:</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${verificationCode}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
              <br>
              <p>Best regards,<br>The PINUS Team</p>
            </div>
          `,
          TextPart: `
            Email Verification - PINUS Website
            
            Hello,
            
            Thank you for registering with PINUS! To complete your registration, please use the verification code below:
            
            ${verificationCode}
            
            This code will expire in 10 minutes.
            
            If you didn't create an account with us, please ignore this email.
            
            Best regards,
            The PINUS Team
          `,
        },
      ],
    });

    await request;
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};
