import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { ExternalJobPostController } from "../controllers/external-job-post.controller";
import { ExternalJobPostService } from "../services/external-job-post.service";
import { ExternalJobPostRepository } from "../repositories/external-job-post.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateExternalJobPostSchema, UpdateExternalJobPostStatusSchema } from "../schemas/recruitment/external-job-post.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";
import { requirePermission } from "../middlewares/permission.middleware";

const router = Router({ mergeParams: true }); // Will be mounted under /requisitions/:requisitionId/external-posts

const catchAsync = (fn: any): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  void Promise.resolve(fn(req, res, next)).catch(next);
};

// DI wiring
const externalJobPostRepository = new ExternalJobPostRepository();
const jobRequisitionRepository = new JobRequisitionRepository();
const externalJobPostService = new ExternalJobPostService(externalJobPostRepository, jobRequisitionRepository);
const controller = new ExternalJobPostController(externalJobPostService);

// Routes
router.use(catchAsync(internalLimiter));
router.use(catchAsync(authenticate));

// Get by requisitionId
router.get(
  "/",
  catchAsync(controller.getByRequisitionId)
);

// Create new post
router.post(
  "/",
  catchAsync(requirePermission("recruitment.create")),
  catchAsync(validate(CreateExternalJobPostSchema)),
  catchAsync(controller.create)
);

// Update status
router.patch(
  "/:id/status",
  catchAsync(requirePermission("recruitment.update")),
  catchAsync(validate(UpdateExternalJobPostStatusSchema)),
  catchAsync(controller.updateStatus)
);

export default router;
