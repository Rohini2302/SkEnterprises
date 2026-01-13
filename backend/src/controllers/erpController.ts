import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Department } from "../models/Department";
import { DepartmentCategory } from "../models/DepartmentCategory";
import Product from "../models/Product";
import Site from "../models/Site";
import  Employee  from "../models/Employee";
import { Vendor } from "../models/Vendor";

// Get all departments
export const getDepartments = asyncHandler(
  async (req: Request, res: Response) => {
    const departments = await Department.find().sort({ label: 1 });
    res.json(departments);
  }
);

// Get categories for a department
export const getDepartmentCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { department } = req.query;
    const categories = await DepartmentCategory.find({ department });
    res.json(categories);
  }
);

// Get products with filters
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    department,
    category,
    site,
    status,
    search,
  } = req.query;

  const query: any = {};

  if (department && department !== "all") {
    query.department = department;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (site && site !== "all") {
    query.site = site;
  }

  if (status && status !== "all") {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Product.countDocuments(query),
  ]);

  res.json({
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// Get single product
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

// Create product
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      category,
      subCategory,
      department,
      quantity,
      price,
      costPrice,
      supplier,
      reorderLevel,
      description,
      site,
      brushCount,
      squeegeeCount,
    } = req.body;

    // Get site manager
    const siteDoc = await Site.findOne({ id: site });
    const assignedManager = siteDoc && siteDoc.manager ? siteDoc.manager : "";

    // Generate SKU
    const departmentCount = await Product.countDocuments({
      department,
      category,
    });
    const deptCode = department.substring(0, 3).toUpperCase();
    const catCode = category.substring(0, 3).toUpperCase();
    const count = departmentCount + 1;
    const sku = `${deptCode}-${catCode}-${count.toString().padStart(3, "0")}`;

    const product = await Product.create({
      name,
      category,
      subCategory,
      department,
      quantity,
      price,
      costPrice,
      supplier,
      sku,
      reorderLevel,
      description,
      site,
      assignedManager,
      brushCount: brushCount || 0,
      squeegeeCount: squeegeeCount || 0,
      status: quantity > reorderLevel ? "in-stock" : "low-stock",
    });

    res.status(201).json(product);
  }
);

// Update product
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  }
);

// Delete product
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  }
);

// Add change history
export const addChangeHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const newChange = req.body;
    product.changeHistory.push(newChange);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  }
);

// Get all sites
export const getSites = asyncHandler(async (req: Request, res: Response) => {
  const sites = await Site.find().sort({ name: 1 });
  res.json(sites);
});

// Get all employees
export const getEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  }
);

// Get all vendors
export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const vendors = await Vendor.find().sort({ name: 1 });
  res.json(vendors);
});

// Get machine statistics
export const getMachineStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await Product.aggregate([
      {
        $match: {
          department: "housekeeping",
          category: "Machines",
        },
      },
      {
        $group: {
          _id: "$site",
          machineCount: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: { $multiply: ["$costPrice", "$quantity"] } },
          totalBrushes: { $sum: "$brushCount" },
          totalSqueegees: { $sum: "$squeegeeCount" },
          totalChanges: { $sum: { $size: "$changeHistory" } },
          assignedManager: { $first: "$assignedManager" },
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "_id",
          foreignField: "id",
          as: "siteInfo",
        },
      },
      {
        $unwind: {
          path: "$siteInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          siteId: "$_id",
          siteName: "$siteInfo.name",
          manager: "$assignedManager",
          machineCount: 1,
          totalQuantity: 1,
          totalCost: 1,
          totalBrushes: 1,
          totalSqueegees: 1,
          totalChanges: 1,
        },
      },
      {
        $sort: { siteName: 1 },
      },
    ]);

    res.json(stats);
  }
);