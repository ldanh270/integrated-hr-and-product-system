import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type {
  ICreateRegimeCategoryDTO,
  IRegimeCategoryRepository,
  IUpdateRegimeCategoryDTO,
} from "@/repositories/regime-category.repository.ts"
import { AppError } from "@/utils/error.util.ts"

import type { RegimeCategory } from "@prisma/client"

export interface IRegimeCategoryService {
  list(requesterId: string): Promise<RegimeCategory[]>
  create(dto: ICreateRegimeCategoryDTO): Promise<RegimeCategory>
  update(id: string, dto: IUpdateRegimeCategoryDTO, requesterId: string): Promise<RegimeCategory>
  delete(id: string, requesterId: string): Promise<void>
}

/**
 * Business logic for RegimeCategory management.
 * Guards against mutating the two system-default categories.
 */
export class RegimeCategoryService implements IRegimeCategoryService {
  constructor(private repo: IRegimeCategoryRepository) {}

  /** Ensures defaults exist then returns full list. */
  async list(requesterId: string): Promise<RegimeCategory[]> {
    await this.repo.ensureDefaults(requesterId)
    return this.repo.list()
  }

  /** Creates a user-defined regime category. */
  async create(dto: ICreateRegimeCategoryDTO): Promise<RegimeCategory> {
    return this.repo.create(dto)
  }

  /**
   * Update a regime category.
   * Default categories can still be updated (admin intent); no guard needed per spec.
   */
  async update(
    id: string,
    dto: IUpdateRegimeCategoryDTO,
    requesterId: string,
  ): Promise<RegimeCategory> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError(
        "Không tìm thấy loại chế độ",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "REGIME_CATEGORY_NOT_FOUND",
      )
    }
    return this.repo.update(id, dto)
  }

  /** Default categories cannot be deleted. */
  async delete(id: string, requesterId: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new AppError(
        "Không tìm thấy loại chế độ",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "REGIME_CATEGORY_NOT_FOUND",
      )
    }
    if (existing.isDefault) {
      throw new AppError(
        "Không thể xóa loại chế độ mặc định",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "CANNOT_DELETE_DEFAULT_REGIME",
      )
    }
    await this.repo.delete(id)
  }
}
