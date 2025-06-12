import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidate extends Document {
  id: number;
  name: string;
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

export default mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);