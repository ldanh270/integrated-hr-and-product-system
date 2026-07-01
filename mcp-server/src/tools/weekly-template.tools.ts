import { z } from "zod"

import { mcpServer } from "../mcp.js"
import { weeklyTemplateService } from "../services/weekly-template.service.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerWeeklyTemplateTools = () => {
  mcpServer.tool(
    "weekly_template_list",
    "List all weekly schedule templates. Restricted to Admin and HR Manager.",
    {
      sessionId: z.string().describe("Active session ID"),
    },
    async ({ sessionId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.list(session)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to list weekly templates", error.message)
      }
    },
  )

  mcpServer.tool(
    "weekly_template_get",
    "Get details of a weekly schedule template.",
    {
      sessionId: z.string().describe("Active session ID"),
      templateId: z.string().describe("Template ID"),
    },
    async ({ sessionId, templateId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.getOne(session, templateId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch weekly template", error.message)
      }
    },
  )

  mcpServer.tool(
    "weekly_template_create",
    "Create a weekly schedule template.",
    {
      sessionId: z.string().describe("Active session ID"),
      name: z.string().min(1).describe("Template name"),
      description: z.string().optional(),
      isDefault: z.boolean().optional().describe("Set as default for new employees"),
      shifts: z
        .array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6).describe("0=Sun, 6=Sat"),
            shiftId: z.string().describe("Shift ID for this day"),
          }),
        )
        .describe("Array of shifts for the week"),
    },
    async ({ sessionId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.create(session, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to create weekly template", error.message)
      }
    },
  )

  mcpServer.tool(
    "weekly_template_update",
    "Update a weekly schedule template.",
    {
      sessionId: z.string().describe("Active session ID"),
      templateId: z.string().describe("Template ID"),
      name: z.string().optional(),
      description: z.string().optional(),
      isDefault: z.boolean().optional(),
      shifts: z
        .array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6),
            shiftId: z.string(),
          }),
        )
        .optional(),
    },
    async ({ sessionId, templateId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.update(session, templateId, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to update weekly template", error.message)
      }
    },
  )

  mcpServer.tool(
    "weekly_template_delete",
    "Delete a weekly schedule template.",
    {
      sessionId: z.string().describe("Active session ID"),
      templateId: z.string().describe("Template ID"),
    },
    async ({ sessionId, templateId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.delete(session, templateId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to delete weekly template", error.message)
      }
    },
  )

  mcpServer.tool(
    "weekly_template_apply",
    "Apply a weekly template to specific employees.",
    {
      sessionId: z.string().describe("Active session ID"),
      templateId: z.string().describe("Template ID"),
      employeeIds: z.array(z.string()).describe("Array of employee IDs"),
    },
    async ({ sessionId, templateId, employeeIds }) => {
      try {
        const session = requireSession(sessionId)
        const data = await weeklyTemplateService.apply(session, templateId, employeeIds)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to apply weekly template", error.message)
      }
    },
  )
}
