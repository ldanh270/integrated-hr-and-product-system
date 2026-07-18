import { DEFAULT_REGIME_CATEGORIES } from "@/configs/entities/attendance.config.ts"
import { prisma } from "@/libs/database.ts"

import type { RegimeCategory } from "@prisma/client"

export interface ICreateRegimeCategoryDTO {
  name: string
  maxLateMinutes: number
  maxEarlyMinutes: number
  createdById: string
}

export interface IUpdateRegimeCategoryDTO {
  name?: string
  maxLateMinutes?: number
  maxEarlyMinutes?: number
}

export interface IRegimeCategoryRepository {
  list(): Promise<RegimeCategory[]>
  create(dto: ICreateRegimeCategoryDTO): Promise<RegimeCategory>
  update(id: string, dto: IUpdateRegimeCategoryDTO): Promise<RegimeCategory>
  delete(id: string): Promise<void>
  findById(id: string): Promise<RegimeCategory | null>
  ensureDefaults(createdById: string): Promise<void>
}

/**
 * Prisma-backed repository for RegimeCategory CRUD.
 * Maintains two immutable default categories (paid / unpaid).
 */
export class PrismaRegimeCategoryRepository implements IRegimeCategoryRepository {
  constructor(private db: typeof prisma) {}

  /**
   * Ensures the two default regime categories exist.
   * Called lazily before list() to avoid a dedicated seed script.
   */
  async ensureDefaults(createdById: string): Promise<void> {
    for (const category of DEFAULT_REGIME_CATEGORIES) {
      const existing = await this.db.regimeCategory.findFirst({
        where: { name: category.NAME, isDefault: true },
        select: { id: true },
      })
      if (!existing) {
        await this.db.regimeCategory.create({
          data: {
            name: category.NAME,
            maxLateMinutes: category.MAX_LATE_MINUTES,
            maxEarlyMinutes: category.MAX_EARLY_MINUTES,
            isDefault: true,
            createdById,
          },
        })
      }
    }
  }

  /** Returns every regime category in stable display order. */
  async list(): Promise<RegimeCategory[]> {
    return this.db.regimeCategory.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })
  }

  /** Creates a custom regime category. */
  async create(dto: ICreateRegimeCategoryDTO): Promise<RegimeCategory> {
    return this.db.regimeCategory.create({
      data: {
        name: dto.name,
        maxLateMinutes: dto.maxLateMinutes,
        maxEarlyMinutes: dto.maxEarlyMinutes,
        isDefault: false,
        createdById: dto.createdById,
      },
    })
  }

  /** Updates the mutable fields of an existing regime category. */
  async update(id: string, dto: IUpdateRegimeCategoryDTO): Promise<RegimeCategory> {
    return this.db.regimeCategory.update({
      where: { id },
      data: dto,
    })
  }

  /** Deletes a regime category by identifier. */
  async delete(id: string): Promise<void> {
    await this.db.regimeCategory.delete({ where: { id } })
  }

  /** Finds a regime category by identifier. */
  async findById(id: string): Promise<RegimeCategory | null> {
    return this.db.regimeCategory.findUnique({ where: { id } })
  }
}
