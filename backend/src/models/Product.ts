import mongoose, { Schema, Document } from "mongoose";

export interface IChangeHistory {
  date: Date;
  changeType: "maintenance" | "repair" | "replacement" | "inspection";
  description: string;
  cost: number;
  performedBy: string;
}

export interface IProduct extends Document {
  name: string;
  category: string;
  subCategory: string;
  department: string;
  quantity: number;
  price: number;
  costPrice: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  supplier: string;
  sku: string;
  reorderLevel: number;
  description?: string;
  site: string;
  assignedManager: string;
  brushCount?: number;
  squeegeeCount?: number;
  changeHistory: IChangeHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ChangeHistorySchema = new Schema({
  date: { type: Date, required: true },
  changeType: {
    type: String,
    enum: ["maintenance", "repair", "replacement", "inspection"],
    required: true,
  },
  description: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  performedBy: { type: String, required: true },
}, { _id: false });

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    department: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "in-stock",
    },
    supplier: { type: String },
    sku: { type: String, required: true, unique: true },
    reorderLevel: { type: Number, default: 0, min: 0 },
    description: { type: String },
    site: { type: String, required: true },
    assignedManager: { type: String },
    brushCount: { type: Number, default: 0, min: 0 },
    squeegeeCount: { type: Number, default: 0, min: 0 },
    changeHistory: [ChangeHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ProductSchema.index({ department: 1, category: 1 });
ProductSchema.index({ site: 1 });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ name: "text", description: "text", sku: "text" });

export default mongoose.model<IProduct>("Product", ProductSchema);