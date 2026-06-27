import fs from "fs"
import path from "path"
import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { getSeedPassword } from "@/scripts/seeders/seed-password.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

const employeeRepository = new PrismaEmployeeRepository(prisma)

/**
 * Resolves a child entry and rejects paths that escape the current scan directory.
 */
function resolveChildPath(parentDir: string, childName: string): string | null {
  const baseDir = path.resolve(parentDir)
  const candidatePath = path.resolve(baseDir, childName)
  const allowedPrefix = `${baseDir}${path.sep}`

  if (candidatePath === baseDir || candidatePath.startsWith(allowedPrefix)) {
    return candidatePath
  }

  return null
}

/**
 * Strips comments from a TypeScript source file content.
 */
function stripComments(content: string): string {
  // Strip multi-line comments
  let clean = content.replace(/\/\*[\s\S]*?\*\//g, "")
  // Strip single-line comments
  clean = clean.replace(/\/\/.*$/gm, "")
  return clean
}

/**
 * Scans the src directory for static role references (ROLE constant or req.user.role).
 * Ignores seeders, tests, and utility files.
 */
export function countStaticRoleReferences(): { total: number; details: string[] } {
  const srcDir = path.resolve(__dirname, "..")
  const details: string[] = []
  let total = 0

  function scan(dir: string) {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = resolveChildPath(dir, file.name)
      if (!fullPath) {
        continue
      }

      if (file.isDirectory()) {
        // Skip scripts/seeders directory and tests
        if (file.name === "scripts" || file.name === "test" || file.name === "__tests__") {
          continue
        }
        scan(fullPath)
      } else if (file.isFile() && file.name.endsWith(".ts")) {
        // Skip this file itself, seeders, and spec files
        if (
          file.name === "startup-assertion.util.ts" ||
          file.name.includes(".test.") ||
          file.name.includes(".spec.")
        ) {
          continue
        }

        const content = fs.readFileSync(fullPath, "utf-8")
        const cleanContent = stripComments(content)

        // Check for matches of legacy ROLE enum, LegacyRole, or req.user.role
        const roleMatches = cleanContent.match(/\bROLE\./g)
        const legacyRoleMatches = cleanContent.match(/\bLegacyRole\b/g)
        const reqUserRoleMatches = cleanContent.match(/req\.user\.role\b/g)

        const fileMatches =
          (roleMatches?.length || 0) +
          (legacyRoleMatches?.length || 0) +
          (reqUserRoleMatches?.length || 0)
        if (fileMatches > 0) {
          total += fileMatches
          const relativePath = path.relative(srcDir, fullPath)
          details.push(
            `File: ${relativePath} (${roleMatches?.length || 0} ROLE., ${legacyRoleMatches?.length || 0} LegacyRole, ${reqUserRoleMatches?.length || 0} req.user.role)`,
          )
        }
      }
    }
  }

  scan(srcDir)
  return { total, details }
}

/**
 * Bootstrap mechanism to ensure at least one active Admin exists in the database.
 * If 0 active admins are found, it creates the 'admin' role, a default active employee,
 * and links them together.
 */
export async function bootstrapAdmin(): Promise<void> {
  const activeAdminsCount = await employeeRepository.countActiveAdmins()
  if (activeAdminsCount > 0) {
    return
  }

  console.warn("No active administrators found in the database. Bootstrapping fail-safe admin...")

  // Ensure administrative dynamic role 'admin' exists
  let adminRole = await prisma.appRole.findFirst({
    where: { name: "admin", deletedAt: null },
  })

  if (!adminRole) {
    adminRole = await prisma.appRole.create({
      data: {
        name: "admin",
        description: "Bootstrap fail-safe system administrator access",
        isSystem: true,
        isAdministrative: true,
        isActive: true,
      },
    })
    console.log("[created] system role 'admin'.")
  } else if (!adminRole.isAdministrative) {
    await prisma.appRole.update({
      where: { id: adminRole.id },
      data: { isAdministrative: true },
    })
    console.log("[updated] system role 'admin' to administrative.")
  }

  // Ensure active employee 'admin' exists
  let adminEmployee = await prisma.employee.findFirst({
    where: { username: "admin", deletedAt: null },
  })

  if (!adminEmployee) {
    const defaultPassword = getSeedPassword("SEED_CORE_ACCOUNTS_PASSWORD")
    const defaultPasswordHash = await HashUtil.hash(defaultPassword)
    adminEmployee = await prisma.employee.create({
      data: {
        fullName: "System Administrator",
        username: "admin",
        email: "admin@company.com",
        passwordHash: defaultPasswordHash,
        status: "active",
        position: "Administrator",
      },
    })
    console.log("[created] employee 'admin' with password from SEED_CORE_ACCOUNTS_PASSWORD.")
  } else if (adminEmployee.status !== "active") {
    adminEmployee = await prisma.employee.update({
      where: { id: adminEmployee.id },
      data: { status: "active" },
    })
    console.log("[updated] employee 'admin' reactivated.")
  }

  // Ensure employee-role mapping exists
  const mappingExists = await prisma.employeeRole.findUnique({
    where: {
      employeeId_roleId: {
        employeeId: adminEmployee.id,
        roleId: adminRole.id,
      },
    },
  })

  if (!mappingExists) {
    await prisma.employeeRole.create({
      data: {
        employeeId: adminEmployee.id,
        roleId: adminRole.id,
      },
    })
    console.log("[created] employee-role mapping for admin.")
  }

  console.log("[done] Bootstrap admin mechanism completed successfully.")
}
