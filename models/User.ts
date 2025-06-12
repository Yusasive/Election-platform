import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  matricNumber: string;
  fullName: string;
  department: string;
  image?: string;
  hasVoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  matricNumber: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Create indexes for better performance
UserSchema.index({ matricNumber: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ hasVoted: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);