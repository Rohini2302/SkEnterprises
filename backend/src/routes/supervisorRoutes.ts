import express from "express";
import {
  getAllSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  toggleSupervisorStatus,
  searchSupervisors,
  getSupervisorStats
} from "../controllers/supervisorController";

const router = express.Router();

// Public routes (add authentication middleware as needed)
router.get("/", getAllSupervisors);
router.get("/stats", getSupervisorStats);
router.get("/search", searchSupervisors);
router.get("/:id", getSupervisorById);

// Protected routes (add authentication and authorization middleware)
router.post("/", createSupervisor);
router.put("/:id", updateSupervisor);
router.delete("/:id", deleteSupervisor);
router.patch("/:id/toggle-status", toggleSupervisorStatus);

export default router;