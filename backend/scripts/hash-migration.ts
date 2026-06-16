import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

const target = "36b96b3f53231d6a6f96d88ac5bd3038547b9d401fa77a5123080e36f2b01927"
const path = process.argv[2]

if (!path) {
  console.error("Usage: bun run scripts/hash-migration.ts <migration.sql path>")
  process.exit(1)
}

const sql = readFileSync(path, "utf8")
const hash = createHash("sha256").update(sql).digest("hex")
console.log(hash)
console.log("match:", hash === target)
