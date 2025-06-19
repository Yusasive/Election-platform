import mongoose, { Document, Schema } from 'mongoose';

export interface IPosition extends Document {
  position: string;
  allowMultiple: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema<IPosition>({
  position: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  allowMultiple: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Optimized indexes
PositionSchema.index({ position: 1 }, { unique: true });
PositionSchema.index({ isActive: 1 });

export default mongoose.models.Position || mongoose.model<IPosition>('Position', PositionSchema);