import { DB_ERROR_CODES } from "@/configs/system/db.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"

import { AppError } from "./error.util.ts"

/**
 * Handles database unique constraint errors by mapping them to specific AppErrors with user-friendly messages.
 *
 * @param error Caught database error
 * @param layer Name of the calling service/layer (e.g. "EmployeeService")
 * @param fieldMap Dictionary mapping database field names to user-friendly nouns (e.g. { email: "Email", username: "Username" })
 * @param defaultMsg Default message if no specific field matches
 */
export function handleDbUniqueError(
  error: any,
  layer: string,
  fieldMap: Record<string, string>,
  defaultMsg: string = "Resource already exists",
): never {
  if (DB_ERROR_CODES.UNIQUE_CONSTRAINT.includes(error.code)) {
    let fields: string[] = []

    // Try standard Prisma target array
    if (Array.isArray(error.meta?.target)) {
      fields = error.meta.target
    } else {
      // Try Prisma driver adapter constraint fields
      const driverFields = error.meta?.driverAdapterError?.cause?.constraint?.fields
      if (Array.isArray(driverFields)) {
        fields = driverFields
      } else {
        // Fallback: Parse from raw DB message if fields not structured
        const msg = error.meta?.driverAdapterError?.cause?.originalMessage || ""
        for (const field of Object.keys(fieldMap)) {
          if (msg.includes(field)) {
            fields = [field]
            break
          }
        }
      }
    }

    if (fields.length > 0) {
      const dbField = fields[0]
      // Match key (case-insensitive and ignoring underscores)
      const matchedKey = Object.keys(fieldMap).find(
        (key) =>
          key.toLowerCase() === dbField.toLowerCase() ||
          key.replace(/_/g, "").toLowerCase() === dbField.replace(/_/g, "").toLowerCase(),
      )

      if (matchedKey) {
        throw new AppError(`${fieldMap[matchedKey]} already exists`, HttpStatusCode.CONFLICT, layer)
      }
    }

    throw new AppError(defaultMsg, HttpStatusCode.CONFLICT, layer)
  }

  throw error
}
