import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobRequisition, RequisitionStatus, Role } from "@prisma/client";
import { ROLE } from "@/configs/entities/employee.config";
import { AppError } from "../utils/error.util";
import { CreateJobRequisitionDTO, IJobRequisitionRepository, IJobRequisitionService, JobRequisitionFilters } from "../types/recruitment/job-requisition.types";
import { prisma } from "../libs/database";
import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config";


/**
 * Service handling all business logic for Job Requisitions (Headcount requests).
 * This service implements the IJobRequisitionService interface.
 */
export class JobRequisitionService implements IJobRequisitionService {

  constructor(private readonly jobRequisitionRepository: IJobRequisitionRepository) {}

  /**
   * Creates a new job requisition.
   * @param hmId - The ID of the Hiring Manager requesting the headcount
   * @param data - The details of the job requisition
   * @returns The newly created job requisition
   */
  async createRequisition(hmId: string, data: CreateJobRequisitionDTO): Promise<JobRequisition> {
    return this.jobRequisitionRepository.create({
      ...data,
      requestedById: hmId,
    });
  }

  /**
   * Retrieves a specific job requisition by its ID.
   * @param id - The ID of the job requisition
   * @returns The job requisition if found, otherwise null
   */
  async getRequisitionById(id: string): Promise<JobRequisition | null> {
    return this.jobRequisitionRepository.findById(id);
  }

  /**
   * Retrieves all job requisitions matching the given filters.
   * @param filters - Optional filters (status, department, hiring manager, etc.)
   * @returns A list of job requisitions
   */
  async getRequisitions(filters?: JobRequisitionFilters): Promise<JobRequisition[]> {
    return this.jobRequisitionRepository.findAll(filters);
  }

  /**
   * Verifies if the given employee is a General Manager.
   * Throws an error if the employee does not have the required role.
   * @param employeeId - The ID of the employee to check
   */
  private async verifyGeneralManager(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { role: true }
    });

    if (!employee || employee.role !== ROLE.GENERAL_MANAGER) {
      throw new AppError("Only General Manager can approve or reject job requisitions", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
    }
  }

  /**
   * Approves a job requisition, changing its status to OPEN.
   * Only accessible by a General Manager.
   * @param gmId - The ID of the General Manager approving the requisition
   * @param id - The ID of the job requisition to approve
   * @returns The updated job requisition
   * @throws AppError if requisition not found or if the user is not a GM
   */
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
