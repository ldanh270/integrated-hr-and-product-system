import {
  IShiftService,
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class ShiftService implements IShiftService {
  constructor(private shiftRepo: IWorkingShiftRepository) {}

  async createShift(data: ICreateWorkingShiftDTO): Promise<any> {
    try {
      return await this.shiftRepo.create(data)
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError("Shift name already exists", 409, "Service")
      }
      throw error
    }
  }

  async updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null> {
    const shift = await this.shiftRepo.update(id, data)
    if (!shift) {
      throw new AppError("Shift not found", 404, "Service")
    }
    return shift
  }

  async getShift(id: string): Promise<any | null> {
    const shift = await this.shiftRepo.findById(id)
    if (!shift) {
      throw new AppError("Shift not found", 404, "Service")
    }
    return shift
  }

  async listShifts(): Promise<any[]> {
    return this.shiftRepo.listAll()
  }
}
