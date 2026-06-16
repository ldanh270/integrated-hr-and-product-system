import {
  ICreateWeeklyScheduleTemplateDTO,
  IUpdateWeeklyScheduleTemplateDTO,
  IWeeklyScheduleTemplateRepository,
  IWeeklyScheduleTemplateWithWeeks,
  weeklyScheduleTemplateInclude,
} from "@/types/weekly-schedule-template.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

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

  async create(data: ICreateWeeklyScheduleTemplateDTO): Promise<IWeeklyScheduleTemplateWithWeeks> {
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
      include: weeklyScheduleTemplateInclude,
    })
  }

  async update(
    id: string,
    data: IUpdateWeeklyScheduleTemplateDTO,
  ): Promise<IWeeklyScheduleTemplateWithWeeks> {
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
        include: weeklyScheduleTemplateInclude,
      })
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.weeklyScheduleTemplate.delete({ where: { id } })
  }

  async findById(id: string): Promise<IWeeklyScheduleTemplateWithWeeks | null> {
    return this.prisma.weeklyScheduleTemplate.findUnique({
      where: { id },
      include: weeklyScheduleTemplateInclude,
    })
  }

  async listAll(): Promise<IWeeklyScheduleTemplateWithWeeks[]> {
    return this.prisma.weeklyScheduleTemplate.findMany({
      include: weeklyScheduleTemplateInclude,
      orderBy: { createdAt: "desc" },
    })
  }
}
