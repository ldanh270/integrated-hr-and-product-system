import { z } from "zod"

import { mcpServer } from "../mcp.js"
import { shiftChangeRequestService } from "../services/shift-change-request.service.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerShiftChangeRequestTools = () => {
  mcpServer.tool(
    "shift_change_list_mine",
    "Get your own shift change requests.",
    {
      sessionId: z.string().describe("Active session ID"),
    },
    async ({ sessionId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await shiftChangeRequestService.getMine(session)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to fetch my shift change requests", error.message)
      }
    },
  )

  mcpServer.tool(
    "shift_change_submit",
    "Create a new shift change request.",
    {
      sessionId: z.string().describe("Active session ID"),
      date: z.string().datetime().describe("Date of the shift change (ISO 8601)"),
      employeeShiftId: z.string().describe("Your current employee shift ID"),
      workingShiftId: z.string().optional().describe("ID of the new shift you want to work"),
      swapWithEmployeeId: z.string().optional().describe("ID of employee you want to swap with"),
      swapWithShiftId: z.string().optional().describe("ID of their shift to swap with"),
      reason: z.string().optional(),
      note: z.string().optional(),
      assignedToId: z.string().optional(),
    },
    async ({ sessionId, ...payload }) => {
      try {
        const session = requireSession(sessionId)
        const data = await shiftChangeRequestService.create(session, payload)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to create shift change request", error.message)
      }
    },
  )

  mcpServer.tool(
    "shift_change_approve",
    "Approve a pending shift change request.",
    {
      sessionId: z.string().describe("Active session ID"),
      requestId: z.string().describe("ID of the shift change request to approve"),
    },
    async ({ sessionId, requestId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await shiftChangeRequestService.approve(session, requestId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to approve shift change request", error.message)
      }
    },
  )

  mcpServer.tool(
    "shift_change_reject",
    "Reject a pending shift change request.",
    {
      sessionId: z.string().describe("Active session ID"),
      requestId: z.string().describe("ID of the shift change request to reject"),
    },
    async ({ sessionId, requestId }) => {
      try {
        const session = requireSession(sessionId)
        const data = await shiftChangeRequestService.reject(session, requestId)
        return buildSuccess(data)
      } catch (error: any) {
        return buildError("Failed to reject shift change request", error.message)
      }
    },
  )
}
