import {
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
} from "@/configs/entities/project.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class SpentTimesSeeder implements ISeeder {
  readonly name = "SpentTimes"
  readonly order = 18

  async run(_context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding spent time approval samples...")

    const teamLeader = await prisma.employee.findFirst({ where: { username: "team_leader" } })
    const pendingLogs = await prisma.spentTime.findMany({
      where: { status: SPENT_TIME_STATUS.PENDING },
      take: 3,
      orderBy: { createdAt: "asc" },
    })

    if (teamLeader && pendingLogs.length > 0) {
      // One pre-approved row so payroll demo has both pending and approved states.
      await prisma.spentTime.update({
        where: { id: pendingLogs[0].id },
        data: {
          status: SPENT_TIME_STATUS.APPROVED,
          approvedById: teamLeader.id,
          approvedAt: new Date(),
        },
      })
      console.log("  Marked 1 spent time log as approved for demo.")
    }

    const partTimeUser = await prisma.employee.findFirst({ where: { username: "part_time" } })
    if (!partTimeUser) {
      console.log("  Skipped extra PT spent times — part_time account missing.")
      return {}
    }

    const membership = await prisma.projectMember.findFirst({
      where: { employeeId: partTimeUser.id, removedAt: null },
      include: {
        project: {
          include: {
            tasks: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
      },
    })

    const task = membership?.project.tasks[0]
    if (!task) {
      console.log("  Skipped extra PT spent times — no task found.")
      return {}
    }

    await prisma.spentTime.createMany({
      data: [
        {
          taskId: task.id,
          employeeId: partTimeUser.id,
          date: new Date(),
          hours: 4,
          comment: "PT remote — chờ duyệt",
          activity: SPENT_TIME_ACTIVITY.DEVELOP,
          workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
          status: SPENT_TIME_STATUS.PENDING,
        },
        {
          taskId: task.id,
          employeeId: partTimeUser.id,
          date: new Date(Date.now() - 86400000),
          hours: 2,
          comment: "PT remote — đã duyệt",
          activity: SPENT_TIME_ACTIVITY.DEVELOP,
          workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
          status: SPENT_TIME_STATUS.APPROVED,
          approvedById: teamLeader?.id ?? null,
          approvedAt: teamLeader ? new Date() : null,
        },
      ],
      skipDuplicates: true,
    })

    console.log("  Seeded part-time spent time samples (pending + approved).")
    return {}
  }
}

registry.register(new SpentTimesSeeder())

if (import.meta.main) {
  const seeder = new SpentTimesSeeder()
  await seeder.run(createEmptyContext())
  await prisma.$disconnect()
}
