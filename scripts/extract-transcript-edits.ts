import { readFileSync } from "node:fs"

const TRANSCRIPT =
  "C:/Users/Admin/.cursor/projects/d-KY5-integrated-hr-and-product-system/agent-transcripts/67eeedd8-0197-4dc9-864a-52771455b270/67eeedd8-0197-4dc9-864a-52771455b270.jsonl"

function normalizePath(raw: string): string | null {
  let p = raw.replace(/\\/g, "/")
  const marker = "integrated-hr-and-product-system/"
  const idx = p.toLowerCase().indexOf(marker)
  if (idx >= 0) return p.slice(idx + marker.length)
  return null
}

const targetFiles = new Set([
  "backend/prisma/schema.prisma",
  "backend/src/utils/schedule.util.ts",
  "backend/src/repositories/schedule.repository.ts",
  "backend/src/repositories/employee-shift.repository.ts",
  "backend/src/types/shift.types.ts",
  "backend/src/schemas/shift.schema.ts",
  "backend/src/controllers/schedule.controller.ts",
  "backend/src/routes/schedule.route.ts",
  "backend/src/configs/entities/attendance.config.ts",
  "backend/src/libs/database.ts",
  "backend/src/index.ts",
  "backend/src/types/attendance.types.ts",
  "frontend/src/config/api.config.ts",
  "frontend/src/lib/api/attendance.api.ts",
  "frontend/src/types/attendance.types.ts",
  "frontend/src/config/entities/attendance.config.ts",
  "frontend/src/config/routes.config.ts",
  "frontend/src/routes/index.ts",
  "frontend/src/config/subsystem.config.ts",
  "frontend/src/config/rules/attendance.config.ts",
  "frontend/src/components/features/attendance/weekly-schedule-calendar.tsx",
  "frontend/src/components/features/attendance/employee-schedule-cells.tsx",
  "frontend/src/components/features/attendance/employee-my-schedule-view.tsx",
  "frontend/src/components/features/employees/EmployeeEditDrawer.tsx",
])

const fileContents = new Map<string, string>()

const lines = readFileSync(TRANSCRIPT, "utf8").split("\n").filter(Boolean)
for (const line of lines) {
  try {
    const obj = JSON.parse(line) as {
      message?: {
        content?: Array<{
          type?: string
          name?: string
          input?: { path?: string; contents?: string; old_string?: string; new_string?: string }
        }>
      }
    }
    for (const item of obj.message?.content ?? []) {
      if (item.type !== "tool_use") continue
      const input = item.input
      if (!input?.path) continue
      const rel = normalizePath(input.path)
      if (!rel || !targetFiles.has(rel)) continue

      if (item.name === "Write" && input.contents !== undefined) {
        fileContents.set(rel, input.contents)
      } else if (item.name === "StrReplace" && input.old_string && input.new_string) {
        const current = fileContents.get(rel)
        if (current === undefined) continue
        if (!current.includes(input.old_string)) {
          // try without caring if file not loaded yet - skip
          continue
        }
        fileContents.set(rel, current.replace(input.old_string, input.new_string))
      }
    }
  } catch {}
}

// Also seed from Write for target files that only have StrReplace later
for (const line of lines) {
  try {
    const obj = JSON.parse(line)
    for (const item of obj.message?.content ?? []) {
      if (item.type !== "tool_use" || item.name !== "Write") continue
      const rel = normalizePath(item.input?.path ?? "")
      if (!rel || !targetFiles.has(rel)) continue
      if (!fileContents.has(rel)) fileContents.set(rel, item.input.contents)
    }
  } catch {}
}

for (const rel of [...targetFiles].sort()) {
  const c = fileContents.get(rel)
  console.log(`${rel}: ${c ? `${c.length} chars` : "MISSING"}`)
}
