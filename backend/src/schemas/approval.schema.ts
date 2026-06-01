import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"

import { z } from "zod"

export const processApprovalSchema = z
  .object({
    status: z.enum([APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED]),
    rejectReason: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      // If status is rejected, rejectReason must be provided and not empty
      if (data.status === APPLICATION_STATUS.REJECTED) {
        return !!data.rejectReason && data.rejectReason.trim().length > 0
      }
      return true
    },
    {
      message: "Reject reason is required when status is rejected",
      path: ["rejectReason"],
    },
  )
export type ProcessApprovalInput = z.infer<typeof processApprovalSchema>
