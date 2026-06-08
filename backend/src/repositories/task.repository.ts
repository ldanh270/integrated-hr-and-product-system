import {
  CreateTaskDto,
  Task,
  TaskListQuery,
  ITaskRepository,
  PaginatedTasksDto,
  UpdateTaskDto,
} from "@/types"

import { Prisma, PrismaClient, Task as PrismaTask, Employee as PrismaEmployee } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

type PrismaTaskWithRelations = PrismaTask & {
  project?: {
    id: string
    name: string
    taskCreationPolicy: string
    teamLeaderId: string | null
  } | null
  assignee?: PrismaEmployee | null
  createdBy?: PrismaEmployee | null
}

export class PrismaTaskRepository extends BaseRepository implements ITaskRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  protected mapToDomain(task: PrismaTaskWithRelations): Task {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      priority: task.priority as any,
      status: task.status as any,
      assigneeId: task.assigneeId,
      createdById: task.createdById,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
            taskCreationPolicy: task.project.taskCreationPolicy,
            teamLeaderId: task.project.teamLeaderId,
          }
        : undefined,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            fullName: task.assignee.fullName,
            email: task.assignee.email,
          }
        : null,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            fullName: task.createdBy.fullName,
            email: task.createdBy.email,
          }
        : undefined,
    }
  }

  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            taskCreationPolicy: true,
            teamLeaderId: true,
          },
        },
        assignee: true,
        createdBy: true,
      },
    })
    return task ? this.mapToDomain(task as any) : null
  }

  async listTasks(query: TaskListQuery): Promise<PaginatedTasksDto> {
    const {
      projectId,
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      assigneeId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.TaskWhereInput = {}

    if (projectId) {
      where.projectId = projectId
    }
    if (status) {
      where.status = status as any
    }
    if (priority) {
      where.priority = priority as any
    }
    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              taskCreationPolicy: true,
              teamLeaderId: true,
            },
          },
          assignee: true,
          createdBy: true,
        },
      }),
    ])

    return {
      data: tasks.map((t) => this.mapToDomain(t as any)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async createTask(data: CreateTaskDto & { createdById: string }): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        status: data.status as any,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            taskCreationPolicy: true,
            teamLeaderId: true,
          },
        },
        assignee: true,
        createdBy: true,
      },
    })
    return this.mapToDomain(task as any)
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<Task | null> {
    const updateData: Prisma.TaskUpdateInput = {
      title: data.title,
      description: data.description,
      priority: data.priority as any,
      status: data.status as any,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    }

    if (data.dueDate === null) updateData.dueDate = null
    if (data.assigneeId === null) updateData.assigneeId = null
    if (data.completedAt === null) updateData.completedAt = null

    // Tự động set completedAt khi chuyển trạng thái sang Done
    if (data.status === "done" && !data.completedAt) {
      updateData.completedAt = new Date()
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            taskCreationPolicy: true,
            teamLeaderId: true,
          },
        },
        assignee: true,
        createdBy: true,
      },
    })
    return this.mapToDomain(task as any)
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.prisma.task.delete({
      where: { id },
    })
    return true
  }
}