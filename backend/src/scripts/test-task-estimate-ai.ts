import { prisma } from "../libs/database.ts"
import { PrismaTaskRepository } from "../repositories/task.repository.ts"
import { PrismaProjectRepository } from "../repositories/project.repository.ts"
import { PrismaEmployeeRepository } from "../repositories/employee.repository.ts"
import { PrismaApplicationRepository } from "../repositories/application.repository.ts"
import { PrismaSpentTimeRepository } from "../repositories/spent-time.repository.ts"
import { TaskEstimateAiService } from "../services/task-estimate-ai.service.ts"
import dotenv from "dotenv"

dotenv.config()

async function main() {
  console.log("Initializing database connection...")
  const taskRepository = new PrismaTaskRepository(prisma)
  const projectRepository = new PrismaProjectRepository(prisma)
  const employeeRepository = new PrismaEmployeeRepository(prisma)
  const applicationRepository = new PrismaApplicationRepository(prisma)
  const spentTimeRepository = new PrismaSpentTimeRepository(prisma)

  const service = new TaskEstimateAiService(
    taskRepository,
    projectRepository,
    employeeRepository,
    applicationRepository,
    spentTimeRepository
  )

  // Find a task in database
  const task = await prisma.task.findFirst({
    include: {
      project: true
    }
  })
  
  if (!task) {
    console.log("No task found in database. Please run the seed command first (bun run seed).")
    return
  }

  console.log(`\n========================================`)
  console.log(`TESTING ASSIGNEE SUGGESTIONS FOR TASK:`)
  console.log(`- Title: "${task.title}"`)
  console.log(`- Description: "${task.description || "None"}"`)
  console.log(`- Project: "${task.project?.name || task.projectId}"`)
  console.log(`========================================`)

  console.log("Calling TaskEstimateAiService.getAssigneeSuggestions...")
  const suggestions = await service.getAssigneeSuggestions(task.id)
  
  console.log("\nSuggestions Results:")
  console.log(JSON.stringify(suggestions, null, 2))

  console.log(`\n========================================`)
  console.log(`TESTING PROJECT TASK DECOMPOSITION:`)
  console.log(`- Project ID: ${task.projectId}`)
  console.log(`========================================`)
  
  try {
    const generatedTasks = await service.generateProjectTasks(task.projectId)
    console.log("\nGenerated Tasks Suggestions:")
    console.log(JSON.stringify(generatedTasks, null, 2))
  } catch (err: any) {
    console.log(`Error generating project tasks: ${err.message}`)
  }
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
