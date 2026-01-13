import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  value: string;
  label: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    value: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    icon: { type: String, required: true },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>(
  "Department",
  DepartmentSchema
);