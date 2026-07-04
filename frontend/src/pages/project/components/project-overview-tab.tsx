import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Clock, Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TASK_TRACKERS, getProjectMemberWorkModeLabel } from "@/config/entities/project.config"
import type { Project, ProjectMember } from "@/types/project.types"

interface ProjectOverviewTabProps {
  project: Project
  totalTasksCount: number
  openTasksCount: number
  closedTasksCount: number
  trackerStats: Map<string, { open: number; closed: number; total: number }>
  totalEstimatedHours: number
  totalSpentHours: number
  members: ProjectMember[]
  canManageMembers: boolean
  onRemoveMember: (employeeId: string) => void
  onEditMember?: (member: ProjectMember) => void
}

export function ProjectOverviewTab({
  project,
  totalTasksCount,
  openTasksCount,
  closedTasksCount,
  trackerStats,
  totalEstimatedHours,
  totalSpentHours,
  members,
  canManageMembers,
  onRemoveMember,
  onEditMember,
}: ProjectOverviewTabProps) {
  return (
    <div className="grid grid-cols-12 gap-6 outline-none">
      {/* Issue Tracking statistics panel */}
      <div className="col-span-12 xl:col-span-7 space-y-6">
        <PageCard className="p-6">
          <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
            Thống kê công việc (Issue Tracking)
          </h3>
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent h-10">
                  <TableHead className="font-semibold text-xs">Loại Tracker</TableHead>
                  <TableHead className="font-semibold text-xs text-center w-24">
                    Đang mở (Open)
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-center w-24">
                    Đã đóng (Closed)
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right w-24">Tổng cộng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Render status totals for each task tracker type */}
                {TASK_TRACKERS.map((tr) => {
                  const stat = trackerStats.get(tr) || { open: 0, closed: 0, total: 0 }
                  if (stat.total === 0) return null // Skip showing trackers that contain no tasks
                  return (
                    <TableRow key={tr} className="h-12 hover:bg-muted/30">
                      <TableCell className="font-bold text-xs uppercase text-muted-foreground">
                        {tr}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-blue-600 dark:text-blue-400">
                        {stat.open}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {stat.closed}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        {stat.total}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Show empty placeholder text if no tasks are present in project */}
                {totalTasksCount === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                      Chưa có công việc nào được tạo.
                    </TableCell>
                  </TableRow>
                )}
                {/* Render total summary row representing all tasks */}
                {totalTasksCount > 0 && (
                  <TableRow className="bg-muted/20 font-bold">
                    <TableCell className="font-bold text-xs">Tổng hợp</TableCell>
                    <TableCell className="text-center text-xs text-blue-600 dark:text-blue-400">
                      {openTasksCount}
                    </TableCell>
                    <TableCell className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                      {closedTasksCount}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {totalTasksCount}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </PageCard>

        {/* Spent Time tracking metrics summary card */}
        <PageCard className="p-6">
          <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" />
            Thời gian hoạt động (Spent Time)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold">Ước tính (Estimated)</span>
              <span className="text-2xl font-black mt-1 text-foreground">
                {totalEstimatedHours.toFixed(1)} <span className="text-xs font-normal">giờ</span>
              </span>
            </div>
            <div className="rounded-xl border border-border p-4 bg-primary/5 flex flex-col justify-center">
              <span className="text-xs text-primary font-semibold">Thực tế đã dùng (Spent)</span>
              <span className="text-2xl font-black mt-1 text-primary">
                {totalSpentHours.toFixed(1)} <span className="text-xs font-normal">giờ</span>
              </span>
            </div>
          </div>
        </PageCard>
      </div>

      {/* Members and team assignment list panel */}
      <div className="col-span-12 xl:col-span-5 space-y-6">
        <PageCard className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              Thành viên ({members.length})
            </h3>
          </div>
          <div className="space-y-4">
            {/* Team Leader details block */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Trưởng dự án (Leader)
              </span>
              {project.teamLeader ? (
                <div className="flex items-center justify-between mt-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/50">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {project.teamLeader.fullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {project.teamLeader.email}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1">Chưa có Trưởng nhóm</p>
              )}
            </div>

            {/* Team Members scroll area mapping */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                Thành viên tham gia
              </span>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 border border-transparent transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {member.employee?.fullName || "Chưa rõ"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {member.employee?.email || ""}{member.role?.name ? ` · ${member.role.name}` : ""}
                        </div>
                        {(member.hourlyRate != null || member.workMode) && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {/* PT: rate × approved hours = payroll; workMode drives GPS rules */}
                            {member.hourlyRate != null
                              ? `${member.hourlyRate.toLocaleString("vi-VN")} đ/giờ`
                              : null}
                            {member.hourlyRate != null && member.workMode ? " · " : null}
                            {member.workMode ? getProjectMemberWorkModeLabel(member.workMode) : null}
                          </div>
                        )}
                      </div>

                      {/* Edit / remove actions for project team managers */}
                      {canManageMembers && (
                        <div className="flex items-center gap-1">
                          {onEditMember && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary hover:bg-primary/10 rounded-full cursor-pointer text-xs h-7 px-3"
                              onClick={() => {
                                onEditMember(member)
                              }}
                            >
                              Sửa
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer text-xs h-7 px-3"
                            onClick={() => {
                              onRemoveMember(member.employeeId)
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa có thành viên nào.</p>
                )}
              </div>
            </div>
          </div>
        </PageCard>
      </div>
    </div>
  )
}
