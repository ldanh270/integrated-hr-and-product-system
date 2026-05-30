import Employee from "@/entities/Employee.ts"
import Project from "@/entities/product/Project.ts"
import Task from "@/entities/product/Task.ts"
import { PROJECT_TEMPLATES, TASK_MOCKS, TECH_STACKS } from "../data/product.data.ts"
import { faker } from "@faker-js/faker"

import { seedEmployees } from "./employee.seeder.ts"

export const seedProduct = async (passedEmployees?: any[]): Promise<{ projects: any[] }> => {
  console.log("🏗️ Seeding Product (Projects & Tasks)...")

  // 1. Get employees or auto-seed if none exist
  let employees = passedEmployees || (await Employee.find())
  if (employees.length === 0) {
    console.log("⚠️ No employees found in database. Automatically seeding employees first...")
    employees = await seedEmployees()
  }

  const admin = employees.find(e => e.role === "admin") || employees[0]
  const leaders = employees.filter(e => e.role === "team_leader" || e.role === "general_manager")
  const staff = employees.filter(e => e.role === "employee")

  // 1.5. Clear existing projects and tasks
  await Project.deleteMany({})
  await Task.deleteMany({})

  // 2. Seed Projects
  const createdProjects: any[] = []
  let taskCount = 0

  for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
    const template = PROJECT_TEMPLATES[i]
    const leader = faker.helpers.arrayElement(leaders)
    
    // Pick 3 random members
    const membersList = faker.helpers.arrayElements(staff, 3)
    const membersData = membersList.map(m => ({
      employeeId: m._id,
      joinedAt: faker.date.past({ years: 1 }),
      removedAt: null,
    }))

    const project = await Project.create({
      name: template.name,
      description: template.description,
      techStack: TECH_STACKS[i % TECH_STACKS.length],
      status: "active",
      startDate: faker.date.past({ years: 1 }),
      expectedEndDate: faker.date.future(),
      actualEndDate: null,
      teamLeaderId: leader._id,
      createdBy: admin._id,
      members: membersData,
    })
    createdProjects.push(project)

    // Seed Tasks for this project
    for (const mockTask of TASK_MOCKS) {
      const assignee = faker.helpers.arrayElement(membersList)
      
      await Task.create({
        projectId: project._id,
        title: mockTask.title,
        description: mockTask.description,
        priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
        status: faker.helpers.arrayElement(["todo", "in_progress", "in_review", "done"]),
        assigneeId: assignee._id,
        createdBy: leader._id,
        dueDate: faker.date.soon({ days: 30 }),
      })
      taskCount++
    }
  }

  console.log(`✅ Seeded ${createdProjects.length} projects and ${taskCount} tasks`)
  return { projects: createdProjects }
}
