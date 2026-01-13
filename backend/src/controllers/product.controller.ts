import { Request, Response } from "express";
import Product from "../models/Product";

/**
 * GET /api/products
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(),
    ]);

    res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products", err });
  }
};

/**
 * POST /api/products
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log("Creating product:", req.body);
    
    const productData = req.body;
    
    // Convert string numbers to actual numbers
    if (productData.quantity) productData.quantity = Number(productData.quantity);
    if (productData.price) productData.price = Number(productData.price);
    if (productData.costPrice) productData.costPrice = Number(productData.costPrice);
    if (productData.reorderLevel) productData.reorderLevel = Number(productData.reorderLevel);
    if (productData.brushCount) productData.brushCount = Number(productData.brushCount);
    if (productData.squeegeeCount) productData.squeegeeCount = Number(productData.squeegeeCount);
    
    // Set default status
    if (!productData.status) {
      productData.status = productData.quantity > 0 ? "in-stock" : "out-of-stock";
    }
    
    const product = new Product(productData);
    const saved = await product.save();
    
    console.log("Product created:", saved._id);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error("Error creating product:", err);
    res.status(400).json({ 
      message: "Failed to create product", 
      error: err.message,
      errors: err.errors 
    });
  }
};

/**
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(400).json({ message: "Failed to delete product", err });
  }
};

/**
 * POST /api/products/:id/change-history
 */
export const addChangeHistory = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert cost to number
    const changeData = req.body;
    if (changeData.cost) changeData.cost = Number(changeData.cost);
    
    product.changeHistory.push(changeData);
    await product.save();

    res.json(product.changeHistory);
  } catch (err) {
    console.error("Error adding change history:", err);
    res.status(400).json({ message: "Failed to add change history", err });
  }
};