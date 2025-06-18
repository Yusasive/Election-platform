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

// Remove duplicate indexes - only use schema.index()
PositionSchema.index({ position: 1 });
PositionSchema.index({ isActive: 1 });

export default mongoose.models.Position || mongoose.model<IPosition>('Position', PositionSchema);