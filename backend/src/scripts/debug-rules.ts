import { prisma } from "../libs/database.ts"

/**
 * Debugging script to print employees, project configuration, task trackers,
 * and project-scoped roles from the database for verification.
 */
async function main() {
  const email = "employee@example.com"
  const projectId = "cmr2bk13p006zrkwsg2kdqhp8"

  const employees = await prisma.employee.findMany({
    include: { positionRel: true }
  })
  console.log("=== All Employees ===")
  console.log(employees.map(e => ({ id: e.id, email: e.email, position: e.position, positionId: e.positionId })))

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })
  console.log("=== Project ===")
  console.log(project)

  const trackers = await prisma.projectTracker.findMany({
    where: { projectId }
  })
  console.log("=== Project Trackers ===")
  console.log(trackers)

  const roles = await prisma.projectRole.findMany({
    where: { projectId }
  })
  console.log("=== Project Roles ===")
  console.log(roles)
}

main().catch(console.error)
