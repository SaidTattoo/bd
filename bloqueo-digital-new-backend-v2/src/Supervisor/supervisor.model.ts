import mongoose, { Document, Schema } from 'mongoose';
import { IWorker } from '../Worker/worker.model';

export interface ISupervisor extends Document {
  name: string;
  isBlocked: boolean;
  workers: IWorker[];
}

const SupervisorSchema: Schema = new Schema({
  name: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
});

export default mongoose.model<ISupervisor>('Supervisor', SupervisorSchema);
