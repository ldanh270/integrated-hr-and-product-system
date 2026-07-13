/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { JobRequisitionRepository } from "../repositories/job-requisition.repository";
import { JobRequisitionService } from "../services/job-requisition.service";
import { JobRequisitionController } from "../controllers/job-requisition.controller";
import { CreateJobRequisitionSchema, RejectJobRequisitionSchema, ApproveJobRequisitionSchema, UpdateJobRequisitionSchema } from "../schemas/recruitment/job-requisition.schema";
import { internalLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// DI wiring
const repository = new JobRequisitionRepository();
const service = new JobRequisitionService(repository);
const controller = new JobRequisitionController(service);

// Routes
router.use(internalLimiter);
router.use(authenticate);

// List and create
router.get("/", controller.getAll);
router.post("/", validate(CreateJobRequisitionSchema), controller.create);

// Get by ID
router.get("/:id", controller.getById);
router.put("/:id", validate(UpdateJobRequisitionSchema), controller.update);
router.delete("/:id", controller.delete);

// GM actions
router.post("/:id/approve", validate(ApproveJobRequisitionSchema), controller.approve);
router.post("/:id/reject", validate(RejectJobRequisitionSchema), controller.reject);

// Close (HM/HR action)
router.post("/:id/close", controller.close);

export default router;
