import { z } from "zod";

export const ConvertToEmployeeSchema = z.object({
  applicationId: z.string().cuid("Invalid application ID"),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  startDate: z.string().datetime().transform(val => new Date(val)),
});
