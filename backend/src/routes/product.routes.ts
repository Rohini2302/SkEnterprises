import { Router } from "express";
import {
  getProducts,
  createProduct,
  deleteProduct,
  addChangeHistory,
} from "../controllers/product.controller";
import Product from "../models/Product";

const router = Router();

router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    
    // Type guard to safely access error message
    let errorMessage = 'Error creating product';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: errorMessage
    });
  }
});

router.get("/", getProducts);
//router.post("/", createProduct); // This duplicates the route above - you should remove one
router.delete("/:id", deleteProduct);
router.post("/:id/change-history", addChangeHistory);

export default router;