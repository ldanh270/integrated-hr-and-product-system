import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IShiftChangeRequestRepository,
  IShiftChangeRequestService,
  ISubmitShiftChangeRequestDTO,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class ShiftChangeRequestService implements IShiftChangeRequestService {
  constructor(private repo: IShiftChangeRequestRepository) {}

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

  async getMyRequests(employeeId: string): Promise<any[]> {
    return this.repo.findByEmployee(employeeId)
  }
}
