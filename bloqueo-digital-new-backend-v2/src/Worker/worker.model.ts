import mongoose, { Document, Schema } from 'mongoose';

export interface IWorker extends Document {
  name: string;
}

const WorkerSchema: Schema = new Schema({
  name: { type: String, required: true },
});

export default mongoose.model<IWorker>('Worker', WorkerSchema);
