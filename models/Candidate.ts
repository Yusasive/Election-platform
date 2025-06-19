import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidate extends Document {
  id: number;
  name: string;
  nickname?: string;
  image?: string;
  department?: string;
  level?: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  nickname: {
    type: String,
    trim: true,
    default: '',
    maxlength: 50,
  },
  image: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    trim: true,
    default: '',
    maxlength: 100,
  },
  level: {
    type: String,
    trim: true,
    default: '',
    maxlength: 20,
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
}, {
  timestamps: true,
});

// Optimized indexes - no duplicates
CandidateSchema.index({ position: 1, id: 1 }); // Compound index for better performance
CandidateSchema.index({ id: 1 }, { unique: true });

export default mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);