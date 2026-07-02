import { z } from "zod"

import {
  PROJECT_STATUSES,
  SPENT_TIME_ACTIVITIES,
  SPENT_TIME_WORK_TIME_TYPES,
  TASK_CREATION_POLICIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TRACKERS,
} from "../constants/entities/project.config.js"
import { mcpServer } from "../mcp.js"
import { projectService } from "../services/project.service.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerProjectTools = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP A — PROJECTS (8 tools)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. project_list
  mcpServer.tool(
    "project_list",
    "Get a list of projects. Admins and GMs see all projects. Other roles see projects they are members of.",
    {
      sessionId: z.string().describe("Active session ID"),
      page: z.number().int().positive().optional().describe("Page index"),
      limit: z.number().int().positive().optional().describe("Items per page"),
      search: z.string().optional().describe("Keyword string matching title/description/techStack"),
      status: z.enum(PROJECT_STATUSES).optional().describe("Filter by project status"),
      sortBy: z.string().optional().describe("Sorting field key (e.g. createdAt)"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sorting direction"),
    },
    async ({ sessionId, page, limit, search, status, sortBy, sortOrder }) => {
      try {
        const session = requireSession(sessionId)
        const params = {
          ...(page && { page }),
          ...(limit && { limit }),
          ...(search && { search }),
          ...(status && { status }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        }
        const data = await projectService.listProjects(session, params)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch projects", error.message)
      }
    },
  )

  // 2. project_get
  mcpServer.tool(
    "project_get",
    "Get the details of a single project by its ID.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project to retrieve"),
    },
    async ({ sessionId, projectId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.getProject(session, projectId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch project", error.message)
      }
    },
  )

  // 3. project_create
  mcpServer.tool(
    "project_create",
    "Create a new project. Restricted to Admin or General Manager.",
    {
      sessionId: z.string().describe("Active session ID"),
      name: z.string().min(2).max(100).describe("Project name"),
      techStack: z
        .string()
        .describe('Comma-separated list of technologies (e.g. "React, Node.js")'),
      description: z.string().max(500).optional().describe("Project description"),
      status: z.enum(PROJECT_STATUSES).optional().describe("Project status"),
      taskCreationPolicy: z
        .enum(TASK_CREATION_POLICIES)
        .optional()
        .describe("Task creation policy"),
      startDate: z.string().datetime().optional().describe("Start date (ISO 8601)"),
      expectedEndDate: z.string().datetime().optional().describe("Expected end date (ISO 8601)"),
      teamLeaderId: z.string().optional().describe("ID of the team leader employee"),
    },
    async ({
      sessionId,
      name,
      techStack,
      description,
      status,
      taskCreationPolicy,
      startDate,
      expectedEndDate,
      teamLeaderId,
    }) => {
      try {
        const session = requireSession(sessionId)
        const techStackArray = techStack
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        const payload = {
          name,
          techStack: techStackArray,
          ...(description && { description }),
          ...(status && { status }),
          ...(taskCreationPolicy && { taskCreationPolicy }),
          ...(startDate && { startDate }),
          ...(expectedEndDate && { expectedEndDate }),
          ...(teamLeaderId && { teamLeaderId }),
        }
        const data = await projectService.createProject(session, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to create project", error.message)
      }
    },
  )

  // 4. project_update
  mcpServer.tool(
    "project_update",
    "Update an existing project. Restricted to Admin, General Manager, or the Team Leader.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project to update"),
      name: z.string().min(2).max(100).optional().describe("Project name"),
      techStack: z.string().optional().describe("Comma-separated list of technologies"),
      description: z.string().max(500).optional().describe("Project description"),
      status: z.enum(PROJECT_STATUSES).optional().describe("Project status"),
      taskCreationPolicy: z
        .enum(TASK_CREATION_POLICIES)
        .optional()
        .describe("Task creation policy"),
      startDate: z.string().datetime().optional().describe("Start date (ISO 8601)"),
      expectedEndDate: z.string().datetime().optional().describe("Expected end date (ISO 8601)"),
      actualEndDate: z.string().datetime().optional().describe("Actual end date (ISO 8601)"),
      teamLeaderId: z.string().optional().describe("ID of the team leader employee"),
    },
    async ({
      sessionId,
      projectId,
      name,
      techStack,
      description,
      status,
      taskCreationPolicy,
      startDate,
      expectedEndDate,
      actualEndDate,
      teamLeaderId,
    }) => {
      try {
        const session = requireSession(sessionId)
        const payload: any = {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(taskCreationPolicy !== undefined && { taskCreationPolicy }),
          ...(startDate !== undefined && { startDate }),
          ...(expectedEndDate !== undefined && { expectedEndDate }),
          ...(actualEndDate !== undefined && { actualEndDate }),
          ...(teamLeaderId !== undefined && { teamLeaderId }),
        }

        if (techStack !== undefined) {
          payload.techStack = techStack
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        }

        const data = await projectService.updateProject(session, projectId, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to update project", error.message)
      }
    },
  )

  // 5. project_delete
  mcpServer.tool(
    "project_delete",
    "Delete a project. Restricted to Admin or General Manager.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project to delete"),
    },
    async ({ sessionId, projectId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.deleteProject(session, projectId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to delete project", error.message)
      }
    },
  )

  // 6. project_get_members
  mcpServer.tool(
    "project_get_members",
    "Get a list of employees registered as members of the project team.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
    },
    async ({ sessionId, projectId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.getProjectMembers(session, projectId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch project members", error.message)
      }
    },
  )

  // 7. project_add_member
  mcpServer.tool(
    "project_add_member",
    "Register a new member to the project team. Restricted to Admin, General Manager, or Team Leader.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      employeeId: z.string().describe("ID of the employee to add"),
    },
    async ({ sessionId, projectId, employeeId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.addProjectMember(session, projectId, employeeId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to add project member", error.message)
      }
    },
  )

  // 8. project_remove_member
  mcpServer.tool(
    "project_remove_member",
    "Remove an employee from the project team. Restricted to Admin, General Manager, or Team Leader.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      employeeId: z.string().describe("ID of the employee to remove"),
    },
    async ({ sessionId, projectId, employeeId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.removeProjectMember(session, projectId, employeeId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to remove project member", error.message)
      }
    },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP B — TASKS (5 tools)
  // ═══════════════════════════════════════════════════════════════════════════

  // 9. task_list
  mcpServer.tool(
    "task_list",
    "Retrieve a paginated, filtered list of tasks.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().optional().describe("Filter tasks by specific project ID"),
      page: z.number().int().positive().optional().describe("Page index"),
      limit: z.number().int().positive().optional().describe("Items per page"),
      search: z.string().optional().describe("Keyword string matching task title"),
      tracker: z.enum(TASK_TRACKERS).optional().describe("Filter by task tracker"),
      status: z.enum(TASK_STATUSES).optional().describe("Filter by task status"),
      priority: z.enum(TASK_PRIORITIES).optional().describe("Filter by task priority"),
      assigneeId: z.string().optional().describe("Filter tasks by assignee ID"),
      createdById: z.string().optional().describe("Filter tasks by creator ID"),
      sortBy: z.string().optional().describe("Sorting field key (e.g. createdAt)"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sorting direction"),
    },
    async ({ sessionId, ...params }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.listTasks(
          session,
          Object.keys(params).length > 0 ? params : undefined,
        )
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch tasks", error.message)
      }
    },
  )

  // 10. task_get
  mcpServer.tool(
    "task_get",
    "Get the details of a single task by its ID.",
    {
      sessionId: z.string().describe("Active session ID"),
      taskId: z.string().describe("ID of the task to retrieve"),
    },
    async ({ sessionId, taskId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.getTask(session, taskId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch task", error.message)
      }
    },
  )

  // 11. task_create
  mcpServer.tool(
    "task_create",
    "Create a new task under a project.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      title: z.string().min(2).max(150).describe("Task title"),
      description: z.string().max(1000).optional().describe("Task description"),
      tracker: z.enum(TASK_TRACKERS).optional().describe("Task tracker type"),
      priority: z.enum(TASK_PRIORITIES).optional().describe("Task priority"),
      status: z.enum(TASK_STATUSES).optional().describe("Task status"),
      assigneeId: z.string().optional().describe("ID of the assigned employee"),
      startDate: z.string().datetime().optional().describe("Start date (ISO 8601)"),
      dueDate: z.string().datetime().optional().describe("Due date (ISO 8601)"),
      estimatedTime: z.number().nonnegative().optional().describe("Estimated time in hours"),
      progress: z.number().int().min(0).max(100).optional().describe("Progress percentage (0-100)"),
      categoryId: z.string().optional().describe("ID of the task category"),
    },
    async ({ sessionId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.createTask(session, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to create task", error.message)
      }
    },
  )

  // 12. task_update
  mcpServer.tool(
    "task_update",
    "Update an existing task.",
    {
      sessionId: z.string().describe("Active session ID"),
      taskId: z.string().describe("ID of the task to update"),
      title: z.string().min(2).max(150).optional().describe("Task title"),
      description: z.string().max(1000).optional().describe("Task description"),
      tracker: z.enum(TASK_TRACKERS).optional().describe("Task tracker type"),
      priority: z.enum(TASK_PRIORITIES).optional().describe("Task priority"),
      status: z.enum(TASK_STATUSES).optional().describe("Task status"),
      assigneeId: z.string().optional().describe("ID of the assigned employee"),
      startDate: z.string().datetime().optional().describe("Start date (ISO 8601)"),
      dueDate: z.string().datetime().optional().describe("Due date (ISO 8601)"),
      completedAt: z.string().datetime().optional().describe("Completed date (ISO 8601)"),
      estimatedTime: z.number().nonnegative().optional().describe("Estimated time in hours"),
      progress: z.number().int().min(0).max(100).optional().describe("Progress percentage (0-100)"),
      categoryId: z.string().optional().describe("ID of the task category"),
    },
    async ({ sessionId, taskId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.updateTask(
          session,
          taskId,
          Object.keys(payload).length > 0 ? payload : {},
        )
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to update task", error.message)
      }
    },
  )

  // 13. task_delete
  mcpServer.tool(
    "task_delete",
    "Delete a task.",
    {
      sessionId: z.string().describe("Active session ID"),
      taskId: z.string().describe("ID of the task to delete"),
    },
    async ({ sessionId, taskId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.deleteTask(session, taskId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to delete task", error.message)
      }
    },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP C — CATEGORIES (4 tools)
  // ═══════════════════════════════════════════════════════════════════════════

  // 14. category_list
  mcpServer.tool(
    "category_list",
    "List all custom task tags/categories defined under a project.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
    },
    async ({ sessionId, projectId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.listCategories(session, projectId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch categories", error.message)
      }
    },
  )

  // 15. category_create
  mcpServer.tool(
    "category_create",
    "Create a new category for the project.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      name: z.string().min(1).max(50).describe("Name of the category"),
    },
    async ({ sessionId, projectId, name }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.createCategory(session, projectId, name)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to create category", error.message)
      }
    },
  )

  // 16. category_update
  mcpServer.tool(
    "category_update",
    "Update category properties.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      categoryId: z.string().describe("ID of the category to update"),
      name: z.string().min(1).max(50).describe("New name of the category"),
    },
    async ({ sessionId, projectId, categoryId, name }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.updateCategory(session, projectId, categoryId, name)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to update category", error.message)
      }
    },
  )

  // 17. category_delete
  mcpServer.tool(
    "category_delete",
    "Remove a category.",
    {
      sessionId: z.string().describe("Active session ID"),
      projectId: z.string().describe("ID of the project"),
      categoryId: z.string().describe("ID of the category to delete"),
    },
    async ({ sessionId, projectId, categoryId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.deleteCategory(session, projectId, categoryId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to delete category", error.message)
      }
    },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP D — SPENT TIMES (5 tools)
  // ═══════════════════════════════════════════════════════════════════════════

  // 18. spent_time_list
  mcpServer.tool(
    "spent_time_list",
    "Retrieve spent time logs with optional filtering.",
    {
      sessionId: z.string().describe("Active session ID"),
      taskId: z.string().optional().describe("Filter logs by task ID"),
      employeeId: z.string().optional().describe("Filter logs by employee ID"),
      projectId: z.string().optional().describe("Filter logs by project ID"),
      startDate: z.string().datetime().optional().describe("Filter logs from this date (ISO 8601)"),
      endDate: z.string().datetime().optional().describe("Filter logs up to this date (ISO 8601)"),
    },
    async ({ sessionId, ...params }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.listSpentTimes(
          session,
          Object.keys(params).length > 0 ? params : undefined,
        )
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch spent times", error.message)
      }
    },
  )

  // 19. spent_time_get
  mcpServer.tool(
    "spent_time_get",
    "Retrieve a single time entry details.",
    {
      sessionId: z.string().describe("Active session ID"),
      spentTimeId: z.string().describe("ID of the spent time log"),
    },
    async ({ sessionId, spentTimeId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.getSpentTime(session, spentTimeId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch spent time", error.message)
      }
    },
  )

  // 20. spent_time_log
  mcpServer.tool(
    "spent_time_log",
    "Log work hours spent on a task.",
    {
      sessionId: z.string().describe("Active session ID"),
      taskId: z.string().describe("ID of the task"),
      date: z.string().datetime().describe("Date of the work (ISO 8601)"),
      hours: z.number().min(0.01).max(24).describe("Hours spent (e.g. 4.5)"),
      activity: z.enum(SPENT_TIME_ACTIVITIES).describe("Activity type"),
      employeeId: z
        .string()
        .optional()
        .describe("ID of the employee (defaults to authenticated user)"),
      comment: z.string().max(255).optional().describe("Comment describing the work"),
      workTimeType: z.enum(SPENT_TIME_WORK_TIME_TYPES).optional().describe("Type of work time"),
    },
    async ({ sessionId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.logSpentTime(session, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to log spent time", error.message)
      }
    },
  )

  // 21. spent_time_update
  mcpServer.tool(
    "spent_time_update",
    "Update logged time entry.",
    {
      sessionId: z.string().describe("Active session ID"),
      spentTimeId: z.string().describe("ID of the spent time log to update"),
      date: z.string().datetime().optional().describe("Date of the work (ISO 8601)"),
      hours: z.number().min(0.01).max(24).optional().describe("Hours spent (e.g. 4.5)"),
      activity: z.enum(SPENT_TIME_ACTIVITIES).optional().describe("Activity type"),
      comment: z.string().max(255).optional().describe("Comment describing the work"),
      workTimeType: z.enum(SPENT_TIME_WORK_TIME_TYPES).optional().describe("Type of work time"),
    },
    async ({ sessionId, spentTimeId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.updateSpentTime(
          session,
          spentTimeId,
          Object.keys(payload).length > 0 ? payload : {},
        )
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to update spent time", error.message)
      }
    },
  )

  // 22. spent_time_delete
  mcpServer.tool(
    "spent_time_delete",
    "Delete a logged spent time record.",
    {
      sessionId: z.string().describe("Active session ID"),
      spentTimeId: z.string().describe("ID of the spent time log to delete"),
    },
    async ({ sessionId, spentTimeId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await projectService.deleteSpentTime(session, spentTimeId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to delete spent time", error.message)
      }
    },
  )
}
