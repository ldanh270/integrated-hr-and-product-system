import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { InterviewController } from "../controllers/interview.controller";
import { InterviewService } from "../services/interview.service";
import { InterviewRoundRepository, InterviewScorecardRepository } from "../repositories/interview.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateInterviewRoundSchema, SubmitScorecardSchema, UpdateInterviewRoundSchema } from "../schemas/recruitment/interview.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";
import { requireAnyPermission } from "../middlewares/permission.middleware";

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
  requireAnyPermission(["manage_recruitment", "manage_system"]),
  validate(CreateInterviewRoundSchema),
  controller.scheduleRound
);

router.get(
  "/rounds/:id",
  controller.getRoundById
);

router.put(
  "/rounds/:id",
  requireAnyPermission(["manage_recruitment", "manage_system"]),
  validate(UpdateInterviewRoundSchema),
  controller.updateRound
);

router.delete(
  "/rounds/:id",
  requireAnyPermission(["manage_recruitment", "manage_system"]),
  controller.deleteRound
);

// Scorecards
router.post(
  "/scorecards",
  validate(SubmitScorecardSchema),
  controller.submitScorecard
);

export default router;
