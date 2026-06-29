/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { InterviewRoundRepository, InterviewScorecardRepository } from "../repositories/interview.repository";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { InterviewService } from "../services/interview.service";
import { InterviewController } from "../controllers/interview.controller";
import { CreateInterviewRoundSchema, SubmitScorecardSchema } from "../schemas/recruitment/interview.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const roundRepository = new InterviewRoundRepository();
const scorecardRepository = new InterviewScorecardRepository();
const applicationRepository = new JobApplicationRepository();
const service = new InterviewService(roundRepository, scorecardRepository, applicationRepository);
const controller = new InterviewController(service);

// Routes
router.use(internalLimiter);
router.use(authenticate);

router.post("/schedule", validate(CreateInterviewRoundSchema), controller.schedule);
router.get("/:id", controller.getById);

router.post("/scorecard", validate(SubmitScorecardSchema), controller.submitScorecard);

export default router;
