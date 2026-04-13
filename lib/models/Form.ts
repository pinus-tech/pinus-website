import mongoose from 'mongoose';

const FIELD_TYPES = [
  'text',
  'number',
  'date',
  'checkbox',
  'dropdown',
  'multiple_choice',
  'section',
  'segmented_text',
] as const;

export interface IForm extends mongoose.Document {
  title: string;
  description?: string;
  /** When true, `description` is rendered as Markdown instead of plain text. */
  descriptionMarkdown?: boolean;
  createdBy: mongoose.Types.ObjectId;
  managers: mongoose.Types.ObjectId[];
  fields: {
    label: string;
    type: (typeof FIELD_TYPES)[number];
    options?: string[];
    required: boolean;
    description?: string;
    dateMode?: 'date' | 'datetime' | 'time';
    sectionTitle?: string;
    sectionDescription?: string;
    sectionDisplay?: 'both' | 'title_only' | 'description_only';
    segmentDelimiter?: string;
    minSelections?: number;
    maxSelections?: number;
    minLength?: number;
    maxLength?: number;
  }[];
  responses: mongoose.Types.ObjectId[];
  isActive: boolean;
  /** When false, only staff (admins / creators / managers) can open or fill; participants need this enabled (Share). */
  isShared: boolean;
  /** Optional short path: /f/{slug} → /forms/{id} */
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  descriptionMarkdown: { type: Boolean, default: false },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  fields: [{
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: FIELD_TYPES, 
      required: true 
    },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    dateMode: { type: String, enum: ['date', 'datetime', 'time'] },
    sectionTitle: { type: String },
    sectionDescription: { type: String },
    sectionDisplay: { type: String, enum: ['both', 'title_only', 'description_only'] },
    segmentDelimiter: { type: String },
    description: { type: String },
    minSelections: { type: Number },
    maxSelections: { type: Number },
    minLength: { type: Number },
    maxLength: { type: Number },
  }],
  responses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Response' 
  }],
  isActive: { type: Boolean, default: true },
  isShared: { type: Boolean, default: false },
  slug: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    maxlength: 80,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Form || mongoose.model<IForm>('Form', formSchema);
