/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { JobPostingRepository } from "../repositories/job-posting.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { JobPostingService } from "../services/job-posting.service";
import { JobPostingController } from "../controllers/job-posting.controller";
import { CreateJobPostingSchema, PublishChannelSchema } from "../schemas/recruitment/job-posting.schema";
import { z } from "zod";
import { POSTING_STATUS_VALUES } from "../configs/entities/recruitment.config";
import { internalLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const postingRepository = new JobPostingRepository();
const requisitionRepository = new JobRequisitionRepository();
const service = new JobPostingService(postingRepository, requisitionRepository);
const controller = new JobPostingController(service);

// Status schema inline
const UpdateStatusSchema = z.object({
  status: z.enum(POSTING_STATUS_VALUES)
});

// Routes
router.use(internalLimiter);
router.use(authenticate);

router.get("/", controller.getAll);
router.post("/", validate(CreateJobPostingSchema), controller.create);
router.get("/:id", controller.getById);

router.patch("/:id/status", validate(UpdateStatusSchema), controller.updateStatus);
router.post("/:id/channels", validate(PublishChannelSchema), controller.addChannel);

export default router;
