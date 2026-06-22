import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { taskApi } from "@/lib/api/task.api"
import { extractErrorMessage } from "@/utils/error-helper"
import { toast } from "sonner"
import { 
  Plus, 
  Settings, 
  Check, 
  AlertCircle, 
  MoreHorizontal, 
  Sparkles,
  RefreshCw,
  FolderKanban
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link } from "react-router-dom"
import { ROLE } from "@/config/entities/employee.config"

import type { Task } from "@/types/task.types"
import type { ProjectMember } from "@/types/project.types"
import type { ProjectTaskStatus, CreateProjectTaskStatusDto, UpdateProjectTaskStatusDto } from "@/types/project-task-status.types"

interface ProjectKanbanTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string;
    fullName: string;
    email: string;
  } | null
  user: {
    id: string;
    role: string;
    fullName: string;
  } | null
}

export function ProjectKanbanTab({
  projectId,
  teamLeader,
  user,
}: ProjectKanbanTabProps) {
  const queryClient = useQueryClient()
  const isLeader = teamLeader?.id === user?.id
  const isAdminOrGM = user?.role === ROLE.ADMIN || user?.role === ROLE.GENERAL_MANAGER
  const canManageStatuses = isAdminOrGM || isLeader

  // Modal States
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Form States
  const [columnName, setColumnName] = useState("")
  const [columnColor, setColumnColor] = useState("#6366F1")
  const [columnIsCompleted, setColumnIsCompleted] = useState(false)
  const [columnIsDefault, setColumnIsDefault] = useState(false)

  // Selected Target States
  const [selectedColumn, setSelectedColumn] = useState<ProjectTaskStatus | null>(null)
  const [fallbackColumnId, setFallbackColumnId] = useState<string>("")

  // Fetch dynamic project statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  // Fetch tasks of this project
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", "kanban", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!projectId,
  })

  const tasks = tasksData?.data || []

  // Create Status Mutation
  const createStatusMutation = useMutation({
    mutationFn: (data: CreateProjectTaskStatusDto) => projectTaskStatusApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      toast.success("Đã tạo cột trạng thái mới")
      setIsAddColumnOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTaskStatusDto }) => 
      projectTaskStatusApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      toast.success("Đã cập nhật trạng thái")
      setIsEditColumnOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Delete Status Mutation
  const deleteStatusMutation = useMutation({
    mutationFn: ({ id, fallbackId }: { id: string; fallbackId?: string }) => 
      projectTaskStatusApi.delete(projectId, id, fallbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      toast.success("Đã xóa cột trạng thái")
      setIsDeleteConfirmOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Move Task Mutation (Drag and Drop)
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      return taskApi.update(taskId, { statusId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      toast.success("Đã di chuyển công việc")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const resetForm = () => {
    setColumnName("")
    setColumnColor("#6366F1")
    setColumnIsCompleted(false)
    setColumnIsDefault(false)
    setSelectedColumn(null)
    setFallbackColumnId("")
  }

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return
    createStatusMutation.mutate({
      name: columnName,
      color: columnColor,
      isCompleted: columnIsCompleted,
      isDefault: columnIsDefault,
    })
  }

  const handleUpdateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedColumn || !columnName.trim()) return
    updateStatusMutation.mutate({
      id: selectedColumn.id,
      data: {
        name: columnName,
        color: columnColor,
        isCompleted: columnIsCompleted,
        isDefault: columnIsDefault,
      },
    })
  }

  const handleDeleteColumn = () => {
    if (!selectedColumn) return
    deleteStatusMutation.mutate({
      id: selectedColumn.id,
      fallbackId: fallbackColumnId || undefined,
    })
  }

  // Native Drag and Drop events
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.statusId !== targetStatusId) {
        moveTaskMutation.mutate({ taskId, statusId: targetStatusId })
      }
    }
  }

  if (isLoadingStatuses || isLoadingTasks) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-secondary/40 rounded-xl p-4 space-y-3 min-w-[280px]">
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // Pre-group tasks by statusId
  const tasksByStatus: Record<string, Task[]> = {}
  statuses.forEach((status) => {
    tasksByStatus[status.id] = []
  })

  // If a task doesn't have statusId but matches enum, try to find a column with similar name or assign to default status
  const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0]

  tasks.forEach((task) => {
    // When task has a statusId that maps to a known column, use it directly
    if (task.statusId && task.statusId in tasksByStatus) {
      tasksByStatus[task.statusId].push(task)
    } else {
      // Compatibility fallback: map task.status (legacy enum) to a column by name
      let mapped = false
      const normEnum = task.status.toLowerCase().replace(/[\s_-]/g, "")
      for (const s of statuses) {
        const normName = s.name.toLowerCase().replace(/[\s_-]/g, "")
        if (normName === normEnum) {
          tasksByStatus[s.id].push(task)
          mapped = true
          break
        }
      }
      if (!mapped && defaultStatus) {
        tasksByStatus[defaultStatus.id].push(task)
      }
    }
  })

  return (
    <div className="space-y-6">
      {/* Board controls & stats summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <FolderKanban className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Kanban Board</h3>
            <p className="text-xs text-muted-foreground">Kéo thả để cập nhật tiến độ công việc động</p>
          </div>
        </div>

        {canManageStatuses && (
          <Button 
            onClick={() => { resetForm(); setIsAddColumnOpen(true); }}
            className="rounded-full text-xs font-bold gap-1 px-4 self-start sm:self-auto shadow-sm"
          >
            <Plus className="size-3.5" />
            Thêm cột trạng thái
          </Button>
        )}
      </div>

      {/* Kanban columns list */}
      <div className="flex items-start gap-5 overflow-x-auto pb-6 select-none min-h-[500px]">
        {statuses.map((status) => {
          // tasksByStatus is pre-initialized for every status so fallback is not needed
          const colTasks = tasksByStatus[status.id] ?? []
          
          return (
            <div 
              key={status.id}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => { handleDrop(e, status.id) }}
              className="flex flex-col w-[290px] shrink-0 bg-secondary/30 border border-border/60 rounded-xl max-h-[700px] hover:bg-secondary/40 transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-border/50">
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span 
                    className="size-3 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: status.color }} 
                  />
                  <span className="font-bold text-sm text-foreground truncate">{status.name}</span>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] bg-background/50 font-bold border-border/80">
                    {colTasks.length}
                  </Badge>
                </div>

                {canManageStatuses && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/40 transition-colors cursor-pointer">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedColumn(status)
                          setColumnName(status.name)
                          setColumnColor(status.color)
                          setColumnIsCompleted(status.isCompleted)
                          setColumnIsDefault(status.isDefault)
                          setIsEditColumnOpen(true)
                        }}
                        className="rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cấu hình cột
                      </DropdownMenuItem>
                      {!status.isDefault && statuses.length > 1 && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedColumn(status)
                            setFallbackColumnId(statuses.find((s) => s.id !== status.id)?.id || "")
                            setIsDeleteConfirmOpen(true)
                          }}
                          className="rounded-lg text-xs font-semibold text-destructive cursor-pointer"
                        >
                          Xóa cột
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Column body - List of task cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3 min-h-[150px] scrollbar-thin">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/40 rounded-lg">
                    <Sparkles className="size-5 text-muted-foreground/30 mb-1" />
                    <p className="text-[10px] font-medium text-muted-foreground/60">Không có công việc</p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    let priorityColor = "bg-secondary text-secondary-foreground"
                    if (task.priority === "urgent") priorityColor = "bg-destructive/10 text-destructive"
                    else if (task.priority === "high") priorityColor = "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                    else if (task.priority === "medium") priorityColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400"

                    let trackerColor = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    if (task.tracker === "bug") trackerColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    else if (task.tracker === "feature") trackerColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    else if (task.tracker === "support") trackerColor = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"

                    return (
                      <div
                        key={task.id}
                        draggable="true"
                        onDragStart={(e) => { handleDragStart(e, task) }}
                        className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group/card"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={`rounded-full text-[9px] px-1.5 py-0 font-bold uppercase ${trackerColor}`}>
                            {task.tracker}
                          </Badge>
                          <Badge variant="outline" className={`rounded-full text-[9px] px-1.5 py-0 font-bold ${priorityColor}`}>
                            {task.priority === "urgent" ? "Khẩn cấp" : task.priority === "high" ? "Cao" : task.priority === "medium" ? "Trung bình" : "Thấp"}
                          </Badge>
                        </div>

                        <Link 
                          to={`/project/tasks/${task.id}`}
                          className="block text-xs font-bold text-foreground group-hover/card:text-primary transition-colors line-clamp-2 hover:underline"
                        >
                          {task.title}
                        </Link>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-[10px]">
                          <span className="font-mono font-semibold text-muted-foreground/80">#{task.id.substring(0, 5)}</span>
                          
                          <div className="flex items-center gap-1.5 max-w-[150px]">
                            {task.assignee ? (
                              <span className="font-semibold text-foreground truncate max-w-[100px]" title={task.assignee.fullName}>
                                {task.assignee.fullName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Chưa giao</span>
                            )}
                            <div className="size-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm">
                              {task.assignee ? task.assignee.fullName.substring(0, 1) : "?"}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar inside card */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-semibold text-muted-foreground">
                            <span>Tiến độ</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary/70 h-1 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300" 
                              style={{ width: `${task.progress}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

        {/* Add status column box */}
        {canManageStatuses && (
          <div 
            onClick={() => { resetForm(); setIsAddColumnOpen(true); }}
            className="flex flex-col items-center justify-center w-[290px] h-[150px] shrink-0 border-2 border-dashed border-border/80 rounded-xl hover:border-primary/60 hover:bg-secondary/10 transition-all cursor-pointer group text-muted-foreground hover:text-primary"
          >
            <Plus className="size-6 text-muted-foreground/60 group-hover:text-primary transition-colors mb-2" />
            <span className="font-bold text-xs">Thêm cột trạng thái</span>
          </div>
        )}
      </div>

      {/* CREATE COLUMN DIALOG */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="rounded-2xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Tạo cột trạng thái
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateColumn} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">Tên cột trạng thái</Label>
              <Input 
                id="name"
                value={columnName}
                onChange={(e) => { setColumnName(e.target.value) }}
                placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
                required
                className="h-9 text-xs border-border rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
              <div className="flex flex-wrap gap-2.5">
                {["#6366F1", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => { setColumnColor(hex) }}
                    className={`size-6 rounded-full border transition-all relative shrink-0 cursor-pointer ${
                      columnColor === hex ? "scale-110 ring-2 ring-primary/45 border-transparent" : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {columnColor === hex && <Check className="size-3 text-white absolute inset-0 m-auto font-black" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input 
                  type="checkbox" 
                  checked={columnIsCompleted}
                  onChange={(e) => { setColumnIsCompleted(e.target.checked) }}
                  className="size-4 text-primary border-border rounded"
                />
                Đánh dấu là cột hoàn thành (isCompleted)
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input 
                  type="checkbox" 
                  checked={columnIsDefault}
                  onChange={(e) => { setColumnIsDefault(e.target.checked) }}
                  className="size-4 text-primary border-border rounded"
                />
                Trạng thái mặc định khi tạo issue (isDefault)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsAddColumnOpen(false) }}
                className="h-9 text-xs rounded-full"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={createStatusMutation.isPending}
                className="h-9 text-xs rounded-full font-bold px-4"
              >
                Tạo cột
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT COLUMN DIALOG */}
      <Dialog open={isEditColumnOpen} onOpenChange={setIsEditColumnOpen}>
        <DialogContent className="rounded-2xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              Cấu hình cột trạng thái
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateColumn} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold text-foreground">Tên cột trạng thái</Label>
              <Input 
                id="edit-name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
                required
                className="h-9 text-xs border-border rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
              <div className="flex flex-wrap gap-2.5">
                {["#6366F1", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColumnColor(hex)}
                    className={`size-6 rounded-full border transition-all relative shrink-0 cursor-pointer ${
                      columnColor === hex ? "scale-110 ring-2 ring-primary/45 border-transparent" : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {columnColor === hex && <Check className="size-3 text-white absolute inset-0 m-auto font-black" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input 
                  type="checkbox" 
                  checked={columnIsCompleted}
                  onChange={(e) => setColumnIsCompleted(e.target.checked)}
                  className="size-4 text-primary border-border rounded"
                />
                Đánh dấu là cột hoàn thành (isCompleted)
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input 
                  type="checkbox" 
                  checked={columnIsDefault}
                  onChange={(e) => setColumnIsDefault(e.target.checked)}
                  disabled={selectedColumn?.isDefault} // Cannot unset default unless setting another status
                  className="size-4 text-primary border-border rounded disabled:opacity-40"
                />
                Trạng thái mặc định khi tạo issue (isDefault)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsEditColumnOpen(false) }}
                className="h-9 text-xs rounded-full"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={updateStatusMutation.isPending}
                className="h-9 text-xs rounded-full font-bold px-4"
              >
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              Xóa cột trạng thái?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Bạn đang yêu cầu xóa trạng thái <span className="font-bold text-foreground">"{selectedColumn?.name}"</span>. 
              Các công việc thuộc cột này sẽ bị ảnh hưởng.
            </p>

            {/* Check if fallback status selection is needed */}
            {statuses.length > 1 && (
              <div className="space-y-2 bg-secondary/35 border border-border/50 rounded-xl p-3.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="size-3" />
                  Chuyển công việc hiện tại sang cột:
                </Label>
                <Select value={fallbackColumnId} onValueChange={setFallbackColumnId}>
                  <SelectTrigger className="w-full h-9 border-border rounded-lg text-xs bg-background">
                    <SelectValue placeholder="Chọn cột thay thế..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {statuses
                      .filter((s) => s.id !== selectedColumn?.id)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs font-semibold">
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsDeleteConfirmOpen(false) }}
              className="h-9 text-xs rounded-full"
            >
              Hủy
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteColumn}
              disabled={deleteStatusMutation.isPending || (statuses.length > 1 && !fallbackColumnId)}
              className="h-9 text-xs rounded-full font-bold px-4"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
