import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Clock, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

import { PageCard, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE } from "@/config/entities/employee.config"
import {
  SPENT_TIME_STATUS,
  SPENT_TIME_STATUSES,
  getSpentTimeStatusLabel,
} from "@/config/entities/project.config"
import { taskApi } from "@/lib/api/task.api"
import { extractErrorMessage } from "@/utils/error-helper"
import type { SpentTime, SpentTimeStatus } from "@/types/spent-time.types"

type StatusFilter = SpentTimeStatus | "all"

interface ProjectSpentTimeTabProps {
  projectId: string
  spentTimes: SpentTime[] | undefined
  isLoading: boolean
  userRole?: string
  isLeader: boolean
}

/**
 * Project-level Spent Time queue for leads — approve/reject without opening each task.
 * Complements per-task approval in TaskDetail.
 */
export function ProjectSpentTimeTab({
  projectId,
  spentTimes,
  isLoading,
  userRole,
  isLeader,
}: ProjectSpentTimeTabProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const canApprove =
    isLeader || userRole === ROLE.ADMIN || userRole === ROLE.GENERAL_MANAGER

  const filteredLogs = useMemo(() => {
    const list = spentTimes ?? []
    if (statusFilter === "all") return list
    return list.filter((st) => st.status === statusFilter)
  }, [spentTimes, statusFilter])

  const pendingIds = useMemo(
    () => (spentTimes ?? []).filter((st) => st.status === SPENT_TIME_STATUS.PENDING).map((st) => st.id),
    [spentTimes],
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["spentTimes", "project", projectId] })
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => taskApi.approveSpentTime(id),
    onSuccess: () => {
      invalidate()
      toast.success("Đã duyệt giờ làm việc")
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      taskApi.rejectSpentTime(id, reason),
    onSuccess: () => {
      invalidate()
      toast.success("Đã từ chối giờ làm việc")
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => taskApi.approveSpentTime(id)))
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã duyệt tất cả giờ chờ duyệt")
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const statusVariant = (status: SpentTimeStatus) => {
    if (status === SPENT_TIME_STATUS.APPROVED) return "success"
    if (status === SPENT_TIME_STATUS.REJECTED) return "danger"
    return "warning"
  }

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    ...SPENT_TIME_STATUSES.map((s) => ({
      value: s,
      label: getSpentTimeStatusLabel(s),
    })),
  ]

  return (
    <PageCard className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
          <Clock className="size-4 text-muted-foreground" />
          Duyệt giờ làm việc (Spent Time)
        </h3>

        {canApprove && pendingIds.length > 0 && (
          <Button
            size="sm"
            className="rounded-full h-9"
            disabled={bulkApproveMutation.isPending}
            onClick={() => {
              bulkApproveMutation.mutate(pendingIds)
            }}
          >
            Duyệt tất cả ({pendingIds.length})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={statusFilter === opt.value ? "default" : "outline"}
            className="rounded-full h-8 text-xs"
            onClick={() => {
              setStatusFilter(opt.value)
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          Không có bản ghi giờ làm việc nào.
        </p>
      ) : (
        <div className="relative overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className="font-semibold text-xs">Nhân viên</TableHead>
                <TableHead className="font-semibold text-xs">Công việc</TableHead>
                <TableHead className="font-semibold text-xs">Ngày</TableHead>
                <TableHead className="font-semibold text-xs text-center">Giờ</TableHead>
                <TableHead className="font-semibold text-xs">Trạng thái</TableHead>
                {canApprove && (
                  <TableHead className="font-semibold text-xs text-right">Thao tác</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((st) => {
                const isPending = st.status === SPENT_TIME_STATUS.PENDING
                return (
                  <TableRow key={st.id} className="h-12 hover:bg-muted/30">
                    <TableCell className="text-xs font-semibold">
                      {st.employee?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      <Link
                        to={`/project/tasks/${st.taskId}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {st.task?.title ?? st.taskId}
                        <ExternalLink className="size-3 shrink-0" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(st.date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-xs text-center font-bold">{st.hours}</TableCell>
                    <TableCell>
                      <StatusPill
                        variant={statusVariant(st.status)}
                        label={getSpentTimeStatusLabel(st.status)}
                        className="text-[9px] px-2 py-0"
                      />
                    </TableCell>
                    {canApprove && (
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary hover:bg-primary/10 rounded-full size-7"
                              title="Duyệt"
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                approveMutation.mutate(st.id)
                              }}
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:bg-destructive/10 rounded-full size-7"
                              title="Từ chối"
                              disabled={rejectMutation.isPending}
                              onClick={() => {
                                const reason = window.prompt("Lý do từ chối:")
                                if (reason?.trim()) {
                                  rejectMutation.mutate({ id: st.id, reason: reason.trim() })
                                }
                              }}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageCard>
  )
}
