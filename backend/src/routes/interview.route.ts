import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { InterviewController } from "../controllers/interview.controller";
import { InterviewService } from "../services/interview.service";
import { InterviewRoundRepository, InterviewScorecardRepository } from "../repositories/interview.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { CreateInterviewRoundSchema, SubmitScorecardSchema } from "../schemas/recruitment/interview.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { ROLE } from "@/configs/entities/employee.config";

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
  authorizeRoles(ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.ADMIN),
  validate(CreateInterviewRoundSchema),
  controller.scheduleRound
);

router.get(
  "/rounds/:id",
  controller.getRoundById
);

// Scorecards
router.post(
  "/scorecards",
  validate(SubmitScorecardSchema),
  controller.submitScorecard
);

export default router;
