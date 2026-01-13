import { Router } from "express";
import Site  from "../models/Site";

const router = Router();

/**
 * GET /api/mongo/sites
 * ALWAYS fetches from MongoDB
 */
router.get("/sites", async (req, res) => {
  try {
    console.log("🔥 MongoDB Sites API HIT");

    const sites = await Site.find().lean();
    res.json({
      source: "mongodb",
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    console.error("Mongo sites error:", error);
    res.status(500).json({ message: "Failed to fetch sites from MongoDB" });
  }
});

export default router;