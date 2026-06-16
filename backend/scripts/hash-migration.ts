import { createHash, timingSafeEqual } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const target = "36b96b3f53231d6a6f96d88ac5bd3038547b9d401fa77a5123080e36f2b01927"
const migrationArg = process.argv[2]

function secureHashEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  return timingSafeEqual(Buffer.from(left), Buffer.from(right))
}

if (!migrationArg) {
  console.error("Usage: bun run scripts/hash-migration.ts prisma/migrations/.../migration.sql")
  process.exit(1)
}

const migrationsRoot = resolve("prisma/migrations")
const migrationPath = resolve(migrationArg)

if (!migrationPath.startsWith(migrationsRoot)) {
  console.error("Migration path must be under prisma/migrations")
  process.exit(1)
}

const sql = readFileSync(migrationPath, "utf8")
const hash = createHash("sha256").update(sql).digest("hex")
console.log(hash)
console.log("match:", secureHashEquals(hash, target))
