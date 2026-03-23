import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  taskName: string;
  date: string; // YYYY-MM-DD format
  time?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'ABANDONED';
  isRoutine: boolean;
  routineId?: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>(
  {
    taskName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String },
    endDate: { type: String },
    endTime: { type: String },
    location: { type: String },
    description: { type: String },
    bgColor: { type: String },
    textColor: { type: String },
    status: { 
      type: String, 
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'ABANDONED'], 
      default: 'NOT_STARTED' 
    },
    isRoutine: { type: Boolean, default: false },
    routineId: { type: Schema.Types.ObjectId, ref: 'Routine' },
  },
  { timestamps: true }
);

// Compound index for idempotency enforcement on routines
TaskSchema.index({ taskName: 1, date: 1, time: 1, routineId: 1 }, { unique: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
