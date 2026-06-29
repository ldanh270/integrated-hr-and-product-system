/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { OfferRepository } from "../repositories/offer.repository";
import { OnboardingService } from "../services/onboarding.service";
import { OnboardingController } from "../controllers/onboarding.controller";
import { ConvertToEmployeeSchema } from "../schemas/recruitment/onboarding.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const applicationRepository = new JobApplicationRepository();
const offerRepository = new OfferRepository();
const service = new OnboardingService(applicationRepository, offerRepository);
const controller = new OnboardingController(service);

// Routes
router.use(internalLimiter);
router.use(authenticate);

router.post("/convert", validate(ConvertToEmployeeSchema), controller.convert);

export default router;
