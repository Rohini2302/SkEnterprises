import express, { Request, Response } from 'express';
import { workQueryController } from '../controllers/workQuery.controller';
import {
  workQueryFileUpload,
  handleFileUploadErrors
} from '../middleware/workQueryMulter.middleware';

const router = express.Router();

/**
 * CREATE work query
 * POST /api/work-queries
 */
router.post(
  '/',
  workQueryFileUpload.array('proofFiles', 10),
  handleFileUploadErrors,
  (req: Request, res: Response) =>
    workQueryController.createWorkQuery(req, res)
);

/**
 * GET all work queries
 * GET /api/work-queries
 */
router.get(
  '/',
  (req: Request, res: Response) =>
    workQueryController.getAllWorkQueries(req, res)
);

/**
 * GET work query by ID
 * GET /api/work-queries/:id
 */
router.get(
  '/:id',
  (req: Request, res: Response) =>
    workQueryController.getWorkQueryById(req, res)
);

/**
 * GET work query by queryId
 * GET /api/work-queries/query/:queryId
 */
router.get(
  '/query/:queryId',
  (req: Request, res: Response) =>
    workQueryController.getWorkQueryByQueryId(req, res)
);

/**
 * UPDATE work query status
 * PATCH /api/work-queries/:id/status
 */
router.patch(
  '/:id/status',
  (req: Request, res: Response) =>
    workQueryController.updateWorkQueryStatus(req, res)
);

/**
 * ADD comment to work query
 * POST /api/work-queries/:id/comments
 */
router.post(
  '/:id/comments',
  (req: Request, res: Response) =>
    workQueryController.addComment(req, res)
);

/**
 * ASSIGN work query
 * PATCH /api/work-queries/:id/assign
 */
router.patch(
  '/:id/assign',
  (req: Request, res: Response) =>
    workQueryController.assignQuery(req, res)
);

/**
 * ADD files to work query
 * POST /api/work-queries/:id/files
 */
router.post(
  '/:id/files',
  workQueryFileUpload.array('files', 10),
  handleFileUploadErrors,
  (req: Request, res: Response) =>
    workQueryController.addFilesToWorkQuery(req, res)
);

/**
 * REMOVE files from work query
 * DELETE /api/work-queries/:id/files
 */
router.delete(
  '/:id/files',
  (req: Request, res: Response) =>
    workQueryController.removeFilesFromWorkQuery(req, res)
);

/**
 * GET statistics
 * GET /api/work-queries/statistics
 */
router.get(
  '/statistics',
  (req: Request, res: Response) =>
    workQueryController.getStatistics(req, res)
);

/**
 * GET services for supervisor
 * GET /api/work-queries/supervisor/:supervisorId/services
 */
router.get(
  '/supervisor/:supervisorId/services',
  (req: Request, res: Response) =>
    workQueryController.getServicesForSupervisor(req, res)
);

/**
 * GET recent work queries
 * GET /api/work-queries/recent
 */
router.get(
  '/recent',
  (req: Request, res: Response) =>
    workQueryController.getRecentWorkQueries(req, res)
);

/**
 * GET categories
 * GET /api/work-queries/categories
 */
router.get(
  '/categories',
  (req: Request, res: Response) =>
    workQueryController.getCategories(req, res)
);

/**
 * GET priorities
 * GET /api/work-queries/priorities
 */
router.get(
  '/priorities',
  (req: Request, res: Response) =>
    workQueryController.getPriorities(req, res)
);

/**
 * GET statuses
 * GET /api/work-queries/statuses
 */
router.get(
  '/statuses',
  (req: Request, res: Response) =>
    workQueryController.getStatuses(req, res)
);

/**
 * GET service types
 * GET /api/work-queries/service-types
 */
router.get(
  '/service-types',
  (req: Request, res: Response) =>
    workQueryController.getServiceTypes(req, res)
);

export default router;