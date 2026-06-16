import {
  ICreateWeeklyScheduleTemplateDTO,
  IUpdateWeeklyScheduleTemplateDTO,
  IWeeklyScheduleTemplateRepository,
} from "@/types/weekly-schedule-template.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

const templateInclude = {
  weeks: {
    orderBy: { weekIndex: "asc" as const },
    include: {
      days: {
        orderBy: { dayOfWeek: "asc" as const },
        include: { shift: true },
      },
    },
  },
}

/**
 * Repository for reusable weekly schedule templates with rotating shift patterns.
 */
export class PrismaWeeklyScheduleTemplateRepository
  extends BaseRepository
  implements IWeeklyScheduleTemplateRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async create(data: ICreateWeeklyScheduleTemplateDTO): Promise<any> {
    return this.prisma.weeklyScheduleTemplate.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        cycleWeeks: data.cycleWeeks,
        isActive: data.isActive ?? true,
        createdById: data.createdById,
        weeks: {
          create: data.weeks.map((week) => ({
            weekIndex: week.weekIndex,
            days: {
              create: week.days.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                shiftId: day.shiftId ?? null,
              })),
            },
          })),
        },
      },
      include: templateInclude,
    })
  }

  async update(id: string, data: IUpdateWeeklyScheduleTemplateDTO): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      if (data.weeks) {
        await tx.weeklyScheduleTemplateWeek.deleteMany({ where: { templateId: id } })
      }

      return tx.weeklyScheduleTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description ?? undefined,
          cycleWeeks: data.cycleWeeks,
          isActive: data.isActive,
          weeks: data.weeks
            ? {
                create: data.weeks.map((week) => ({
                  weekIndex: week.weekIndex,
                  days: {
                    create: week.days.map((day) => ({
                      dayOfWeek: day.dayOfWeek,
                      shiftId: day.shiftId ?? null,
                    })),
                  },
                })),
              }
            : undefined,
        },
        include: templateInclude,
      })
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.weeklyScheduleTemplate.delete({ where: { id } })
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.weeklyScheduleTemplate.findUnique({
      where: { id },
      include: templateInclude,
    })
  }

  async listAll(): Promise<any[]> {
    return this.prisma.weeklyScheduleTemplate.findMany({
      include: templateInclude,
      orderBy: { createdAt: "desc" },
    })
  }
}
