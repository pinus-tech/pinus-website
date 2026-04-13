import mongoose from 'mongoose';

export interface IForm extends mongoose.Document {
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  managers: mongoose.Types.ObjectId[];
  fields: {
    label: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
    options?: string[];
    required: boolean;
  }[];
  responses: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
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
      enum: ['text', 'number', 'date', 'checkbox', 'dropdown'], 
      required: true 
    },
    options: [{ type: String }],
    required: { type: Boolean, default: false }
  }],
  responses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Response' 
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
});

export default mongoose.models.Form || mongoose.model<IForm>('Form', formSchema); 