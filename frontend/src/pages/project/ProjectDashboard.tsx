import { PageCard, PageHeader, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ClipboardList, ExternalLink, Inbox, Folder, User, Plus, Clock, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import LogTimeModal from "@/components/features/project/LogTimeModal"

export default function ProjectDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    task: any | null
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    task: null,
  })

  // Log Time State
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeTask, setLogTimeTask] = useState<{ id: string; title: string } | null>(null)

  // Pagination states
  const [assignedPage, setAssignedPage] = useState(1)
  const [reportedPage, setReportedPage] = useState(1)
  const tasksLimit = 10

  // 1. Fetch tasks assigned to the current employee
  const { data: assignedTasksData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["tasks", "assigned", user?.id, assignedPage],
    queryFn: () => taskApi.list({ assigneeId: user?.id, page: assignedPage, limit: tasksLimit }),
    enabled: !!user?.id,
  })

  // 2. Fetch tasks created by the current employee
  const { data: reportedTasksData, isLoading: isLoadingReported } = useQuery({
    queryKey: ["tasks", "reported", user?.id, reportedPage],
    queryFn: () => taskApi.list({ createdById: user?.id, page: reportedPage, limit: tasksLimit }),
    enabled: !!user?.id,
  })

  // 3. Fetch projects that current employee is involved in
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "dashboard", user?.id],
    queryFn: () => projectApi.list({ limit: 100 }),
    enabled: !!user?.id,
  })

  // 4. Fetch project members dynamically for context menu assignee select
  const { data: activeProjectMembers } = useQuery({
    queryKey: ["members", contextMenu.task?.projectId],
    queryFn: () => projectApi.getMembers(contextMenu.task?.projectId || ""),
    enabled: !!contextMenu.task?.projectId,
  })

  const assignedTasks = assignedTasksData?.data || []
  const reportedTasks = reportedTasksData?.data || []
  const projects = projectsData?.data || []

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const menu = document.getElementById("dashboard-context-menu")
      if (menu && !menu.contains(e.target as Node)) {
        setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
      }
    }
    if (contextMenu.isOpen) {
      document.addEventListener("click", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick)
    }
  }, [contextMenu.isOpen])

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; data: any }) => {
      return taskApi.update(payload.taskId, payload.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Issue updated successfully")
      setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || err.message || "Failed to update issue")
    },
  })

  const handleUpdateTask = (data: any) => {
    if (!contextMenu.task) return
    updateTaskMutation.mutate({ taskId: contextMenu.task.id, data })
  }

  const handleRowContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault()
    let x = e.clientX
    let y = e.clientY
    const menuHeight = 300
    const menuWidth = 160

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    setContextMenu({
      isOpen: true,
      x,
      y,
      task,
    })
  }

  const formatProjectStatus = (status: string) => {
    if (status === "planning") return "Lập kế hoạch"
    if (status === "active") return "Đang chạy"
    if (status === "on_hold") return "Tạm dừng"
    if (status === "completed") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    return status
  }

  const getProjectStatusVariant = (status: string) => {
    if (status === "active") return "success"
    if (status === "planning") return "neutral"
    if (status === "on_hold") return "warning"
    if (status === "completed") return "info"
    if (status === "cancelled") return "danger"
    return "neutral"
  }

  const renderTaskTable = (tasks: typeof assignedTasks, emptyMessage: string) => {
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="relative overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent h-12">
              <TableHead className="w-16 font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Dự án</TableHead>
              <TableHead className="w-24 font-semibold">Tracker</TableHead>
              <TableHead className="font-semibold">Tiêu đề</TableHead>
              <TableHead className="w-24 font-semibold">Trạng thái</TableHead>
              <TableHead className="w-24 font-semibold">Độ ưu tiên</TableHead>
              <TableHead className="w-16 text-right font-semibold">%</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              // Priority styling
              let priorityColor = "bg-secondary text-secondary-foreground"
              if (task.priority === "urgent") priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
              else if (task.priority === "high") priorityColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
              else if (task.priority === "medium") priorityColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"

              // Tracker badge
              let trackerColor = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              if (task.tracker === "bug") trackerColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              else if (task.tracker === "feature") trackerColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              else if (task.tracker === "support") trackerColor = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"

              const isMenuOpenForTask = contextMenu.isOpen && contextMenu.task?.id === task.id

              return (
                <TableRow
                  key={task.id}
                  onContextMenu={(e) => handleRowContextMenu(e, task)}
                  className={`h-14 hover:bg-muted/50 transition-colors cursor-default ${
                    isMenuOpenForTask ? "bg-blue-600/15 hover:bg-blue-600/20 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    #{task.id.substring(0, 5)}
                  </TableCell>
                  <TableCell className="font-medium max-w-[120px] truncate">
                    {task.project?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${trackerColor}`}>
                      {task.tracker}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <Link
                      to={`/project/tasks/${task.id}`}
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
                    >
                      {task.title}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      label={
                        task.status === "todo"
                          ? "Mới"
                          : task.status === "in_progress"
                            ? "Đang làm"
                            : task.status === "in_review"
                              ? "Đánh giá"
                              : task.status === "done"
                                ? "Hoàn thành"
                                : "Đã hủy"
                      }
                      variant={
                        task.status === "done"
                          ? "success"
                          : task.status === "in_progress"
                            ? "warning"
                            : task.status === "in_review"
                              ? "info"
                              : task.status === "cancelled"
                                ? "danger"
                                : "neutral"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full text-[10px] ${priorityColor}`}>
                      {task.priority === "urgent"
                        ? "Khẩn cấp"
                        : task.priority === "high"
                          ? "Cao"
                          : task.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs">
                    {task.progress}%
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setContextMenu({
                          isOpen: true,
                          x: rect.left - 120,
                          y: rect.bottom + 5,
                          task,
                        })
                      }}
                      className="text-muted-foreground hover:text-foreground font-black text-sm p-1 rounded hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      •••
                    </button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsOnPage: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) return null

    return (
      <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border mt-4">
        <div>
          Hiển thị{" "}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * tasksLimit + (itemsOnPage ? 1 : 0)}
          </span>{" "}
          đến{" "}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * tasksLimit + itemsOnPage}
          </span>{" "}
          trong tổng số{" "}
          <span className="font-medium text-foreground">{totalItems}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-full text-[11px] font-semibold"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              if (p < currentPage - 2 || p > currentPage + 2) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[11px] font-semibold border ${
                    currentPage === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted text-muted-foreground border-border bg-background"
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-full text-[11px] font-semibold"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container p-8 space-y-6">
      <PageHeader
        title="Tổng quan của tôi (My Page)"
        description="Quản lý các dự án và công việc được phân công cho bạn"
      />

      {/* 1. Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Folder className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              Dự án của tôi ({projects.length})
            </h3>
            <p className="text-xs text-muted-foreground">Các dự án bạn tham gia hoặc quản lý</p>
          </div>
        </div>

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border">
            <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
              <Folder className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">Bạn chưa được tham gia vào dự án nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const isLeader = proj.teamLeaderId === user?.id
              const isAdminOrGM = user?.role === "admin" || user?.role === "general_manager"
              const canCreateInProj = isAdminOrGM || isLeader || proj.taskCreationPolicy === "all_members"

              let memberRole = "Thành viên"
              let roleBadgeColor = "bg-secondary text-secondary-foreground"
              if (isLeader) {
                memberRole = "Trưởng nhóm"
                roleBadgeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400"
              } else if (isAdminOrGM) {
                memberRole = "Quản trị viên"
                roleBadgeColor = "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
              }

              return (
                <PageCard
                  key={proj.id}
                  className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-border/85 flex flex-col justify-between p-5 min-h-[140px] space-y-4 hover:border-border/100"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/project/${proj.id}`}
                        className="font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {proj.name}
                      </Link>
                      <StatusPill
                        label={formatProjectStatus(proj.status)}
                        variant={getProjectStatusVariant(proj.status)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {proj.description || "Không có mô tả dự án."}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <User className="size-3.5" />
                      Trưởng nhóm: <span className="font-semibold text-foreground">{proj.teamLeader?.fullName || "Chưa có"}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {canCreateInProj && (
                        <Link
                          to={`/project/${proj.id}?createTask=true`}
                          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 font-bold text-[10px] flex items-center gap-1 transition-all duration-200 cursor-pointer"
                        >
                          <Plus className="size-3" />
                          Tạo CV
                        </Link>
                      )}
                      <Badge variant="outline" className={`rounded-full text-[9px] font-black px-2 py-0.5 ${roleBadgeColor}`}>
                        {memberRole}
                      </Badge>
                    </div>
                  </div>
                </PageCard>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Tasks Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Assigned Tasks */}
        <div className="col-span-12 xl:col-span-6 space-y-4">
          <PageCard className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Công việc được giao cho tôi ({assignedTasksData?.meta.total || 0})
                </h3>
                <p className="text-xs text-muted-foreground">Các nhiệm vụ bạn cần thực hiện</p>
              </div>
            </div>

            {isLoadingAssigned
              ? renderSkeleton()
              : (
                  <>
                    {renderTaskTable(assignedTasks, "Không có công việc nào được giao cho bạn.")}
                    {renderPagination(
                      assignedPage,
                      assignedTasksData?.meta.totalPages || 0,
                      assignedTasksData?.meta.total || 0,
                      assignedTasks.length,
                      setAssignedPage
                    )}
                  </>
                )}
          </PageCard>
        </div>

        {/* Right Column - Reported Tasks */}
        <div className="col-span-12 xl:col-span-6 space-y-4">
          <PageCard className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Công việc tôi đã tạo / báo cáo ({reportedTasksData?.meta.total || 0})
                </h3>
                <p className="text-xs text-muted-foreground">Các nhiệm vụ do bạn báo cáo hoặc tạo ra</p>
              </div>
            </div>

            {isLoadingReported
              ? renderSkeleton()
              : (
                  <>
                    {renderTaskTable(reportedTasks, "Bạn chưa tạo hoặc báo cáo công việc nào.")}
                    {renderPagination(
                      reportedPage,
                      reportedTasksData?.meta.totalPages || 0,
                      reportedTasksData?.meta.total || 0,
                      reportedTasks.length,
                      setReportedPage
                    )}
                  </>
                )}
          </PageCard>
        </div>
      </div>

      {/* Floating Context Menu */}
      {contextMenu.isOpen && contextMenu.task && (
        <div
          id="dashboard-context-menu"
          className="fixed z-50 min-w-[160px] bg-background border border-border rounded-lg shadow-lg p-1.5 flex flex-col select-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {/* Edit / View details */}
          <Link
            to={`/project/tasks/${contextMenu.task.id}`}
            onClick={() => setContextMenu({ isOpen: false, x: 0, y: 0, task: null })}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground hover:no-underline"
          >
            <User size={12} className="shrink-0" />
            <span>Chỉnh sửa</span>
          </Link>

          {/* Status Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <ClipboardList size={12} className="shrink-0" />
                <span>Trạng thái</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[130px] bg-background border border-border rounded-lg shadow-md p-1 z-50">
              {[
                { name: "Hoàn thành", id: "done" },
                { name: "Chờ xử lý", id: "in_review" },
                { name: "Xác nhận", id: "in_review" },
                { name: "Mở lại", id: "in_progress" },
                { name: "Hủy bỏ", id: "cancelled" },
                { name: "Đóng", id: "done" },
              ].map((st) => {
                const isActive = contextMenu.task.status === st.id
                return (
                  <button
                    key={st.name}
                    onClick={() => handleUpdateTask({ status: st.id })}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span>{st.name}</span>
                    {isActive && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tracker Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <Folder size={12} className="shrink-0" />
                <span>Loại công việc</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[130px] bg-background border border-border rounded-lg shadow-md p-1 z-50">
              {[
                { label: "Lỗi (Bug)", value: "bug" },
                { label: "Tính năng", value: "feature" },
                { label: "Hỗ trợ", value: "support" },
                { label: "Nhiệm vụ", value: "task" },
              ].map((tr) => {
                const isActive = contextMenu.task.tracker === tr.value
                return (
                  <button
                    key={tr.value}
                    onClick={() => handleUpdateTask({ tracker: tr.value })}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span>{tr.label}</span>
                    {isActive && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <Plus size={12} className="shrink-0" />
                <span>Độ ưu tiên</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[130px] bg-background border border-border rounded-lg shadow-md p-1 z-50">
              {[
                { label: "Thấp", value: "low" },
                { label: "Trung bình", value: "medium" },
                { label: "Cao", value: "high" },
                { label: "Khẩn cấp", value: "urgent" },
              ].map((pr) => {
                const isActive = contextMenu.task.priority === pr.value
                return (
                  <button
                    key={pr.value}
                    onClick={() => handleUpdateTask({ priority: pr.value })}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span>{pr.label}</span>
                    {isActive && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assignee Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <User size={12} className="shrink-0" />
                <span>Người thực hiện</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[150px] max-h-[180px] overflow-y-auto bg-background border border-border rounded-lg shadow-md p-1 z-50">
              <button
                onClick={() => handleUpdateTask({ assigneeId: null })}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between border-b border-border/40 pb-1"
              >
                <span>Chưa phân công</span>
                {!contextMenu.task.assigneeId && <span className="text-[10px] font-bold">✓</span>}
              </button>
              {activeProjectMembers?.map((m) => {
                const isActive = contextMenu.task.assigneeId === m.employeeId
                return (
                  <button
                    key={m.id}
                    onClick={() => handleUpdateTask({ assigneeId: m.employeeId })}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{m.employee?.fullName || "Chưa rõ"}</span>
                    {isActive && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* % Done Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <ClipboardList size={12} className="shrink-0" />
                <span>Tiến độ (%)</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[100px] max-h-[180px] overflow-y-auto bg-background border border-border rounded-lg shadow-md p-1 z-50">
              {["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"].map((p) => {
                const isActive = contextMenu.task.progress === Number(p)
                return (
                  <button
                    key={p}
                    onClick={() => handleUpdateTask({ progress: Number(p) })}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer flex items-center justify-between font-mono"
                  >
                    <span>{p} %</span>
                    {isActive && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Watchers Submenu */}
          <div className="relative group/sub">
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer">
              <span className="flex items-center gap-2">
                <User size={12} className="shrink-0" />
                <span>Người theo dõi</span>
              </span>
              <ChevronRight size={10} className="shrink-0" />
            </button>
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block min-w-[150px] max-h-[180px] overflow-y-auto bg-background border border-border rounded-lg shadow-md p-1 z-50">
              {activeProjectMembers?.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.employee?.fullName && toast.success(`Đang theo dõi bởi: ${m.employee.fullName}`)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer text-left truncate"
                >
                  {m.employee?.fullName || "Chưa rõ"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Log Time */}
          <button
            onClick={() => {
              setLogTimeTask({ id: contextMenu.task.id, title: contextMenu.task.title })
              setIsLogTimeOpen(true)
              setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer text-left"
          >
            <Clock size={12} className="shrink-0" />
            <span>Ghi nhận thời gian</span>
          </button>

          {/* Add Subtask */}
          <Link
            to={`/project/${contextMenu.task.projectId}/tasks/new?parentTaskId=${contextMenu.task.id}`}
            onClick={() => setContextMenu({ isOpen: false, x: 0, y: 0, task: null })}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground hover:no-underline"
          >
            <Plus size={12} className="shrink-0" />
            <span>Thêm công việc con</span>
          </Link>

          {/* Copy Link */}
          <button
            onClick={() => {
              const link = window.location.origin + `/project/tasks/${contextMenu.task.id}`
              navigator.clipboard.writeText(link)
              toast.success("Đã sao chép liên kết vào bộ nhớ tạm")
              setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded text-xs transition-colors font-semibold text-foreground cursor-pointer text-left"
          >
            <ExternalLink size={12} className="shrink-0" />
            <span>Sao chép liên kết</span>
          </button>
        </div>
      )}

      {/* Reusable Log Time Modal */}
      {logTimeTask && (
        <LogTimeModal
          open={isLogTimeOpen}
          onOpenChange={setIsLogTimeOpen}
          taskId={logTimeTask.id}
          taskTitle={logTimeTask.title}
        />
      )}
    </div>
  )
}
