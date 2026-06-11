import { DB_ERROR_CODES } from "@/configs/system/db.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ICreateWorkingShiftDTO,
  IShiftService,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service for managing working shift definitions.
 */
export class ShiftService implements IShiftService {
  /**
   * Creates a new ShiftService instance.
   * @param shiftRepo - The working shift repository implementation.
   */
  constructor(private shiftRepo: IWorkingShiftRepository) {}

  /**
   * Creates a new working shift definition.
   * @param data - The shift creation data.
   * @returns The created working shift.
   * @throws {AppError} If a shift with the same name already exists.
   */
  async createShift(data: ICreateWorkingShiftDTO): Promise<any> {
    try {
      return await this.shiftRepo.create(data)
    } catch (error: any) {
      if (DB_ERROR_CODES.UNIQUE_CONSTRAINT.includes(error.code)) {
        throw new AppError("Shift name already exists", HttpStatusCode.CONFLICT, "Service")
      }
      throw error
    }
  }

  /**
   * Updates an existing working shift definition.
   * @param id - The shift ID.
   * @param data - The updated shift data.
   * @returns The updated working shift.
   * @throws {AppError} If the shift is not found.
   */
  async updateShift(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null> {
    const shift = await this.shiftRepo.update(id, data)
    if (!shift) {
      throw new AppError("Shift not found", HttpStatusCode.NOT_FOUND, "Service")
    }
    return shift
  }

  /**
   * Deletes a working shift definition by ID.
   * @param id - The shift ID.
   * @throws {AppError} If the shift is not found.
   */
  async deleteShift(id: string): Promise<void> {
    const shift = await this.shiftRepo.findById(id)
    if (!shift) {
      throw new AppError("Shift not found", HttpStatusCode.NOT_FOUND, "Service")
    }
    await this.shiftRepo.delete(id)
  }

  /**
   * Fetches a single working shift definition by ID.
   * @param id - The shift ID.
   * @returns The working shift data.
   * @throws {AppError} If the shift is not found.
   */
  async getShift(id: string): Promise<any | null> {
    const shift = await this.shiftRepo.findById(id)
    if (!shift) {
      throw new AppError("Shift not found", HttpStatusCode.NOT_FOUND, "Service")
    }
    return shift
  }

  /**
   * Lists all working shift definitions.
   * @returns An array of working shifts.
   */
  async listShifts(): Promise<any[]> {
    return this.shiftRepo.listAll()
  }
}
