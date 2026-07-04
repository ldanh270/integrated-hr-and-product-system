import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { ExternalJobPostController } from "../controllers/external-job-post.controller";
import { ExternalJobPostService } from "../services/external-job-post.service";
import { ExternalJobPostRepository } from "../repositories/external-job-post.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateExternalJobPostSchema, UpdateExternalJobPostStatusSchema } from "../schemas/recruitment/external-job-post.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { ROLE } from "@/configs/entities/employee.config";

const router = Router({ mergeParams: true }); // Will be mounted under /requisitions/:requisitionId/external-posts

// DI wiring
const externalJobPostRepository = new ExternalJobPostRepository();
const jobRequisitionRepository = new JobRequisitionRepository();
const externalJobPostService = new ExternalJobPostService(externalJobPostRepository, jobRequisitionRepository);
const controller = new ExternalJobPostController(externalJobPostService);

// Routes
router.use(internalLimiter);
router.use(authenticate);

// Get by requisitionId
router.get(
  "/",
  controller.getByRequisitionId
);

// Create new post
router.post(
  "/",
  authorizeRoles(ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.ADMIN),
  validate(CreateExternalJobPostSchema),
  controller.create
);

// Update status
router.patch(
  "/:id/status",
  authorizeRoles(ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.ADMIN),
  validate(UpdateExternalJobPostStatusSchema),
  controller.updateStatus
);

export default router;
