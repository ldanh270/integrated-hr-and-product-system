import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { JobApplicationService } from "../services/job-application.service";
import { JobApplicationController } from "../controllers/job-application.controller";
import { ApplyJobSchema, UpdateApplicationStatusSchema, RejectApplicationSchema, UpdateKanbanOrderSchema } from "../schemas/recruitment/job-application.schema";

const router = Router();

// DI wiring
const applicationRepository = new JobApplicationRepository();
const candidateRepository = new CandidateRepository();
const requisitionRepository = new JobRequisitionRepository();
const service = new JobApplicationService(applicationRepository, candidateRepository, requisitionRepository);
const controller = new JobApplicationController(service);

// Public or semi-public route for candidates to apply
router.post("/apply", validate(ApplyJobSchema), controller.apply);

// Private routes for HR/HM
router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.patch("/:id/status", validate(UpdateApplicationStatusSchema), controller.updateStatus);
router.patch("/:id/kanban", validate(UpdateKanbanOrderSchema), controller.updateKanbanOrder);
router.post("/:id/reject", validate(RejectApplicationSchema), controller.reject);

export default router;
