import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { PublicApplicationController } from "../controllers/public-application.controller";
import { PublicApplicationService } from "../services/public-application.service";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { SubmitPublicApplicationSchema } from "../schemas/recruitment/public-application.schema";
import { apiLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

const catchAsync = (fn: any): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// DI wiring
const jobRequisitionRepository = new JobRequisitionRepository();
const publicApplicationService = new PublicApplicationService(jobRequisitionRepository);
const controller = new PublicApplicationController(publicApplicationService);

// External rate limiter for public routes
router.use(catchAsync(apiLimiter));

// Submit application
router.post(
  "/",
  catchAsync(validate(SubmitPublicApplicationSchema)),
  catchAsync(controller.submit)
);

export default router;
