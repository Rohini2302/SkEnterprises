import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaintenanceRecord {
  type: string;
  description: string;
  cost: number;
  performedBy: string;
  date: Date;
}

export interface IMachine extends Document {
  name: string;
  cost: number;
  purchaseDate: Date;
  quantity: number;
  description?: string;
  status: 'operational' | 'maintenance' | 'out-of-service';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  location?: string;
  manufacturer?: string;
  modelName?: string; // renamed from 'model' to avoid TS conflict
  serialNumber?: string;
  department?: string;
  assignedTo?: string;
  maintenanceHistory: IMaintenanceRecord[];
}

const MaintenanceSchema: Schema<IMaintenanceRecord> = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    performedBy: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MachineSchema: Schema<IMachine> = new Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    quantity: { type: Number, required: true },
    description: String,
    status: {
      type: String,
      enum: ['operational', 'maintenance', 'out-of-service'],
      default: 'operational',
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    location: String,
    manufacturer: String,
    modelName: String, // renamed field
    serialNumber: { type: String, unique: true, sparse: true },
    department: String,
    assignedTo: String,
    maintenanceHistory: [MaintenanceSchema],
  },
  { timestamps: true }
);

const Machine: Model<IMachine> =
  mongoose.models.Machine || mongoose.model<IMachine>('Machine', MachineSchema);

export default Machine;
