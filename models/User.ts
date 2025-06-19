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
    maxlength: 20,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
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

// Optimized indexes
UserSchema.index({ matricNumber: 1 }, { unique: true });
UserSchema.index({ department: 1 });
UserSchema.index({ hasVoted: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);