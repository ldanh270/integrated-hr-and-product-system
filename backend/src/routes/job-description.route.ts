/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { JobDescriptionController } from "../controllers/job-description.controller";
import { JobDescriptionService } from "../services/job-description.service";
import { JobDescriptionRepository } from "../repositories/job-description.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateJobDescriptionSchema } from "../schemas/recruitment/job-description.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";

const router = Router({ mergeParams: true });

// DI wiring
const jobDescriptionRepository = new JobDescriptionRepository();
const jobRequisitionRepository = new JobRequisitionRepository();
const jobDescriptionService = new JobDescriptionService(jobDescriptionRepository, jobRequisitionRepository);
const controller = new JobDescriptionController(jobDescriptionService);

// Routes
router.use(internalLimiter);
router.use(authenticate);

// Get by requisitionId
router.get("/", controller.getByRequisitionId);

// Create or update by requisitionId
router.put("/", validate(CreateJobDescriptionSchema), controller.createOrUpdate);

// Delete by requisitionId
router.delete("/", controller.deleteDescription);

export default router;
