/**
 * Seeds one deterministic project with enough history for Part-time Capacity Copilot demos.
 * Safe to rerun: it deletes only the project with DEMO_PROJECT_NAME, then recreates demo data.
 */
import {
  PROJECT_MEMBER_WORK_MODE,
  PROJECT_ROLE,
  PROJECT_STATUS,
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_CREATION_POLICY,
  TASK_TRACKER,
} from "@/configs/entities/project.config.ts"
import { PART_TIME_AVAILABILITY_STATUS } from "@/configs/entities/part-time-availability.config.ts"
import { prisma } from "@/libs/database.ts"
import { ensureCapacityDemoTester } from "@/scripts/capacity-demo-employee.util.ts"
import { getSeedPassword } from "@/scripts/seeders/seed-password.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

const DEMO_PROJECT_NAME = "AI Capacity Copilot Demo"
const DEMO_DEAL_TARGET_PERCENT = 50
const DEMO_FORECAST_WEEK_START = new Date("2026-07-27T00:00:00.000Z")
const DEMO_PREVIOUS_WEEK_START = new Date("2026-07-20T00:00:00.000Z")
const DEMO_PREVIOUS_WEEK_END = new Date("2026-07-26T00:00:00.000Z")
const DEMO_PROJECT_END = new Date("2026-08-31T00:00:00.000Z")
const WORKDAY_START_MINUTES = 8 * 60
const WORKDAY_END_MINUTES = 17 * 60
const MINIMUM_DEMO_EMPLOYEES = 3
const DEMO_DONE_STATUS_NAME = "Done"
const DEMO_WORK_DAYS = [1, 2, 3, 4, 5] as const

const roleSeeds = [
  { code: PROJECT_ROLE.DEVELOPER, name: "Lập trình viên" },
  { code: PROJECT_ROLE.TESTER, name: "Kiểm thử viên" },
  { code: PROJECT_ROLE.LEADER, name: "Trưởng nhóm" },
] as const

const taskStatusSeeds = [
  { name: "To Do", order: 0, isDefault: true, isCompleted: false },
  { name: "In Progress", order: 1, isDefault: false, isCompleted: false },
  { name: DEMO_DONE_STATUS_NAME, order: 2, isDefault: false, isCompleted: true },
] as const

