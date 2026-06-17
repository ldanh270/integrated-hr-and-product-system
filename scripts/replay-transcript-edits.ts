import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"

const TRANSCRIPT =
  "C:/Users/Admin/.cursor/projects/d-KY5-integrated-hr-and-product-system/agent-transcripts/67eeedd8-0197-4dc9-864a-52771455b270/67eeedd8-0197-4dc9-864a-52771455b270.jsonl"
const REPO = join(import.meta.dir, "..")

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
  return null
}

type Op =
  | { kind: "write"; path: string; contents: string }
  | { kind: "replace"; path: string; old: string; new: string }

const ops: Op[] = []
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
      if (!rel || SKIP.has(rel)) continue

      if (item.name === "Write" && input.contents !== undefined) {
        ops.push({ kind: "write", path: rel, contents: input.contents })
      } else if (item.name === "StrReplace" && input.old_string && input.new_string) {
        ops.push({ kind: "replace", path: rel, old: input.old_string, new: input.new_string })
      }
    }
  } catch {}
}

const touched = new Set(ops.map((o) => o.path))
const state = new Map<string, string>()

for (const path of touched) {
  const full = join(REPO, path)
  if (existsSync(full)) state.set(path, readFileSync(full, "utf8"))
}

let applied = 0
let failed = 0

for (const op of ops) {
  if (op.kind === "write") {
    state.set(op.path, op.contents)
    applied++
    continue
  }

  const current = state.get(op.path)
  if (current === undefined) {
    failed++
    continue
  }
  if (!current.includes(op.old)) {
    failed++
    continue
  }
  state.set(op.path, current.replace(op.old, op.new))
  applied++
}

let written = 0
for (const [rel, contents] of state) {
  const full = join(REPO, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, contents, "utf8")
  written++
}

console.log(`Ops: ${ops.length}, applied: ${applied}, failed: ${failed}, files written: ${written}`)
for (const p of [...state.keys()].sort()) console.log(`  ${p}`)
