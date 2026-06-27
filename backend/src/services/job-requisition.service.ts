import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobRequisition, RequisitionStatus, Role } from "@prisma/client";
import { ROLE } from "@/configs/entities/employee.config";
import { AppError } from "../utils/error.util";
import { CreateJobRequisitionDTO, IJobRequisitionRepository, IJobRequisitionService, JobRequisitionFilters } from "../types/recruitment/job-requisition.types";
import { prisma } from "../libs/database";
import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config";


export class JobRequisitionService implements IJobRequisitionService {
  constructor(private readonly jobRequisitionRepository: IJobRequisitionRepository) {}

  async createRequisition(hmId: string, data: CreateJobRequisitionDTO): Promise<JobRequisition> {
    return this.jobRequisitionRepository.create({
      ...data,
      requestedById: hmId,
    });
  }

  async getRequisitionById(id: string): Promise<JobRequisition | null> {
    return this.jobRequisitionRepository.findById(id);
  }

  async getRequisitions(filters?: JobRequisitionFilters): Promise<JobRequisition[]> {
    return this.jobRequisitionRepository.findAll(filters);
  }

  private async verifyGeneralManager(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { role: true }
    });

    if (!employee || employee.role !== ROLE.GENERAL_MANAGER) {
      throw new AppError("Only General Manager can approve or reject job requisitions", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
    }
  }

  async approveRequisition(gmId: string, id: string): Promise<JobRequisition> {
    await this.verifyGeneralManager(gmId);
    
    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (req.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot approve a closed or rejected requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.updateStatus(id, REQUISITION_STATUS.OPEN, { approvedById: gmId });
  }

  async rejectRequisition(gmId: string, id: string, reason: string): Promise<JobRequisition> {
    await this.verifyGeneralManager(gmId);

    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (req.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot reject a closed or already rejected requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.updateStatus(id, REQUISITION_STATUS.REJECTED, { 
      approvedById: gmId, 
      rejectReason: reason 
    });
  }

  async closeRequisition(employeeId: string, id: string): Promise<JobRequisition> {
    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Checking if authorized (could be HM or GM or HR)
    // For now we allow closure, but we could restrict it.
    
    if (req.status === REQUISITION_STATUS.CLOSED) {
      throw new AppError("Requisition is already closed", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.updateStatus(id, REQUISITION_STATUS.CLOSED);
  }
}
