import { PageCard } from "@/components/common"
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
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TRACKERS } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { taskCategoryApi } from "@/lib/api/task-category.api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  UploadCloud,
  User,
  ArrowLeft,
} from "lucide-react"
import { useState, useRef } from "react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

export default function NewTask() {
  const { id: projectId } = useParams<{ id: string }>()
  const pId = projectId || ""
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentTaskId = searchParams.get("parentTaskId") || ""

  // Form State
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskTracker, setTaskTracker] = useState("feature") // Matches mockup default "Feature"
  const [taskStatus, setTaskStatus] = useState("todo") // Matches mockup default "New"
  const [taskPriority, setTaskPriority] = useState("medium") // Matches mockup default "Normal"
  const [taskAssignee, setTaskAssignee] = useState("none")
  const [taskStart, setTaskStart] = useState("")
  const [taskDue, setTaskDue] = useState("")
  const [taskEstimate, setTaskEstimate] = useState("")
  const [taskProgress, setTaskProgress] = useState("0")
  const [parentTask, setParentTask] = useState(parentTaskId)
  const [taskCategory, setTaskCategory] = useState("none")
  const [taskError, setTaskError] = useState<string | null>(null)

  // Watchers selection
  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([])

  // Files drag & drop state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files)
      const validFiles = filesArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB`)
          return false
        }
        return true
      })
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles])
        toast.success(`Đã thêm ${validFiles.length} tệp đính kèm (bản nháp)`)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      const validFiles = filesArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB`)
          return false
        }
        return true
      })
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles])
        toast.success(`Đã thêm ${validFiles.length} tệp đính kèm (bản nháp)`)
      }
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // 1. Fetch Project details (to get project name and check permissions)
  const { data: project } = useQuery({
    queryKey: ["project", pId],
    queryFn: () => projectApi.getOne(pId),
    enabled: !!pId,
  })

  // 2. Fetch Project Members (for assignee and watchers checklist)
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", pId],
    queryFn: () => projectApi.getMembers(pId),
    enabled: !!pId,
  })
  // 3. Fetch Project Categories
  const { data: categories } = useQuery({
    queryKey: ["project-categories", pId],
    queryFn: () => taskCategoryApi.list(pId),
    enabled: !!pId,
  })
  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; andAnother: boolean }) => {
      const parsedEstimate = taskEstimate ? parseFloat(taskEstimate) : null
      if (parsedEstimate !== null && (isNaN(parsedEstimate) || parsedEstimate < 0)) {
        throw new Error("Thời gian ước tính phải là một số không âm")
      }
      return taskApi.create({
        projectId: pId,
        title: payload.title.trim(),
        description: taskDesc.trim() || null,
        tracker: taskTracker as any,
        priority: taskPriority as any,
        status: taskStatus as any,
        assigneeId: taskAssignee === "none" ? null : taskAssignee,
        startDate: taskStart || null,
        dueDate: taskDue || null,
        estimatedTime: parsedEstimate,
        progress: Number(taskProgress),
        categoryId: taskCategory === "none" ? null : taskCategory,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "project", pId] })
      toast.success(`Tạo công việc thành công: ${variables.title}`)
      
      if (variables.andAnother) {
        // Reset only transient fields
        setTaskTitle("")
        setTaskDesc("")
        setParentTask("")
        setTaskCategory("none")
        setSelectedFiles([])
      } else {
        navigate(`/project/${pId}`)
      }
    },
    onError: (err: any) => {
      setTaskError(err.response?.data?.error?.message || err.message || "Tạo công việc thất bại")
    },
  })

  const handleSubmit = (e: React.FormEvent, andAnother: boolean) => {
    e.preventDefault()
    setTaskError(null)
    if (!taskTitle.trim()) {
      setTaskError("Vui lòng nhập tiêu đề")
      return
    }
    createTaskMutation.mutate({ title: taskTitle, andAnother })
  }

  // Format helpers
  const formatTracker = (tracker: string) => {
    if (tracker === "bug") return "Lỗi"
    if (tracker === "feature") return "Tính năng"
    if (tracker === "support") return "Hỗ trợ"
    if (tracker === "task") return "Công việc"
    if (tracker === "meeting") return "Cuộc họp"
    if (tracker === "test") return "Kiểm thử"
    if (tracker === "subtask") return "Công việc con"
    if (tracker === "management") return "Quản lý"
    return tracker.charAt(0).toUpperCase() + tracker.slice(1)
  }

  const formatStatus = (status: string) => {
    if (status === "todo") return "Mới"
    if (status === "in_progress") return "Đang thực hiện"
    if (status === "in_review") return "Đang xem xét"
    if (status === "done") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatPriority = (priority: string) => {
    if (priority === "low") return "Thấp"
    if (priority === "medium") return "Bình thường"
    if (priority === "high") return "Cao"
    if (priority === "urgent") return "Khẩn cấp"
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const handleSelectAllWatchers = () => {
    if (!members) return
    if (selectedWatchers.length === members.length) {
      setSelectedWatchers([])
    } else {
      setSelectedWatchers(members.map((m) => m.employeeId))
    }
  }

  const handleToggleWatcher = (empId: string) => {
    setSelectedWatchers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    )
  }

  // Helper to color coding initials
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30",
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/30",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30",
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800/30",
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800/30",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  return (
    <div className="container p-8 space-y-6 max-w-[1000px]">
      {/* Top Header / Breadcrumbs */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/project/list" className="hover:text-primary transition-colors">
            Dự án
          </Link>
          <span>&gt;</span>
          <Link to={`/project/${pId}`} className="hover:text-primary transition-colors font-medium">
            {project?.name || "Outfiz Redmine"}
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-foreground">Tạo công việc mới</span>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full size-8 p-0 border border-border"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Tạo công việc mới</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Khởi tạo một công việc, lỗi hoặc tính năng mới trong dự án {project?.name || "Outfiz Redmine"}.
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <PageCard className="p-6 border border-border/80 rounded-xl bg-card space-y-6 shadow-sm">
          {taskError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-semibold border border-destructive/20">
              {taskError}
            </div>
          )}

          {/* Tracker & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="tracker" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                LOẠI YÊU CẦU <span className="text-destructive">*</span>
              </Label>
              <Select value={taskTracker} onValueChange={setTaskTracker}>
                <SelectTrigger id="tracker" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  {TASK_TRACKERS.map((tr) => (
                    <SelectItem key={tr} value={tr} className="rounded-lg">
                      {formatTracker(tr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                TRẠNG THÁI
              </Label>
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger id="status" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  {TASK_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="rounded-lg">
                      {formatStatus(st)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject Row */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              TIÊU ĐỀ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Mô tả ngắn gọn công việc"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="h-10 text-sm border-border rounded-full px-4"
              required
            />
          </div>

          {/* Description Textarea with Toolbar */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              MÔ TẢ
            </Label>
            <RichTextEditor
              value={taskDesc}
              onChange={setTaskDesc}
              placeholder="Cung cấp chi tiết các bước, ngữ cảnh hoặc yêu cầu..."
            />
          </div>

          {/* Priority & Start Date & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                ĐỘ ƯU TIÊN
              </Label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger id="priority" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  {TASK_PRIORITIES.map((pr) => (
                    <SelectItem key={pr} value={pr} className="rounded-lg">
                      {formatPriority(pr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                NGÀY BẮT ĐẦU
              </Label>
              <Input
                id="startDate"
                type="date"
                value={taskStart}
                onChange={(e) => setTaskStart(e.target.value)}
                className="w-full h-10 text-sm border-border rounded-full px-4 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                HẠN HOÀN THÀNH
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full h-10 text-sm border-border rounded-full px-4 bg-background"
              />
            </div>
          </div>

          {/* Assignee & Estimated Time & % Done */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="assignee" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                NGƯỜI THỰC HIỆN
              </Label>
              <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                <SelectTrigger id="assignee" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  <SelectItem value="none" className="rounded-lg">Chọn thành viên</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.employeeId} className="rounded-lg">
                      {m.employee?.fullName || "Chưa rõ"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimatedTime" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                THỜI GIAN ƯỚC TÍNH
              </Label>
              <div className="relative">
                <Input
                  id="estimatedTime"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  value={taskEstimate}
                  onChange={(e) => setTaskEstimate(e.target.value)}
                  className="h-10 text-sm border-border rounded-full pl-4 pr-12 bg-background"
                />
                <span className="absolute right-4 top-2.5 text-xs text-muted-foreground font-semibold">giờ</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="progress" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                % HOÀN THÀNH
              </Label>
              <Select value={taskProgress} onValueChange={setTaskProgress}>
                <SelectTrigger id="progress" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  {["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"].map((p) => (
                    <SelectItem key={p} value={p} className="rounded-lg font-mono">
                      {p} %
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Task & Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="parentTask" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                CÔNG VIỆC CHA
              </Label>
              <Input
                id="parentTask"
                placeholder="#1234 hoặc Tên công việc"
                value={parentTask}
                onChange={(e) => setParentTask(e.target.value)}
                className="h-10 text-sm border-border rounded-full px-4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                CHỦ ĐỀ (CATEGORY)
              </Label>
              <Select value={taskCategory} onValueChange={setTaskCategory}>
                <SelectTrigger id="category" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue placeholder="Chọn chủ đề" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  <SelectItem value="none" className="rounded-lg">Không có</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border/60 my-4" />

          {/* Files & Watchers section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Drag and drop zone */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">TÀI LIỆU ĐÍNH KÈM</Label>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.mp4"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed transition-all rounded-lg p-6 cursor-pointer min-h-[140px] text-center ${
                  isDragOver
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 bg-muted/5 hover:bg-muted/10"
                }`}
              >
                <UploadCloud className={`size-8 mb-2 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold text-foreground">
                  {isDragOver ? "Thả tệp vào đây..." : "Nhấp để tải lên hoặc kéo thả tập tin vào đây"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">PDF, PNG, JPG hoặc MP4 (tối đa 10MB)</span>
              </div>

              {/* Display selected files */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    DANH SÁCH TỆP ĐÃ CHỌN ({selectedFiles.length})
                  </div>
                  <div className="border border-border rounded-lg p-2 bg-background space-y-1.5 max-h-[150px] overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="shrink-0">📄</span>
                          <span className="font-semibold text-foreground truncate">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(idx)
                          }}
                          className="text-[10px] font-bold text-destructive hover:underline cursor-pointer px-1.5 py-0.5 rounded hover:bg-destructive/10"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Watchers box */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">NGƯỜI THEO DÕI</Label>
                <button
                  type="button"
                  onClick={handleSelectAllWatchers}
                  className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer"
                >
                  {members && selectedWatchers.length === members.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
              </div>

              <div className="border border-border rounded-lg p-3 bg-background max-h-[140px] overflow-y-auto space-y-2">
                {isLoadingMembers ? (
                  <span className="text-xs text-muted-foreground italic">Đang tải danh sách thành viên...</span>
                ) : !members || members.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Không có thành viên nào trong dự án này</span>
                ) : (
                  members.map((m) => {
                    const isChecked = selectedWatchers.includes(m.employeeId)
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 text-xs text-foreground cursor-pointer hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleWatcher(m.employeeId)}
                          className="size-3.5 rounded border-border text-blue-600 focus:ring-blue-600"
                        />
                        {/* Circle Avatar with styled fallback background */}
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border ${getAvatarColor(m.employee?.fullName || "Chưa rõ")}`}>
                          {(m.employee?.fullName || "C").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-muted-foreground hover:text-foreground">{m.employee?.fullName || "Chưa rõ"}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>


        </PageCard>

        {/* Action buttons */}
        <div className="flex justify-end items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-full text-sm font-semibold h-10 px-5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Hủy
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={createTaskMutation.isPending}
            className="rounded-full text-sm font-semibold border-border hover:bg-muted/50 h-10 px-5 cursor-pointer text-blue-600 hover:text-blue-700"
          >
            Tạo và thêm tiếp
          </Button>

          <Button
            type="submit"
            disabled={createTaskMutation.isPending}
            className="rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 cursor-pointer"
          >
            {createTaskMutation.isPending ? "Đang tạo..." : "Tạo công việc"}
          </Button>
        </div>
      </form>


    </div>
  )
}
