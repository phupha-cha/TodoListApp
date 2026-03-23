import mongoose, { Schema, Document } from 'mongoose';

export interface IRoutine extends Document {
  pattern: 'DAILY' | 'WEEKLY';
  daysOfWeek?: number[]; // For weekly pattern (0-6, where 0 is Sunday)
  startDate: Date;
  endDate?: Date;
  time?: string;
  taskTemplate: {
    taskName: string;
    location?: string;
    description?: string;
  };
}

const RoutineSchema = new Schema<IRoutine>(
  {
    pattern: { type: String, enum: ['DAILY', 'WEEKLY'], required: true },
    daysOfWeek: [{ type: Number }], // Valid 0-6 array
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    time: { type: String },
    taskTemplate: {
      taskName: { type: String, required: true },
      location: { type: String },
      description: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);
