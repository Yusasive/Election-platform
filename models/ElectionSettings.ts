import mongoose, { Document, Schema } from 'mongoose';

export interface IElectionSettings extends Document {
  votingStartTime: Date;
  votingEndTime: Date;
  loginDuration: number; // in minutes
  isVotingActive: boolean;
  maxVotesPerUser: number;
  allowRevoting: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ElectionSettingsSchema = new Schema<IElectionSettings>({
  votingStartTime: {
    type: Date,
    required: true,
  },
  votingEndTime: {
    type: Date,
    required: true,
  },
  loginDuration: {
    type: Number,
    default: 35, // 35 minutes
    min: 1,
    max: 120,
  },
  isVotingActive: {
    type: Boolean,
    default: false,
  },
  maxVotesPerUser: {
    type: Number,
    default: 1,
    min: 1,
  },
  allowRevoting: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.ElectionSettings || mongoose.model<IElectionSettings>('ElectionSettings', ElectionSettingsSchema);