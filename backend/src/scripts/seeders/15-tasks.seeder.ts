import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class TasksSeeder implements ISeeder {
  readonly name = "Tasks"
  readonly order = 15

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding tasks...")

    const adminId = context.adminId
    const projectIds = context.projectIds

    if (!adminId || projectIds.length === 0) {
      throw new Error("Missing required context (admin or projects).")
    }

    // Clear existing tasks first to avoid duplicated seeding errors
    await prisma.task.deleteMany()

    for (const projectId of projectIds) {
      // Find members of this project
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { employeeId: true },
      })

      if (members.length === 0) continue

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      const projStart = project?.startDate ? new Date(project.startDate) : new Date()

      // Define structured parent features to demonstrate the subtask tree
      const parentFeatures = [
        { title: "Feature: [201001] Admin - Danh sách doanh nghiệp", tracker: "feature" },
        { title: "Feature: [201002] Admin - Tạo/Sửa/Xóa doanh nghiệp", tracker: "feature" },
        { title: "Feature: [201003] User - Đăng ký thông tin doanh nghiệp", tracker: "feature" },
      ]

      for (const [fIdx, feat] of parentFeatures.entries()) {
        
        // 1. Create Parent Feature Task
        const parentTask = await prisma.task.create({
          data: {
            projectId,
            title: feat.title,
            description: `Tính năng cha quản lý cấu trúc nghiệp vụ của phân hệ doanh nghiệp.`,
            priority: "high",
            status: "in_progress",
            assigneeId: members[0].employeeId,
            createdById: adminId,
            startDate: projStart,
            dueDate: new Date(projStart.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days duration
            estimatedTime: 40,
            progress: 30,
            tracker: "feature",
          }
        })

        // 2. Create Child Subtasks for this feature
        // Subtask 1: Completed Task (progress = 100, status = done)
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Dev][${201001 + fIdx}] Code giao diện danh sách`,
            description: "Thiết kế và code UI React cho danh sách.",
            priority: "medium",
            status: "done",
            assigneeId: members[0].employeeId,
            createdById: adminId,
            startDate: projStart,
            dueDate: new Date(projStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            completedAt: new Date(projStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            estimatedTime: 12,
            progress: 100,
            tracker: "task",
            parentTaskId: parentTask.id,
            // Spent time mock
            spentTimes: {
              create: {
                employeeId: members[0].employeeId,
                hours: 10,
                comment: "Hoàn thành code UI danh sách sớm hơn dự kiến",
                activity: "development",
                date: projStart,
              }
            }
          }
        })

        // Subtask 2: In Review Task (status = in_review, with link deliverables)
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [TEST][${201001 + fIdx}] Viết test case tự động`,
            description: "Viết Integration test Playwright cho UI.",
            priority: "medium",
            status: "in_review",
            assigneeId: members.length > 1 ? members[1].employeeId : members[0].employeeId,
            createdById: adminId,
            startDate: new Date(projStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            dueDate: new Date(projStart.getTime() + 8 * 24 * 60 * 60 * 1000),
            estimatedTime: 8,
            progress: 95,
            tracker: "test",
            parentTaskId: parentTask.id,
            resultUrl: "https://github.com/ldanh270/integrated-hr-and-product-system/pull/42",
            resultNotes: "Đã pass toàn bộ test case ở local. Nhờ Team Leader review hộ.",
          }
        })

        // Subtask 3: Overdue Task (progress < 100, status = in_progress, current date is after dueDate)
        // Set start/due dates to be in the past relative to today (since today is June 19, 2026)
        const pastStart = new Date("2026-06-01T00:00:00.000Z")
        const pastDue = new Date("2026-06-10T00:00:00.000Z") // Due date in the past
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Dev][${201001 + fIdx}] Code logic API & Database`,
            description: "Xây dựng các repository và controllers cho API.",
            priority: "urgent",
            status: "in_progress",
            assigneeId: members.length > 2 ? members[2].employeeId : members[0].employeeId,
            createdById: adminId,
            startDate: pastStart,
            dueDate: pastDue,
            estimatedTime: 16,
            progress: 60, // Not finished yet (Overdue)
            tracker: "task",
            parentTaskId: parentTask.id,
          }
        })

        // Subtask 4: Task with HR Leave Conflict (overlaps with approved leave days)
        // Fetch if the employee has any approved leave days
        const assigneeIdForConflict = members.length > 1 ? members[1].employeeId : members[0].employeeId
        const employeeLeaves = await prisma.application.findMany({
          where: {
            employeeId: assigneeIdForConflict,
            status: "approved",
            type: "leave",
          },
          take: 1
        })

        let conflictStart = new Date(projStart.getTime() + 10 * 24 * 60 * 60 * 1000)
        let conflictDue = new Date(projStart.getTime() + 14 * 24 * 60 * 60 * 1000)

        if (employeeLeaves.length > 0) {
          // Set task dates to overlap with the employee's approved leave days
          conflictStart = new Date(employeeLeaves[0].startDate)
          conflictDue = new Date(employeeLeaves[0].endDate)
        }

        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Support][${201001 + fIdx}] Hướng dẫn sử dụng & Deploy`,
            description: "Deploy sản phẩm lên môi trường Staging.",
            priority: "low",
            status: "todo",
            assigneeId: assigneeIdForConflict,
            createdById: adminId,
            startDate: conflictStart,
            dueDate: conflictDue,
            estimatedTime: 6,
            progress: 0,
            tracker: "support",
            parentTaskId: parentTask.id,
          }
        })
      }
    }

    console.log("  Successfully seeded structured parent-child tasks and statuses.")

    return {}
  }
}

registry.register(new TasksSeeder())

if (import.meta.main) {
  const seeder = new TasksSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const projects = await prisma.project.findMany()
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.projectIds = projects.map((p) => p.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