async function pickEmployees(demoTesterId: string) {
  const employees = await prisma.employee.findMany({
    where: { status: "active", deletedAt: null },
    orderBy: { createdAt: "asc" },
  })

  if (employees.length < MINIMUM_DEMO_EMPLOYEES) {
    throw new Error(
      `Cần ít nhất ${MINIMUM_DEMO_EMPLOYEES} nhân viên active để seed demo Capacity Copilot.`,
    )
  }

  const partTimeEmployees = employees.filter((employee) => employee.workScheduleType === "part_time")
  const fullTimeEmployees = employees.filter((employee) => employee.workScheduleType !== "part_time")

  return {
    admin: employees.find((employee) => employee.username === "admin") ?? employees[0],
    developer:
      fullTimeEmployees.find((employee) => employee.position === "Developer") ??
      fullTimeEmployees[0] ??
      employees[1],
    tester:
      partTimeEmployees.find((employee) => employee.id === demoTesterId) ??
      partTimeEmployees.find((employee) => employee.position === "Tester") ??
      partTimeEmployees[0] ??
      employees[2],
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function main() {
  const passwordHash = await HashUtil.hash(getSeedPassword("SEED_EMPLOYEE_PASSWORD"))
  const demoTester = await ensureCapacityDemoTester(prisma, passwordHash)
  const people = await pickEmployees(demoTester.id)

  await prisma.project.deleteMany({ where: { name: DEMO_PROJECT_NAME } })

  const project = await prisma.project.create({
    data: {
      name: DEMO_PROJECT_NAME,
      description: "Demo project đầy đủ dữ kiện cho Part-time Capacity Copilot.",
      techStack: ["React", "Node.js", "PostgreSQL"],
      status: PROJECT_STATUS.ACTIVE,
      taskCreationPolicy: TASK_CREATION_POLICY.ALL_MEMBERS,
      startDate: addDays(DEMO_PREVIOUS_WEEK_START, -21),
      expectedEndDate: DEMO_PROJECT_END,
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
  const doneStatus = statuses.find((status) => status.name === DEMO_DONE_STATUS_NAME)

  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        employeeId: people.admin.id,
        roleId: roleByCode.get(PROJECT_ROLE.LEADER)?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
      },
      {
        projectId: project.id,
        employeeId: people.developer.id,
        roleId: roleByCode.get(PROJECT_ROLE.DEVELOPER)?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        hourlyRate: 50000,
      },
      {
        projectId: project.id,
        employeeId: people.tester.id,
        roleId: roleByCode.get(PROJECT_ROLE.TESTER)?.id,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        hourlyRate: 50000,
      },
    ],
    skipDuplicates: true,
  })

  const historyWeeks = [
    {
      start: addDays(DEMO_PREVIOUS_WEEK_START, -14),
      completedAt: addDays(DEMO_PREVIOUS_WEEK_START, -10),
      title: "Hoàn thành module nhập lịch rảnh",
    },
    {
      start: addDays(DEMO_PREVIOUS_WEEK_START, -7),
      completedAt: addDays(DEMO_PREVIOUS_WEEK_START, -3),
      title: "Hoàn thành dashboard capacity",
    },
    {
      start: DEMO_PREVIOUS_WEEK_START,
      completedAt: addDays(DEMO_PREVIOUS_WEEK_START, 3),
      title: "Hoàn thành rule cảnh báo thiếu capacity",
    },
  ]

  const doneTasks = await Promise.all(
    historyWeeks.flatMap((week, index) => [
      prisma.task.create({
        data: {
          projectId: project.id,
          title: `${week.title} - backend ${index + 1}`,
          tracker: TASK_TRACKER.FEATURE,
          priority: TASK_PRIORITY.HIGH,
          status: TASK_STATUS.DONE,
          statusId: doneStatus?.id,
          assigneeId: people.developer.id,
          createdById: people.admin.id,
          startDate: week.start,
          dueDate: addDays(week.start, 6),
          completedAt: week.completedAt,
          estimatedTime: 12,
          progress: 100,
        },
      }),
      prisma.task.create({
        data: {
          projectId: project.id,
          title: `${week.title} - testing ${index + 1}`,
          tracker: TASK_TRACKER.TEST,
          priority: TASK_PRIORITY.MEDIUM,
          status: TASK_STATUS.DONE,
          statusId: doneStatus?.id,
          assigneeId: people.tester.id,
          createdById: people.admin.id,
          startDate: week.start,
          dueDate: addDays(week.start, 6),
          completedAt: addDays(week.completedAt, 1),
          estimatedTime: 8,
          progress: 100,
        },
      }),
    ]),
  )

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
      dueDate: addDays(DEMO_FORECAST_WEEK_START, 6),
      estimatedTime: 30,
      progress: 30,
    },
  })

  await prisma.spentTime.createMany({
    data: doneTasks.map((task, index) => {
      const isDeveloperTask = index % 2 === 0
      return {
        taskId: task.id,
        employeeId: isDeveloperTask ? people.developer.id : people.tester.id,
        date: addDays(addDays(DEMO_PREVIOUS_WEEK_START, -14), index * 3),
        hours: isDeveloperTask ? 12 : 8,
        comment: "Demo history: approved spent time for Capacity Copilot.",
        activity: isDeveloperTask ? SPENT_TIME_ACTIVITY.DEVELOP : SPENT_TIME_ACTIVITY.TEST,
        workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
        status: SPENT_TIME_STATUS.APPROVED,
        approvedById: people.admin.id,
        approvedAt: addDays(DEMO_PREVIOUS_WEEK_START, 4),
      }
    }),
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
        create: DEMO_WORK_DAYS.map((dayOfWeek) => ({
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
  console.log("Forecast week: 27/07/2026 - 02/08/2026")
  console.log("History: 3 previous weeks with approved spent time and done tasks.")
  console.log("Demo tip: increase Deal target % to 80-100 to show shortage, lower it to 10-20 to show surplus.")
}

await main()
await prisma.$disconnect()
