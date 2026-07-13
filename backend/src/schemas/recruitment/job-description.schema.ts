import { z } from "zod";

export const CreateJobDescriptionSchema = z.object({
  description: z.string().min(1, "Description is required"),
});
