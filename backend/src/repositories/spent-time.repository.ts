import {
  CreateSpentTimeDto,
  ISpentTimeRepository,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
  SpentTimeActivity,
  SpentTimeWorkTimeType,
} from "@/types"
import {
  Employee as PrismaEmployee,
  Prisma,
  PrismaClient,
  SpentTime as PrismaSpentTime,
  Task as PrismaTask,
} from "@prisma/client"
import { SPENT_TIME_WORK_TIME_TYPE } from "@/configs/entities/project.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { BaseRepository } from "./base.repository.ts"

type PrismaSpentTimeWithRelations = PrismaSpentTime & {
  task?: (PrismaTask & {
    project?: {
      id: string
      name: string
    } | null
  }) | null
  employee?: PrismaEmployee | null
}

export class PrismaSpentTimeRepository extends BaseRepository implements ISpentTimeRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps Prisma SpentTime record to the domain model
   */
  protected mapToDomain(spentTime: PrismaSpentTimeWithRelations): SpentTime {
    return {
      id: spentTime.id,
      taskId: spentTime.taskId,
      employeeId: spentTime.employeeId,
      date: spentTime.date,
      hours: spentTime.hours,
      comment: spentTime.comment,
      activity: spentTime.activity as SpentTimeActivity,
      workTimeType: spentTime.workTimeType as SpentTimeWorkTimeType,
      createdAt: spentTime.createdAt,
      updatedAt: spentTime.updatedAt,
      task: spentTime.task
        ? {
            id: spentTime.task.id,
            title: spentTime.task.title,
            projectId: spentTime.task.projectId,
            project: spentTime.task.project
              ? {
                  id: spentTime.task.project.id,
                  name: spentTime.task.project.name,
                }
              : undefined,
          }
        : undefined,
      employee: spentTime.employee
        ? {
            id: spentTime.employee.id,
            fullName: spentTime.employee.fullName,
            email: spentTime.employee.email,
          }
        : undefined,
    }
  }

  /**
   * Finds a spent time log by its ID
   */
  async findById(id: string): Promise<SpentTime | null> {
    const record = await this.prisma.spentTime.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employee: true,
      },
    })
    return record ? this.mapToDomain(record) : null
  }

  /**
   * Lists spent time logs based on filters
   */
  async list(query: SpentTimeQuery): Promise<SpentTime[]> {
    const where: Prisma.SpentTimeWhereInput = {}

    if (query.taskId) {
      where.taskId = query.taskId
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId
    }

    if (query.projectId) {
      where.task = {
        projectId: query.projectId,
      }
    }

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) {
        where.date.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate)
      }
    }

    const records = await this.prisma.spentTime.findMany({
      where,
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employee: true,
      },
      orderBy: {
        date: SORT_ORDER.DESC,
      },
    })

    return records.map((record) => this.mapToDomain(record))
  }

  /**
   * Creates a new spent time log
   */
  async create(data: CreateSpentTimeDto): Promise<SpentTime> {
    if (!data.employeeId) {
      throw new Error("Employee ID is required to create a spent time log")
    }

    const record = await this.prisma.spentTime.create({
      data: {
        taskId: data.taskId,
        employeeId: data.employeeId,
        date: typeof data.date === "string" ? new Date(data.date) : data.date,
        hours: data.hours,
        comment: data.comment,
        activity: data.activity,
        workTimeType: data.workTimeType || SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employee: true,
      },
    })
    return this.mapToDomain(record)
  }

  /**
   * Updates an existing spent time log
   */
  async update(id: string, data: UpdateSpentTimeDto): Promise<SpentTime | null> {
    const updateData: Prisma.SpentTimeUpdateInput = {}
    if (data.date) {
      updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date
    }
    if (data.hours !== undefined) {
      updateData.hours = data.hours
    }
    if (data.comment !== undefined) {
      updateData.comment = data.comment
    }
    if (data.activity) {
      updateData.activity = data.activity
    }
    if (data.workTimeType) {
      updateData.workTimeType = data.workTimeType
    }

    const record = await this.prisma.spentTime.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employee: true,
      },
    })
    return this.mapToDomain(record)
  }

  /**
   * Deletes a spent time log
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.spentTime.delete({
      where: { id },
    })
    return true
  }
}
