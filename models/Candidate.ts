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
  },
  nickname: {
    type: String,
    trim: true,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  level: {
    type: String,
    trim: true,
    default: '',
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Create indexes
CandidateSchema.index({ position: 1 });
CandidateSchema.index({ id: 1 });
CandidateSchema.index({ department: 1 });

export default mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);