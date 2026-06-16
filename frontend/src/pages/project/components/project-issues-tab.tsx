import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { AlertCircle, MoreVertical, Search } from "lucide-react"
import { toast } from "sonner"

import { PageCard, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { taskApi } from "@/lib/api/task.api"
import { extractErrorMessage } from "@/utils/error-helper"
import {
  TASK_TRACKERS,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "@/config/entities/project.config"
import type { TaskTracker, TaskPriority, TaskStatus } from "@/types/task.types"
import type { ProjectMember } from "@/types/project.types"

interface ProjectIssuesTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role: string
    fullName: string
  } | null
}

const ALL_FILTER_VALUE = "all"

export function ProjectIssuesTab({
  projectId,
  members,
  teamLeader,
  user,
}: ProjectIssuesTabProps) {
  const queryClient = useQueryClient()


  // Filter & Pagination States
  const [issueSearch, setIssueSearch] = useState("")
  const [trackerFilter, setTrackerFilter] = useState<string>(ALL_FILTER_VALUE)
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE)
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL_FILTER_VALUE)
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL_FILTER_VALUE)
  const [createdByIdFilter, setCreatedByIdFilter] = useState<string>(ALL_FILTER_VALUE)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Reset page number back to 1 when filters are updated
  useEffect(() => {
    setCurrentPage(1)
  }, [
    issueSearch,
    trackerFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
  ])

  // Fetch paginated, filtered tasks list
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: [
      "tasks",
      "project",
      projectId,
      currentPage,
      pageSize,
      issueSearch,
      trackerFilter,
      statusFilter,
      priorityFilter,
      assigneeFilter,
      createdByIdFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      taskApi.list({
        projectId,
        page: currentPage,
        limit: pageSize,
        search: issueSearch || undefined,
        tracker: trackerFilter === ALL_FILTER_VALUE ? undefined : (trackerFilter as TaskTracker),
        status: statusFilter === ALL_FILTER_VALUE ? undefined : (statusFilter as TaskStatus),
        priority: priorityFilter === ALL_FILTER_VALUE ? undefined : (priorityFilter as TaskPriority),
        assigneeId: assigneeFilter === ALL_FILTER_VALUE ? undefined : assigneeFilter,
        createdById: createdByIdFilter === ALL_FILTER_VALUE ? undefined : createdByIdFilter,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      }),
    enabled: !!projectId,
  })

  // Quick Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return taskApi.update(taskId, { status: status as TaskStatus })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks", "overview", projectId] })
      toast.success("Cập nhật trạng thái công việc thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const tasks = tasksData?.data || []
  const totalItems = tasksData?.meta.total || 0
  const totalPages = tasksData?.meta.totalPages || 1
  const startRange = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRange = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    return pages
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "todo":
        return "Đang mở"
      case "in_progress":
        return "Đang làm"
      case "in_review":
        return "Đánh giá"
      case "done":
        return "Hoàn thành"
      case "cancelled":
        return "Đã hủy"
      case "reopened":
        return "Mở lại"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "done":
        return "success"
      case "in_progress":
        return "warning"
      case "in_review":
        return "info"
      case "cancelled":
        return "danger"
      case "reopened":
        return "info"
      default:
        return "neutral"
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main Issues list table container */}
      <div className="col-span-12 lg:col-span-9 space-y-4">
        {/* Filters Toolbar */}
        <PageCard className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm công việc..."
              value={issueSearch}
              onChange={(e) => { setIssueSearch(e.target.value); }}
              className="pl-11 h-9 text-xs border-border rounded-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tracker Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tracker:
              </Label>
              <Select value={trackerFilter} onValueChange={setTrackerFilter}>
                <SelectTrigger className="w-24 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {TASK_TRACKERS.map((tr) => (
                    <SelectItem key={tr} value={tr}>{tr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái:
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {TASK_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>{formatStatus(st)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Độ ưu tiên:
              </Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {TASK_PRIORITIES.map((pr) => (
                    <SelectItem key={pr} value={pr}>{pr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Người thực hiện:
              </Label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-popover">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {teamLeader && (
                    <SelectItem value={teamLeader.id}>
                      {teamLeader.fullName} (TL)
                    </SelectItem>
                  )}
                  {members?.map((m) => (
                    <SelectItem key={m.employeeId} value={m.employeeId}>
                      {m.employee?.fullName || "Chưa rõ"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PageCard>

        {/* Issues table card */}
        <PageCard className="p-6">
          {isLoadingTasks ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-secondary p-3 mb-4 text-muted-foreground">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Không tìm thấy công việc nào</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hãy thiết lập bộ lọc khác hoặc tạo công việc mới.
              </p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent h-10">
                      <TableHead className="w-16 font-semibold text-xs">ID</TableHead>
                      <TableHead className="w-24 font-semibold text-xs">Tracker</TableHead>
                      <TableHead className="font-semibold text-xs">Tiêu đề</TableHead>
                      <TableHead className="w-28 font-semibold text-xs">Người thực hiện</TableHead>
                      <TableHead className="w-28 font-semibold text-xs">Trạng thái</TableHead>
                      <TableHead className="w-24 font-semibold text-xs">Độ ưu tiên</TableHead>
                      <TableHead className="w-16 text-right font-semibold text-xs">%</TableHead>
                      <TableHead className="w-10 font-semibold text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      let priorityColor = "bg-secondary text-secondary-foreground"
                      if (task.priority === "urgent") {
                        priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
                      } else if (task.priority === "high") {
                        priorityColor =
                          "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
                      } else if (task.priority === "medium") {
                        priorityColor =
                          "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                      }

                      let trackerColor = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      if (task.tracker === "bug") {
                        trackerColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      } else if (task.tracker === "feature") {
                        trackerColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      } else if (task.tracker === "support") {
                        trackerColor = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                      }

                      return (
                        <TableRow key={task.id} className="h-14 hover:bg-muted/30">
                          <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">
                            #{task.id.substring(0, 5)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${trackerColor}`}
                            >
                              {task.tracker}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            <Link
                              to={`/project/tasks/${task.id}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {task.title}
                            </Link>
                          </TableCell>

                          <TableCell className="text-xs">
                            {task.assignee ? (
                              <span className="font-semibold text-foreground">
                                {task.assignee.fullName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Không chỉ định</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusPill
                              label={formatStatus(task.status)}
                              variant={getStatusVariant(task.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-full text-[9px] ${priorityColor}`}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            {task.progress}%
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs" className="rounded-full cursor-pointer">
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                                <DropdownMenuItem
                                  asChild
                                  className="rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <Link to={`/project/tasks/${task.id}`}>Xem chi tiết</Link>
                                </DropdownMenuItem>
                                {TASK_STATUSES.map((st) => (
                                  <DropdownMenuItem
                                    key={st}
                                    className="rounded-lg text-xs font-medium cursor-pointer"
                                    onClick={() => {
                                      updateStatusMutation.mutate({ taskId: task.id, status: st })
                                    }}
                                  >
                                    Đổi thành: {formatStatus(st)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-semibold">
                  Hiện tổng: {startRange}-{endRange}/{totalItems}
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-full p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                    >
                      «
                    </Button>
                    {getPageNumbers().map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="text-xs text-muted-foreground font-semibold px-2"
                          >
                            ...
                          </span>
                        )
                      }
                      const pageNum = p as number
                      const isCurrent = pageNum === currentPage
                      return (
                        <Button
                          key={`page-${pageNum}`}
                          variant={isCurrent ? "default" : "ghost"}
                          size="icon"
                          onClick={() => {
                            setCurrentPage(pageNum)
                          }}
                          className={`rounded-full size-7 p-0 text-xs font-bold ${
                            isCurrent
                              ? "bg-primary text-primary-foreground hover:bg-primary/95"
                              : "hover:bg-background"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                    >
                      »
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Mỗi trang:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-16 h-8 border-border rounded-full text-xs font-bold bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover">
                      {["10", "25", "50", "100"].map((size) => (
                        <SelectItem key={size} value={size} className="rounded-lg text-xs font-semibold">
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </PageCard>
      </div>

      {/* Sidebar Queries filters section */}
      <div className="col-span-12 lg:col-span-3">
        <PageCard className="p-4 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            Truy vấn nhanh
          </h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setAssigneeFilter(user?.id || ALL_FILTER_VALUE)
                setCreatedByIdFilter(ALL_FILTER_VALUE)
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                assigneeFilter === user?.id && createdByIdFilter === ALL_FILTER_VALUE
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Phân công cho tôi
            </button>
            <button
              onClick={() => {
                setCreatedByIdFilter(user?.id || ALL_FILTER_VALUE)
                setAssigneeFilter(ALL_FILTER_VALUE)
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                createdByIdFilter === user?.id && assigneeFilter === ALL_FILTER_VALUE
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Do tôi tạo
            </button>
            <button
              onClick={() => {
                setSortBy("updatedAt")
                setSortOrder("desc")
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                sortBy === "updatedAt" && sortOrder === "desc"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Cập nhật gần đây
            </button>
            <button
              onClick={() => {
                setAssigneeFilter(ALL_FILTER_VALUE)
                setCreatedByIdFilter(ALL_FILTER_VALUE)
                setTrackerFilter(ALL_FILTER_VALUE)
                setStatusFilter(ALL_FILTER_VALUE)
                setPriorityFilter(ALL_FILTER_VALUE)
                setIssueSearch("")
                setSortBy("createdAt")
                setSortOrder("desc")
              }}
              className="text-left text-xs font-semibold px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-dashed border-border mt-2 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        </PageCard>
      </div>
    </div>
  )
}
