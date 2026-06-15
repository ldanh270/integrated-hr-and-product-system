import { z } from "zod"

export const createTaskCategorySchema = z
  .object({
    name: z.string().min(1, "Category name is required").max(50, "Category name too long").trim(),
  })
  .strict()

export type CreateTaskCategorySchemaType = z.infer<typeof createTaskCategorySchema>

export const updateTaskCategorySchema = z
  .object({
    name: z.string().min(1, "Category name is required").max(50, "Category name too long").trim(),
  })
  .strict()

export type UpdateTaskCategorySchemaType = z.infer<typeof updateTaskCategorySchema>
