/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { OfferRepository } from "../repositories/offer.repository";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { OfferService } from "../services/offer.service";
import { OfferController } from "../controllers/offer.controller";
import { CreateOfferSchema, RespondOfferSchema } from "../schemas/recruitment/offer.schema";

import { apiLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const offerRepository = new OfferRepository();
const applicationRepository = new JobApplicationRepository();
const service = new OfferService(offerRepository, applicationRepository);
const controller = new OfferController(service);

// Routes
router.use(apiLimiter);
router.use(authenticate);

router.post("/", validate(CreateOfferSchema), controller.create);
router.get("/:id", controller.getById);

router.post("/:id/send", controller.send);
router.post("/:id/respond", validate(RespondOfferSchema), controller.respond);

export default router;
