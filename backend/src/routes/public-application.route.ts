import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { PublicApplicationController } from "../controllers/public-application.controller";
import { PublicApplicationService } from "../services/public-application.service";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { SubmitPublicApplicationSchema } from "../schemas/recruitment/public-application.schema";
import { apiLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const jobRequisitionRepository = new JobRequisitionRepository();
const publicApplicationService = new PublicApplicationService(jobRequisitionRepository);
const controller = new PublicApplicationController(publicApplicationService);

// External rate limiter for public routes
router.use(apiLimiter);

// Submit application
router.post(
  "/",
  validate(SubmitPublicApplicationSchema),
  controller.submit
);

export default router;
