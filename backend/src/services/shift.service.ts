import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ICreateWorkingShiftDTO,
  IShiftService,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { handleDbUniqueError } from "@/utils/db-error.util.ts"
import { AppError } from "@/utils/error.util.ts"

export class ShiftService implements IShiftService {
  constructor(private shiftRepo: IWorkingShiftRepository) {}

  async createShift(data: ICreateWorkingShiftDTO): Promise<any> {
    try {
      return await this.shiftRepo.create(data)
    } catch (error: any) {
      handleDbUniqueError(
        error,
        "ShiftService",
        { name: "Shift name" },
        "Shift name already exists",
      )
    }
  }

  async updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null> {
    try {
      const shift = await this.shiftRepo.update(id, data)
      if (!shift) {
        throw new AppError("Shift not found", HttpStatusCode.NOT_FOUND, "ShiftService")
      }
      return shift
    } catch (error: any) {
      handleDbUniqueError(
        error,
        "ShiftService",
        { name: "Shift name" },
        "Shift name already exists",
      )
    }
  }

  async getShift(id: string): Promise<any | null> {
    const shift = await this.shiftRepo.findById(id)
    if (!shift) {
      throw new AppError("Shift not found", HttpStatusCode.NOT_FOUND, "ShiftService")
    }
    return shift
  }

  async listShifts(): Promise<any[]> {
    return this.shiftRepo.listAll()
  }
}
