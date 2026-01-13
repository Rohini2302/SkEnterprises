import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, required: true, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Indexes
VendorSchema.index({ id: 1 }, { unique: true });
VendorSchema.index({ category: 1 });
VendorSchema.index({ city: 1 });

export const Vendor = mongoose.model<IVendor>("Vendor", VendorSchema);