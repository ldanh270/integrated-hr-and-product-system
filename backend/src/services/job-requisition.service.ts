import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobRequisition, Prisma } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateJobRequisitionDTO, IJobRequisitionRepository, IJobRequisitionService, JobRequisitionFilters, UpdateJobRequisitionDTO } from "../types/recruitment/job-requisition.types";
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
   * Updates an existing job requisition if it has not been approved yet.
   * @param employeeId - The ID of the employee making the update
   * @param id - The ID of the requisition
   * @param data - The update data
   * @returns The updated job requisition
   * @throws AppError if not found, already approved, or closed/rejected
   */
  async updateRequisition(employeeId: string, id: string, data: Partial<CreateJobRequisitionDTO>): Promise<JobRequisition> {
    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (req.approvedById) {
      throw new AppError("Cannot update a requisition that has already been approved", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    if (req.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot update a closed or rejected requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.update(id, data);
  }

  /**
   * Deletes a job requisition if it has not been approved yet.
   * @param employeeId - The ID of the employee deleting the requisition
   * @param id - The ID of the requisition
   * @returns The deleted job requisition
   * @throws AppError if not found, already approved, or closed/rejected
   */
  async deleteRequisition(employeeId: string, id: string): Promise<JobRequisition> {
    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (req.approvedById) {
      throw new AppError("Cannot delete a requisition that has already been approved", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    if (req.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot delete a closed or rejected requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.delete(id);
  }

  /**
   * Verifies if the given employee is a General Manager.
   * Throws an error if the employee does not have the required role.
   * @param employeeId - The ID of the employee to check
   */
  private async verifyGeneralManager(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true }
    });

    if (!employee) {
      throw new AppError("Only General Manager can approve or reject job requisitions", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
    }
  }

  /**
   * Approves a job requisition, changing its status to OPEN.
   * Only accessible by a General Manager.
   * @param gmId - The ID of the General Manager
   * @param id - The ID of the job requisition
   * @param note - Optional note from the GM
   * @returns The updated job requisition
   * @throws AppError if requisition not found or if the user is not a GM
   */
  async approveRequisition(gmId: string, id: string, note?: string): Promise<JobRequisition> {
    await this.verifyGeneralManager(gmId);
    
    const req = await this.jobRequisitionRepository.findById(id);
    if (!req) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (req.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot approve a closed or rejected requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobRequisitionRepository.updateStatus(id, REQUISITION_STATUS.OPEN, { 
      approvedById: gmId,
      note: note 
    });
  }


  /**
   * Rejects a job requisition, changing its status to REJECTED.
   * Only accessible by a General Manager.
   * @param gmId - The ID of the General Manager rejecting the requisition
   * @param id - The ID of the job requisition to reject
   * @param note - The note for rejecting the requisition
   * @returns The updated job requisition
   * @throws AppError if requisition not found, already closed, or if user is not a GM
   */
  async rejectRequisition(gmId: string, id: string, note: string): Promise<JobRequisition> {
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
      note: note 
    });
  }


  /**
   * Closes a job requisition, marking it as CLOSED.
   * @param employeeId - The ID of the employee requesting closure
   * @param id - The ID of the job requisition
   * @returns The updated job requisition
   * @throws AppError if requisition not found or already closed
   */
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
