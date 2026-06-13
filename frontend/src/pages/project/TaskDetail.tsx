import { PageCard, StatusPill } from "@/components/common"
import LogTimeModal from "@/components/features/project/LogTimeModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { ROLE } from "@/config/entities/employee.config"
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TRACKERS } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { taskCategoryApi } from "@/lib/api/task-category.api"
import { useAuthStore } from "@/store/auth-store"
import type { SpentTime } from "@/types/spent-time.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  Folder,
  History,
  Plus,
  Trash2,
  User,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

export default function TaskDetail() {
  const { id: taskId } = useParams<{ id: string }>()
  const id = taskId || ""
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Modals state
  const [isOpenLogTimeModal, setIsOpenLogTimeModal] = useState(false)
  const [isOpenEditModal, setIsOpenEditModal] = useState(false)
  const [editingSpentTime, setEditingSpentTime] = useState<SpentTime | undefined>(undefined)

  // Edit Task form state
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskTracker, setTaskTracker] = useState("")
  const [taskPriority, setTaskPriority] = useState("")
  const [taskStatus, setTaskStatus] = useState("")
  const [taskAssignee, setTaskAssignee] = useState("")
  const [taskStart, setTaskStart] = useState("")
  const [taskDue, setTaskDue] = useState("")
  const [taskEstimate, setTaskEstimate] = useState("")
  const [taskProgress, setTaskProgress] = useState(0)
  const [taskCategory, setTaskCategory] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

  // 1. Fetch Task Details
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task", id],
    queryFn: () => taskApi.getOne(id),
    enabled: !!id,
  })

  const projectId = task?.projectId || ""

  // 2. Fetch Spent Time Logs of this task
  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", id],
    queryFn: () => taskApi.listSpentTimes({ taskId: id }),
    enabled: !!id,
  })

  // 3. Fetch Project Members (for assignee dropdown in edit modal)
  const { data: members } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  // 4. Fetch Project details (to check creation policy and TL)
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  // 5. Fetch sibling task IDs for prev/next navigation
  const { data: siblingTasksData } = useQuery({
    queryKey: ["tasks", "siblings", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: !!projectId,
  })

  // 6. Fetch Project Categories
  const { data: categories } = useQuery({
    queryKey: ["project-categories", projectId],
    queryFn: () => taskCategoryApi.list(projectId),
    enabled: !!projectId,
  })

  const totalSpentHours = spentTimes?.reduce((sum, st) => sum + st.hours, 0) || 0

  // Check roles/permissions
  const isCreator = task?.createdById === user?.id
  const isAssignee = task?.assigneeId === user?.id
  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = user?.role === ROLE.ADMIN || user?.role === ROLE.GENERAL_MANAGER

  // Who can edit this task: Admin/GM, TL, Creator, Assignee
  const canEditTask = isAdminOrGM || isLeader || isCreator || isAssignee

  // Open edit modal and populate state
  const handleOpenEdit = () => {
    if (!task) return
    setTaskTitle(task.title)
    setTaskDesc(task.description || "")
    setTaskTracker(task.tracker)
    setTaskPriority(task.priority)
    setTaskStatus(task.status)
    setTaskAssignee(task.assigneeId || "none")
    setTaskStart(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "")
    setTaskDue(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    setTaskEstimate(task.estimatedTime ? String(task.estimatedTime) : "")
    setTaskProgress(task.progress)
    setTaskCategory(task.categoryId || "none")
    setIsOpenEditModal(true)
  }

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return taskApi.update(id, {
        title: taskTitle,
        description: taskDesc.trim() || null,
        tracker: taskTracker as any,
        priority: taskPriority as any,
        status: taskStatus as any,
        assigneeId: taskAssignee === "none" ? null : taskAssignee,
        startDate: taskStart || null,
        dueDate: taskDue || null,
        estimatedTime: taskEstimate ? parseFloat(taskEstimate) : null,
        progress: Number(taskProgress),
        categoryId: taskCategory === "none" ? null : taskCategory,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] })
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      setIsOpenEditModal(false)
      setEditError(null)
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.error?.message || err.message || "Đã xảy ra lỗi")
    },
  })

  // Delete Spent Time log mutation
  const deleteSpentTimeMutation = useMutation({
    mutationFn: async (logId: string) => {
      return taskApi.deleteSpentTime(logId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spentTimes", id] })
      queryClient.invalidateQueries({ queryKey: ["project"] })
    },
  })

  // Delete Task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return taskApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      navigate(`/project/${projectId}`)
    },
  })

  const handleDeleteTask = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
      deleteTaskMutation.mutate()
    }
  }

  const siblingTasks = siblingTasksData?.data || []
  const currentTaskIndex = siblingTasks.findIndex((t) => t.id === id)
  const prevTaskId = currentTaskIndex > 0 ? siblingTasks[currentTaskIndex - 1].id : null
  const nextTaskId = currentTaskIndex < siblingTasks.length - 1 && currentTaskIndex !== -1 ? siblingTasks[currentTaskIndex + 1].id : null

  if (isLoadingTask) {
    return (
      <div className="container p-8 space-y-6">
        <Skeleton className="h-10 w-1/3 rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container p-8 text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Không tìm thấy công việc</h3>
        <p className="text-sm text-muted-foreground">Công việc không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate(-1)} className="rounded-full">Quay lại</Button>
      </div>
    )
  }

  // Formatting helpers
  const formatStatus = (status: string) => {
    if (status === "todo") return "Mới"
    if (status === "in_progress") return "Đang làm"
    if (status === "in_review") return "Đánh giá"
    if (status === "done") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    return status
  }

  const getStatusVariant = (status: string) => {
    if (status === "done") return "success"
    if (status === "in_progress") return "warning"
    if (status === "in_review") return "info"
    if (status === "cancelled") return "danger"
    return "neutral"
  }

  const formatPriority = (priority: string) => {
    if (priority === "low") return "Thấp"
    if (priority === "medium") return "Trung bình"
    if (priority === "high") return "Cao"
    if (priority === "urgent") return "Khẩn cấp"
    return priority
  }

  const getPriorityColor = (priority: string) => {
    if (priority === "urgent") return "bg-destructive/10 text-destructive border-destructive/20"
    if (priority === "high") return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
    if (priority === "medium") return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
    return "bg-secondary text-secondary-foreground"
  }

  const formatActivity = (act: string) => {
    if (act === "develop") return "Phát triển (Develop)"
    if (act === "design") return "Thiết kế (Design)"
    if (act === "test") return "Kiểm thử (Test)"
    if (act === "manage") return "Quản lý (Manage)"
    if (act === "other") return "Khác (Other)"
    return act
  }

  return (
    <div className="container p-8 space-y-6">
      {/* Top Header/Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 w-full md:min-w-[450px]">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/project/list" className="hover:text-primary transition-colors flex items-center gap-1">
                <Folder className="size-3.5" />
                Dự án
              </Link>
              <span>/</span>
              <Link to={`/project/${task.projectId}`} className="hover:text-primary transition-colors font-semibold">
                {task.project?.name || "Chi tiết dự án"}
              </Link>
              <span>/</span>
              <span className="font-mono text-muted-foreground">#{task.id.substring(0, 5)}</span>
            </div>

            {siblingTasks.length > 1 && (
              <div className="flex items-center gap-1 bg-secondary/50 border border-border/40 rounded-full px-2 py-0.5">
                <Button
                  variant="ghost"
                  disabled={!prevTaskId}
                  onClick={() => navigate(`/project/tasks/${prevTaskId}`)}
                  className="rounded-full h-5 px-1.5 text-[9px] font-bold disabled:opacity-40 hover:bg-background cursor-pointer"
                >
                  « Trước
                </Button>
                <span className="text-muted-foreground font-mono text-[9px] px-1 select-none">
                  {currentTaskIndex !== -1 ? `${currentTaskIndex + 1}/${siblingTasks.length}` : "-"}
                </span>
                <Button
                  variant="ghost"
                  disabled={!nextTaskId}
                  onClick={() => navigate(`/project/tasks/${nextTaskId}`)}
                  className="rounded-full h-5 px-1.5 text-[9px] font-bold disabled:opacity-40 hover:bg-background cursor-pointer"
                >
                  Sau »
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {task.tracker}
            </Badge>
            <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingSpentTime(undefined)
              setIsOpenLogTimeModal(true)
            }}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 text-xs px-4"
          >
            <Plus className="size-4" />
            Ghi nhận thời gian (Log Time)
          </Button>

          {canEditTask && (
            <Button
              variant="outline"
              onClick={handleOpenEdit}
              className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-10 text-xs px-4"
            >
              <Edit className="size-4" />
              Chỉnh sửa
            </Button>
          )}

          {(isAdminOrGM || isLeader || isCreator) && (
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              className="rounded-full flex items-center gap-1.5 h-10 text-xs px-4 bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20 cursor-pointer"
            >
              <Trash2 className="size-4" />
              Xóa công việc
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Task Detail details */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main info panel */}
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
              Thông tin công việc
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Trạng thái:</span>
                <StatusPill label={formatStatus(task.status)} variant={getStatusVariant(task.status)} />
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Độ ưu tiên:</span>
                <Badge variant="outline" className={`rounded-full text-[10px] ${getPriorityColor(task.priority)}`}>
                  {formatPriority(task.priority)}
                </Badge>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Chủ đề:</span>
                {task.category ? (
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    {task.category.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground italic text-xs">Không có</span>
                )}
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Người thực hiện:</span>
                {task.assignee ? (
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <User className="size-3.5 text-muted-foreground" />
                    {task.assignee.fullName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Chưa chỉ định</span>
                )}
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Người báo cáo:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground" />
                  {task.createdBy?.fullName || "N/A"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Ngày bắt đầu:</span>
                <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Hạn hoàn thành:</span>
                <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Thời gian ước tính:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {task.estimatedTime ? `${task.estimatedTime} giờ` : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Tiến độ (% Done):</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">{task.progress}%</span>
                  <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PageCard>

          {/* Task description */}
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-3 border-b border-border pb-2">
              Mô tả chi tiết
            </h3>
            {task.description ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">Không có mô tả chi tiết cho công việc này.</p>
            )}
          </PageCard>
        </div>

        {/* Right Side: Spent Time logs list */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-muted-foreground" />
                Spent Time
              </span>
              <span className="text-xs bg-primary/10 text-primary font-bold rounded-full px-2.5 py-0.5">
                {totalSpentHours.toFixed(1)} giờ
              </span>
            </h3>

            {isLoadingSpent ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : !spentTimes || spentTimes.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                Chưa có thời gian làm việc nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {spentTimes.map((st) => {
                  const isLogOwner = st.employeeId === user?.id
                  const canDeleteLog = isAdminOrGM || isLogOwner

                  return (
                    <div
                      key={st.id}
                      className="border border-border/60 rounded-xl p-3 bg-muted/10 hover:bg-muted/30 transition-colors space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {st.employee?.fullName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(st.date).toLocaleDateString("vi-VN")}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full text-[9px] bg-primary/5 text-primary border-primary/10 font-black">
                            {st.hours} h
                          </Badge>

                          {canDeleteLog && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-primary hover:bg-primary/10 rounded-full cursor-pointer size-6 p-0"
                                onClick={() => {
                                  setEditingSpentTime(st)
                                  setIsOpenLogTimeModal(true)
                                }}
                              >
                                <Edit className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer size-6 p-0"
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc chắn muốn xóa nhật ký này?")) {
                                    deleteSpentTimeMutation.mutate(st.id)
                                  }
                                }}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <History className="size-3 text-muted-foreground" />
                        {formatActivity(st.activity)}
                      </div>

                      {st.comment && (
                        <div className="text-xs text-muted-foreground italic bg-background/50 border border-border/40 p-2 rounded-lg mt-1">
                          "{st.comment}"
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </PageCard>
        </div>
      </div>

      {/* LOG TIME MODAL */}
      <LogTimeModal
        open={isOpenLogTimeModal}
        onOpenChange={setIsOpenLogTimeModal}
        taskId={task.id}
        taskTitle={task.title}
        spentTime={editingSpentTime}
      />

      {/* EDIT TASK DIALOG */}
      <Dialog open={isOpenEditModal} onOpenChange={setIsOpenEditModal}>
        <DialogContent className="sm:max-w-[650px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Chỉnh sửa công việc</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cập nhật các thông tin chi tiết và tiến độ cho công việc này.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setEditError(null)
              if (!taskTitle.trim()) {
                setEditError("Vui lòng nhập tiêu đề công việc")
                return
              }
              updateMutation.mutate()
            }}
            className="space-y-4 pt-3"
          >
            {editError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="editTitle" className="text-xs font-semibold text-muted-foreground">
                Tiêu đề công việc <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="h-10 text-sm border-border rounded-full px-4"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editDesc" className="text-xs font-semibold text-muted-foreground">
                Mô tả chi tiết
              </Label>
              <Textarea
                id="editDesc"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="min-h-[90px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editTracker" className="text-xs font-semibold text-muted-foreground">
                  Tracker
                </Label>
                <Select value={taskTracker} onValueChange={setTaskTracker}>
                  <SelectTrigger id="editTracker" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {TASK_TRACKERS.map((tr) => (
                      <SelectItem key={tr} value={tr} className="rounded-lg">
                        {tr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editPriority" className="text-xs font-semibold text-muted-foreground">
                  Độ ưu tiên
                </Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger id="editPriority" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {TASK_PRIORITIES.map((pr) => (
                      <SelectItem key={pr} value={pr} className="rounded-lg">
                        {formatPriority(pr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStatus" className="text-xs font-semibold text-muted-foreground">
                  Trạng thái
                </Label>
                <Select value={taskStatus} onValueChange={setTaskStatus}>
                  <SelectTrigger id="editStatus" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {TASK_STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="rounded-lg">
                        {formatStatus(st)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editAssignee" className="text-xs font-semibold text-muted-foreground">
                  Người thực hiện (Assignee)
                </Label>
                <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                  <SelectTrigger id="editAssignee" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    <SelectItem value="none" className="rounded-lg">Không phân công</SelectItem>
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.employeeId} className="rounded-lg">
                        {m.employee?.fullName || "Chưa rõ"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCategory" className="text-xs font-semibold text-muted-foreground">
                  Chủ đề (Category)
                </Label>
                <Select value={taskCategory} onValueChange={setTaskCategory}>
                  <SelectTrigger id="editCategory" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue placeholder="Chọn chủ đề" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    <SelectItem value="none" className="rounded-lg">Không có</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="rounded-lg">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editProgress" className="text-xs font-semibold text-muted-foreground">
                  Tiến độ (% Done)
                </Label>
                <Input
                  id="editProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => setTaskProgress(Number(e.target.value))}
                  className="h-10 text-sm border-border rounded-full px-4"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editStart" className="text-xs font-semibold text-muted-foreground">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="editStart"
                  type="date"
                  value={taskStart}
                  onChange={(e) => setTaskStart(e.target.value)}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editDue" className="text-xs font-semibold text-muted-foreground">
                  Hạn hoàn thành
                </Label>
                <Input
                  id="editDue"
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editEstimate" className="text-xs font-semibold text-muted-foreground">
                  Ước tính (Giờ)
                </Label>
                <Input
                  id="editEstimate"
                  type="number"
                  step="0.5"
                  min="0"
                  value={taskEstimate}
                  onChange={(e) => setTaskEstimate(e.target.value)}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenEditModal(false)}
                className="h-10 rounded-full px-5 text-sm"
                disabled={updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
