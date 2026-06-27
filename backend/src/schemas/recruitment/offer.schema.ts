import { z } from "zod";

export const CreateOfferSchema = z.object({
  applicationId: z.string().cuid("Invalid application ID"),
  position: z.string().min(1, "Position is required"),
  salary: z.number().positive(),
  startDate: z.string().datetime().transform(val => new Date(val)),
  benefits: z.string().optional(),
});

export const RespondOfferSchema = z.object({
  accept: z.boolean(),
  note: z.string().optional(),
});
