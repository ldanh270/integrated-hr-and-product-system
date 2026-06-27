/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { BackgroundCheckRepository } from "../repositories/background-check.repository";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { BackgroundCheckService } from "../services/background-check.service";
import { BackgroundCheckController } from "../controllers/background-check.controller";
import { UpdateBackgroundCheckSchema } from "../schemas/recruitment/background-check.schema";
import { z } from "zod";

import { apiLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const checkRepository = new BackgroundCheckRepository();
const applicationRepository = new JobApplicationRepository();
const service = new BackgroundCheckService(checkRepository, applicationRepository);
const controller = new BackgroundCheckController(service);

const InitiateCheckSchema = z.object({
  applicationId: z.string().cuid("Invalid application ID"),
});

// Routes
router.use(apiLimiter);
router.use(authenticate);

router.post("/", validate(InitiateCheckSchema), controller.initiate);
router.get("/:id", controller.getById);

router.patch("/:id", validate(UpdateBackgroundCheckSchema), controller.update);

export default router;
