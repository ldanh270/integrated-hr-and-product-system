import { z } from "zod";
import { BGC_OVERALL_STATUS_VALUES } from "../../configs/entities/recruitment.config";

export const UpdateBackgroundCheckSchema = z.object({
  overallStatus: z.enum(BGC_OVERALL_STATUS_VALUES),
});
