import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { InterviewController } from "../controllers/interview.controller";
import { InterviewService } from "../services/interview.service";
import { InterviewRoundRepository } from "../repositories/interview.repository";
import { InterviewScorecardRepository } from "../repositories/interview-scorecard.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateInterviewRoundSchema, SubmitScorecardSchema, UpdateInterviewRoundSchema } from "../schemas/recruitment/interview.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";
import { requirePermission } from "../middlewares/permission.middleware";

const router = Router();

// DI wiring
const interviewRoundRepository = new InterviewRoundRepository();
const interviewScorecardRepository = new InterviewScorecardRepository();
const jobRequisitionRepository = new JobRequisitionRepository();
const interviewService = new InterviewService(
  interviewRoundRepository,
  interviewScorecardRepository,
  jobRequisitionRepository
);
const controller = new InterviewController(interviewService);

// Routes
router.use(internalLimiter);
router.use(authenticate);

// Rounds
router.post(
  "/rounds",
  requirePermission("recruitment.create"),
  validate(CreateInterviewRoundSchema),
  controller.scheduleRound
);

router.get(
  "/rounds/:id",
  controller.getRoundById
);

router.put(
  "/rounds/:id",
  requirePermission("recruitment.update"),
  validate(UpdateInterviewRoundSchema),
  controller.updateRound
);

router.delete(
  "/rounds/:id",
  requirePermission("recruitment.delete"),
  controller.deleteRound
);

// Scorecards
router.post(
  "/scorecards",
  validate(SubmitScorecardSchema),
  controller.submitScorecard
);

export default router;
