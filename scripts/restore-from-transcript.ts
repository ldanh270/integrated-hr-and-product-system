import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const TRANSCRIPT =
  "C:/Users/Admin/.cursor/projects/d-KY5-integrated-hr-and-product-system/agent-transcripts/67eeedd8-0197-4dc9-864a-52771455b270/67eeedd8-0197-4dc9-864a-52771455b270.jsonl"
const REPO_ROOT = join(import.meta.dir, "..")

const SKIP = new Set([
  "frontend/src/components/features/attendance/weekly-schedules/apply-weekly-template-panel.tsx",
  "frontend/src/components/features/attendance/weekly-schedules/generate-shifts-panel.tsx",
  "frontend/src/components/features/attendance/weekly-schedules/generate-shifts-preview-table.tsx",
  "frontend/src/hooks/attendance/use-generate-shifts.ts",
  "frontend/src/hooks/employees/use-employee-weekly-schedule-section.ts",
  "frontend/src/components/features/employees/employee-weekly-schedule-section.tsx",
])

function normalizePath(raw: string): string | null {
  let p = raw.replace(/\\/g, "/")
  const marker = "integrated-hr-and-product-system/"
  const idx = p.toLowerCase().indexOf(marker)
  if (idx >= 0) return p.slice(idx + marker.length)
  if (/^[A-Za-z]:/.test(p)) {
    const parts = p.split("/")
    const repoIdx = parts.findIndex((x) => x === "integrated-hr-and-product-system")
    if (repoIdx >= 0) return parts.slice(repoIdx + 1).join("/")
  }
  if (!p.includes(":")) return p
  return null
}

const lines = readFileSync(TRANSCRIPT, "utf8").split("\n").filter(Boolean)
const writes = new Map<string, string>()

for (const line of lines) {
  try {
    const obj = JSON.parse(line) as {
      message?: { content?: Array<{ type?: string; name?: string; input?: { path?: string; contents?: string } }> }
    }
    const content = obj.message?.content
    if (!Array.isArray(content)) continue
    for (const item of content) {
      if (item.type !== "tool_use" || item.name !== "Write") continue
      const { path: rawPath, contents } = item.input ?? {}
      if (!rawPath || contents === undefined) continue
      const rel = normalizePath(rawPath)
      if (!rel || SKIP.has(rel)) continue
      writes.set(rel, contents)
    }
  } catch {
    // skip malformed lines
  }
}

let restored = 0
for (const [rel, contents] of writes) {
  const full = join(REPO_ROOT, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, contents, "utf8")
  restored++
}

console.log(`Restored ${restored} files from transcript`)
for (const p of [...writes.keys()].sort()) console.log(`  ${p}`)
