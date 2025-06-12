import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  matricNumber: string;
  userId: mongoose.Types.ObjectId;
  votes: {
    position: string;
    candidateIds: string[];
  }[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>({
  matricNumber: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  votes: [{
    position: {
      type: String,
      required: true,
    },
    candidateIds: [{
      type: String,
      required: true,
    }],
  }],
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Create indexes for better performance
VoteSchema.index({ matricNumber: 1 });
VoteSchema.index({ userId: 1 });
VoteSchema.index({ createdAt: -1 });
VoteSchema.index({ 'votes.position': 1 });

export default mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);