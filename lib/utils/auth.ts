import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mailjet from 'node-mailjet';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAILJET_API_KEY = process.env.MAILJET_API_KEY!;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY!;
const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL!;

// Initialize Mailjet
const mailjetClient = mailjet.apiConnect(MAILJET_API_KEY, MAILJET_SECRET_KEY);

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string, isAdmin: boolean, isSuperAdmin: boolean = false, permissions: any = {}) => {
  return jwt.sign(
    { 
      userId, 
      isAdmin, 
      isSuperAdmin,
      permissions
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Permission checking utilities
export const hasPermission = (user: any, permission: string): boolean => {
  if (user.isSuperAdmin) return true; // Super admin has all permissions
  return user.permissions && user.permissions[permission];
};

export const canApproveAccounts = (user: any): boolean => {
  return user.isSuperAdmin || (user.isAdmin && hasPermission(user, 'canApproveAccounts'));
};

export const canCreateForms = (user: any): boolean => {
  return user.isSuperAdmin || (user.isAdmin && hasPermission(user, 'canCreateForms'));
};

export const canManageUsers = (user: any): boolean => {
  return user.isSuperAdmin || (user.isAdmin && hasPermission(user, 'canManageUsers'));
};

export const canViewAnalytics = (user: any): boolean => {
  return user.isSuperAdmin || (user.isAdmin && hasPermission(user, 'canViewAnalytics'));
};

export const sendApprovalEmail = async (email: string, name: string): Promise<void> => {
  try {
    const request = mailjetClient
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: MAILJET_FROM_EMAIL,
              Name: 'PINUS Online'
            },
            To: [
              {
                Email: email,
                Name: name
              }
            ],
            Subject: 'Welcome to PINUS Online - Your Account Has Been Approved!',
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
            `
          }
        ]
      });

    await request;
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw new Error('Failed to send approval email');
  }
}; 