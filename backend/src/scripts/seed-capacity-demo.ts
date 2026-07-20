/**
 * Seeds one deterministic project with enough history for Part-time Capacity Copilot demos.
 * Safe to rerun: it deletes only the project with DEMO_PROJECT_NAME, then recreates demo data.
 */
import {
  PROJECT_MEMBER_WORK_MODE,
  PROJECT_STATUS,
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TRACKER,
} from "@/configs/entities/project.config.ts"
import { PART_TIME_AVAILABILITY_STATUS } from "@/configs/entities/part-time-availability.config.ts"
import { prisma } from "@/libs/database.ts"

const DEMO_PROJECT_NAME = "AI Capacity Copilot Demo"
const DEMO_DEAL_TARGET_PERCENT = 20
const DEMO_FORECAST_WEEK_START = new Date("2026-07-20T00:00:00.000Z")
const DEMO_PREVIOUS_WEEK_START = new Date("2026-07-13T00:00:00.000Z")
const DEMO_PREVIOUS_WEEK_END = new Date("2026-07-19T00:00:00.000Z")
const WORKDAY_START_MINUTES = 8 * 60
const WORKDAY_END_MINUTES = 17 * 60

const roleSeeds = [
  { code: "developer", name: "Lập trình viên" },
  { code: "tester", name: "Kiểm thử viên" },
  { code: "leader", name: "Trưởng nhóm" },
] as const

const taskStatusSeeds = [
  { name: "To Do", order: 0, isDefault: true, isCompleted: false },
  { name: "In Progress", order: 1, isDefault: false, isCompleted: false },
  { name: "Done", order: 2, isDefault: false, isCompleted: true },
] as const

