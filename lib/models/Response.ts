import mongoose from 'mongoose';

export interface IResponse extends mongoose.Document {
  formId: mongoose.Types.ObjectId;
  respondent: mongoose.Types.ObjectId;
  responses: {
    fieldLabel: string;
    value: any;
  }[];
  submittedAt: Date;
}

const responseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  respondent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  responses: [{
    fieldLabel: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Response || mongoose.model<IResponse>('Response', responseSchema); 