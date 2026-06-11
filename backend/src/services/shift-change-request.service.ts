import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IShiftChangeRequestRepository,
  IShiftChangeRequestService,
  ISubmitShiftChangeRequestDTO,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service for managing shift change and swap requests.
 */
export class ShiftChangeRequestService implements IShiftChangeRequestService {
  /**
   * Creates a new ShiftChangeRequestService instance.
   * @param repo - The shift change request repository implementation.
   */
  constructor(private repo: IShiftChangeRequestRepository) {}

  /**
   * Submits a new shift change request, preventing self-swaps.
   * @param data - The request submission data.
   * @returns The created shift change request.
   * @throws {AppError} If the employee attempts to swap with themselves.
   */
  async submitRequest(data: ISubmitShiftChangeRequestDTO): Promise<any> {
    // Prevent employee from requesting swap with themselves
    if (data.employeeId === data.swapWithEmployeeId) {
      throw new AppError(
        "Cannot request shift swap with yourself",
        HttpStatusCode.BAD_REQUEST,
        "Service",
      )
    }
    return this.repo.submit(data)
  }

  /**
   * Fetches all shift change requests submitted by a specific employee.
   * @param employeeId - The employee ID.
   * @returns An array of shift change requests.
   */
  async getMyRequests(employeeId: string): Promise<any[]> {
    return this.repo.findByEmployee(employeeId)
  }
}
