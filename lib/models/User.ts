import mongoose from 'mongoose';

// Career options
export const CAREER_OPTIONS = ['undergrad', 'master', 'phd'] as const;
export type CareerType = typeof CAREER_OPTIONS[number];

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  telegram: string;
  phoneNumber: string;
  isAdmin: boolean;
  isSuperAdmin: boolean; // Main admin with all permissions
  permissions: {
    canApproveAccounts: boolean;
    canCreateForms: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
  };
  city: string;
  major?: string;
  intakeYear?: number;
  yearOfStudy?: number;
  highSchool?: string;
  career?: CareerType;
  isApproved: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telegram: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  permissions: {
    canApproveAccounts: { type: Boolean, default: false },
    canCreateForms: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
  },
  city: { type: String, required: true },
  major: { type: String },
  intakeYear: { type: Number },
  yearOfStudy: { type: Number },
  highSchool: { type: String },
  career: { 
    type: String, 
    enum: CAREER_OPTIONS,
    default: 'undergrad'
  },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema); 