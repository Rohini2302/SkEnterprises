import mongoose, { Schema, Document } from "mongoose";

export interface IDepartmentCategory extends Document {
  department: string;
  category: string;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentCategorySchema = new Schema<IDepartmentCategory>(
  {
    department: { type: String, required: true },
    category: { type: String, required: true },
    items: [{ type: String }],
  },
  { timestamps: true }
);

// Compound index for uniqueness
DepartmentCategorySchema.index(
  { department: 1, category: 1 },
  { unique: true }
);

export const DepartmentCategory = mongoose.model<IDepartmentCategory>(
  "DepartmentCategory",
  DepartmentCategorySchema
);