async function pickEmployees() {
  const employees = await prisma.employee.findMany({
    where: { status: "active", deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 8,
  })

  if (employees.length < 3) {
    throw new Error("Cần ít nhất 3 nhân viên active để seed demo Capacity Copilot.")
  }

  return {
    admin: employees.find((employee) => employee.username === "admin") ?? employees[0],
    developer: employees.find((employee) => employee.position === "Developer") ?? employees[1],
    tester: employees.find((employee) => employee.position === "Tester") ?? employees[2],
    extra: employees.find((employee) => employee.id !== employees[0].id) ?? employees[1],
  }
}

async function main() {
  const people = await pickEmployees()

  await prisma.project.deleteMany({ where: { name: DEMO_PROJECT_NAME } })

  const project = await prisma.project.create({
    data: {
      name: DEMO_PROJECT_NAME,
      description: "Demo project đầy đủ dữ kiện cho Part-time Capacity Copilot.",
      techStack: ["React", "Node.js", "PostgreSQL"],
      status: PROJECT_STATUS.ACTIVE,
      taskCreationPolicy: "all_members",
      startDate: DEMO_PREVIOUS_WEEK_START,
      expectedEndDate: new Date("2026-08-31T00:00:00.000Z"),
      dealTargetPercent: DEMO_DEAL_TARGET_PERCENT,
      teamLeaderId: people.admin.id,
      createdById: people.admin.id,
      allowedTaskTrackers: [TASK_TRACKER.FEATURE, TASK_TRACKER.TEST, TASK_TRACKER.TASK],
    },
  })

  const roles = await Promise.all(
    roleSeeds.map((role) =>
      prisma.projectRole.create({
        data: {
          projectId: project.id,
          code: role.code,
          name: role.name,
        },
      }),
    ),
  )
  const roleByCode = new Map(roles.map((role) => [role.code, role]))

  const statuses = await Promise.all(
    taskStatusSeeds.map((status) =>
      prisma.projectTaskStatus.create({
        data: {
          projectId: project.id,
          name: status.name,
          order: status.order,
          isDefault: status.isDefault,
          isCompleted: status.isCompleted,
        },
      }),
    ),
  )
  const doneStatus = statuses.find((status) => status.name === "Done")

  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        employeeId: people.admin.id,
        roleId: roleByCode.get("leader")?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
      },
      {
        projectId: project.id,
        employeeId: people.developer.id,
        roleId: roleByCode.get("developer")?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        hourlyRate: 50000,
      },
      {
        projectId: project.id,
        employeeId: people.tester.id,
        roleId: roleByCode.get("tester")?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        hourlyRate: 50000,
      },
    ],
    skipDuplicates: true,
  })

  const doneTasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: project.id,
        title: "Hoàn thành API forecast tuần trước",
        tracker: TASK_TRACKER.FEATURE,
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.DONE,
        statusId: doneStatus?.id,
        assigneeId: people.developer.id,
        createdById: people.admin.id,
        startDate: DEMO_PREVIOUS_WEEK_START,
        dueDate: DEMO_PREVIOUS_WEEK_END,
        completedAt: new Date("2026-07-15T10:00:00.000Z"),
        estimatedTime: 10,
        progress: 100,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        title: "Hoàn thành test case capacity tuần trước",
        tracker: TASK_TRACKER.TEST,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.DONE,
        statusId: doneStatus?.id,
        assigneeId: people.tester.id,
        createdById: people.admin.id,
        startDate: DEMO_PREVIOUS_WEEK_START,
        dueDate: DEMO_PREVIOUS_WEEK_END,
        completedAt: new Date("2026-07-16T10:00:00.000Z"),
        estimatedTime: 10,
        progress: 100,
      },
    }),
  ])

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Implement module forecast tuần được chọn",
      tracker: TASK_TRACKER.FEATURE,
      priority: TASK_PRIORITY.HIGH,
      status: TASK_STATUS.IN_PROGRESS,
      assigneeId: people.developer.id,
      createdById: people.admin.id,
      startDate: DEMO_FORECAST_WEEK_START,
      dueDate: new Date("2026-07-26T00:00:00.000Z"),
      estimatedTime: 30,
      progress: 30,
    },
  })

  await prisma.spentTime.createMany({
    data: [
      {
        taskId: doneTasks[0].id,
        employeeId: people.developer.id,
        date: new Date("2026-07-15T00:00:00.000Z"),
        hours: 20,
        comment: "Demo history: developer spent time",
        activity: SPENT_TIME_ACTIVITY.DEVELOP,
        workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
        status: SPENT_TIME_STATUS.APPROVED,
        approvedById: people.admin.id,
        approvedAt: new Date("2026-07-15T18:00:00.000Z"),
      },
      {
        taskId: doneTasks[1].id,
        employeeId: people.tester.id,
        date: new Date("2026-07-16T00:00:00.000Z"),
        hours: 20,
        comment: "Demo history: tester spent time",
        activity: SPENT_TIME_ACTIVITY.TEST,
        workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
        status: SPENT_TIME_STATUS.APPROVED,
        approvedById: people.admin.id,
        approvedAt: new Date("2026-07-16T18:00:00.000Z"),
      },
    ],
  })

  await prisma.partTimeWeeklyAvailability.upsert({
    where: {
      employeeId_weekStart: {
        employeeId: people.tester.id,
        weekStart: DEMO_FORECAST_WEEK_START,
      },
    },
    update: {},
    create: {
      employeeId: people.tester.id,
      weekStart: DEMO_FORECAST_WEEK_START,
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      submittedAt: new Date("2026-07-19T08:00:00.000Z"),
      note: "Demo availability for Capacity Copilot.",
      days: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          isBusyAllDay: false,
          slots: {
            create: {
              startTime: WORKDAY_START_MINUTES,
              endTime: WORKDAY_END_MINUTES,
              sortOrder: 0,
            },
          },
        })),
      },
    },
  })

  console.log("Seeded Capacity Copilot demo project.")
  console.log(`Project: ${project.name}`)
  console.log(`Target: ${DEMO_DEAL_TARGET_PERCENT}%`)
  console.log("Forecast week: 20/07/2026 - 26/07/2026")
  console.log("Expected productivity: previous week completed 20% with 40 spent hours = 0.5%/hour.")
}

await main()
await prisma.$disconnect()
