import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  AlertTriangle, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  FileText,
  ChevronDown,
  Check,
  RotateCcw,
  Save,
  ZoomIn,
  ZoomOut,
  X,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays, addDays, eachDayOfInterval } from "date-fns"
import { vi } from "date-fns/locale"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { customQueryApi } from "@/lib/api/custom-query.api"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { ROLE } from "@/config/entities/employee.config"
import { useAuthStore } from "@/store/auth-store"
import { extractErrorMessage } from "@/utils/error-helper"
import { TaskReviewModal } from "./task-review-modal"
import type { Project, GanttLeaveDay } from "@/types/project.types"
import type { Task, UpdateTaskDto } from "@/types/task.types"

interface ProjectGanttTabProps {
  projectId: string
  project: Project
}

export function ProjectGanttTab({ projectId, project }: ProjectGanttTabProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Timeline view range configuration (timeline start date)
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    if (project.startDate) {
      return new Date(project.startDate)
    }
    return new Date()
  })

  // Selected task state for completion / review modal
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null)

  // Options Panel states
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false)
  const [showEstTime, setShowEstTime] = useState(true)
  const [showAssignee, setShowAssignee] = useState(true)
  const [showProgress, setShowProgress] = useState(true)
  const [showLeaves, setShowLeaves] = useState(true)
  const [showConflicts, setShowConflicts] = useState(true)

  // Filter form states
  const [monthsInput, setMonthsInput] = useState("6") // default 6 months from project start as in the Redmine image
  const [monthInput, setMonthInput] = useState<number>(() => timelineStart.getMonth())
  const [yearInput, setYearInput] = useState<number>(() => timelineStart.getFullYear())
  const [monthsRange, setMonthsRange] = useState(6) // actual range applied (months)

  // Redmine Filters State
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(["status"])
  const [filterStates, setFilterStates] = useState<Record<string, {
    enabled: boolean
    operator: string
    value: string
  }>>({
    status: { enabled: true, operator: "open", value: "" },
    tracker: { enabled: true, operator: "is", value: "task" },
    priority: { enabled: true, operator: "is", value: "medium" },
    assignee: { enabled: true, operator: "is", value: "" },
  })

  const [appliedFilterKeys, setAppliedFilterKeys] = useState<string[]>(["status"])
  const [appliedFilterStates, setAppliedFilterStates] = useState<Record<string, {
    enabled: boolean
    operator: string
    value: string
  }>>({
    status: { enabled: true, operator: "open", value: "" },
    tracker: { enabled: true, operator: "is", value: "task" },
    priority: { enabled: true, operator: "is", value: "medium" },
    assignee: { enabled: true, operator: "is", value: "" },
  })

  // Sidebar collapsible state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  // Zoom state (column width in pixels)
  const [dayWidth, setDayWidth] = useState(28)

  // Fetch consolidated Gantt data (tasks, members, leave records)
  const { data: ganttData, isLoading } = useQuery({
    queryKey: ["projectGantt", projectId],
    queryFn: () => projectApi.getGanttData(projectId),
    enabled: !!projectId,
  })

  // Fetch saved custom queries
  const { data: savedQueries = [], refetch: refetchSavedQueries } = useQuery({
    queryKey: ["customQueries", projectId],
    queryFn: () => customQueryApi.list(projectId),
    enabled: !!projectId,
  })

  // Mutation to save custom query
  const saveQueryMutation = useMutation({
    mutationFn: async (data: { name: string; queryData: string }) => {
      return customQueryApi.create({
        name: data.name,
        type: "gantt",
        projectId,
        queryData: data.queryData,
      })
    },
    onSuccess: () => {
      void refetchSavedQueries()
      toast.success("Đã lưu truy vấn thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Mutation to delete custom query
  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      return customQueryApi.delete(id)
    },
    onSuccess: () => {
      void refetchSavedQueries()
      toast.success("Đã xóa truy vấn thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Apply a custom query filters
  const applySavedQuery = (savedQuery: CustomQuery) => {
    try {
      const data = JSON.parse(savedQuery.queryData)
      if (data && Array.isArray(data.activeFilterKeys) && data.filterStates) {
        setActiveFilterKeys(data.activeFilterKeys)
        setFilterStates(data.filterStates)
        setAppliedFilterKeys(data.activeFilterKeys)
        setAppliedFilterStates(data.filterStates)
        toast.success(`Đã áp dụng truy vấn: ${savedQuery.name}`)
      } else {
        toast.error("Dữ liệu truy vấn không hợp lệ")
      }
    } catch (e) {
      toast.error("Không thể đọc dữ liệu truy vấn đã lưu")
    }
  }

  // Handle saving new custom query
  const handleSaveQuery = () => {
    const name = prompt("Nhập tên truy vấn riêng cần lưu:")
    if (!name || !name.trim()) return

    const queryDataObj = {
      activeFilterKeys,
      filterStates,
    }

    saveQueryMutation.mutate({
      name: name.trim(),
      queryData: JSON.stringify(queryDataObj),
    })
  }

  // Find all unique assignees (team leader + project members)
  const assignees = useMemo(() => {
    const list: { id: string; fullName: string }[] = []
    
    // Add team leader
    if (project?.teamLeader) {
      list.push({ id: project.teamLeader.id, fullName: project.teamLeader.fullName })
    } else if (project?.teamLeaderId) {
      list.push({ id: project.teamLeaderId, fullName: "Team Leader" })
    }
    
    // Add members
    const members = ganttData?.members || []
    members.forEach((m) => {
      if (m && !list.some((item) => item.id === m.id)) {
        list.push({ id: m.id, fullName: m.fullName })
      }
    })
    
    return list
  }, [project, ganttData])

  const filterDefinitions = {
    status: { label: "Trạng thái", type: "status", group: "" },
    tracker: { label: "Kiểu vấn đề", type: "tracker", group: "" },
    priority: { label: "Mức ưu tiên", type: "priority", group: "" },
    author: { label: "Tác giả", type: "employee", group: "" },
    assignee: { label: "Phân công cho", type: "employee", group: "" },
    target_version: { label: "Phiên bản", type: "version", group: "" },
    subject: { label: "Chủ đề", type: "text", group: "" },
    progress: { label: "Tiến độ", type: "progress", group: "" },
    updated_by: { label: "Cập nhật bởi", type: "employee", group: "" },
    last_updated_by: { label: "Cập nhật lần cuối bởi", type: "employee", group: "" },
    subproject: { label: "Dự án con", type: "text", group: "" },
    issue: { label: "Vấn đề", type: "text", group: "" },
    
    // Group: Văn bản
    txt_subject: { label: "Chủ đề", type: "text", group: "Văn bản" },
    txt_desc: { label: "Mô tả", type: "text", group: "Văn bản" },
    txt_notes: { label: "Ghi chú", type: "text", group: "Văn bản" },
    txt_any: { label: "Any searchable text", type: "text", group: "Văn bản" },

    // Group: Ngày
    date_created: { label: "Tạo", type: "date", group: "Ngày" },
    date_updated: { label: "Cập nhật", type: "date", group: "Ngày" },
    date_closed: { label: "Đã đóng", type: "date", group: "Ngày" },
    date_start: { label: "Bắt đầu", type: "date", group: "Ngày" },
    date_due: { label: "Hết hạn", type: "date", group: "Ngày" },

    // Group: Theo dõi thời gian
    time_est: { label: "Thời gian ước lượng", type: "number", group: "Theo dõi thời gian" },
    time_spent: { label: "Thời gian", type: "number", group: "Theo dõi thời gian" },

    // Group: Tập tin
    file_name: { label: "Tập tin", type: "text", group: "Tập tin" },
    file_desc: { label: "File description", type: "text", group: "Tập tin" },

    // Group: Tác giả
    author_group: { label: "Của tác giả : Nhóm", type: "text", group: "Tác giả" },
    author_role: { label: "Của tác giả : Quyền", type: "text", group: "Tác giả" },

    // Group: Phân công cho
    assignee_group: { label: "Nhóm thụ hưởng", type: "text", group: "Phân công cho" },
    assignee_role: { label: "Quyền thụ hưởng", type: "text", group: "Phân công cho" },

    // Group: Phiên bản
    ver_date: { label: "Phiên bản mục tiêu của Ngày", type: "date", group: "Phiên bản" },
    ver_status: { label: "Phiên bản mục tiêu của Trạng thái", type: "text", group: "Phiên bản" },

    // Group: Dự án
    proj_status: { label: "Của dự án : Trạng thái", type: "text", group: "Dự án" },

    // Group: Mối quan hệ
    rel_related: { label: "liên quan", type: "relation", group: "Mối quan hệ" },
    rel_duplicate: { label: "trùng với", type: "relation", group: "Mối quan hệ" },
    rel_duplicated_by: { label: "bị trùng bởi", type: "relation", group: "Mối quan hệ" },
    rel_blocks: { label: "chặn", type: "relation", group: "Mối quan hệ" },
    rel_blocked_by: { label: "chặn bởi", type: "relation", group: "Mối quan hệ" },
    rel_precedes: { label: "đi trước", type: "relation", group: "Mối quan hệ" },
    rel_follows: { label: "đi sau", type: "relation", group: "Mối quan hệ" },
    rel_copied_to: { label: "Sao chép đến", type: "relation", group: "Mối quan hệ" },
    rel_copied_from: { label: "Sao chép từ", type: "relation", group: "Mối quan hệ" },
    rel_parent: { label: "Tác vụ cha", type: "relation", group: "Mối quan hệ" },
    rel_child: { label: "Tác vụ con", type: "relation", group: "Mối quan hệ" },
  }

  const getDefaultOperator = (key: string) => {
    const def = filterDefinitions[key as keyof typeof filterDefinitions]
    if (def === undefined) return "is"
    if (key === "status") return "open"
    if (key === "tracker" || key === "priority") return "is"
    if (def.type === "employee") return "là"
    if (def.type === "text") return "chứa"
    if (def.type === "progress" || def.type === "number") return "="
    if (def.type === "date") return "any"
    if (def.type === "relation") return "any"
    return "is"
  }

  const getDefaultValue = (key: string) => {
    const def = filterDefinitions[key as keyof typeof filterDefinitions]
    if (def === undefined) return ""
    if (key === "tracker") return "task"
    if (key === "priority") return "medium"
    if (def.type === "employee") return assignees[0]?.id || ""
    if (def.type === "progress") return "50"
    if (def.type === "number") return "0"
    if (def.type === "date") return ""
    return ""
  }

  // Update Task mutation (used to quickly adjust task dates)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskDto }) => {
      return taskApi.update(taskId, data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectGantt", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks", "overview", projectId] })
      toast.success("Đã cập nhật công việc")
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Timeline days calculation (monthsRange months starting from timelineStart)
  const timelineDays = useMemo(() => {
    const end = addDays(addDays(timelineStart, monthsRange * 30), -1)
    const daysInterval = eachDayOfInterval({ start: timelineStart, end })
    return daysInterval.slice(0, 180) // Cap at 180 days max
  }, [timelineStart, monthsRange])

  // Month spans grouping for timeline header
  const monthSpans = useMemo(() => {
    if (timelineDays.length === 0) return []
    const spans: { label: string; colSpan: number }[] = []
    
    let currentLabel = format(timelineDays[0], "yyyy-M")
    let currentCount = 0
    
    timelineDays.forEach((day) => {
      const label = format(day, "yyyy-M")
      if (label === currentLabel) {
        currentCount++
      } else {
        spans.push({ label: currentLabel, colSpan: currentCount })
        currentLabel = label
        currentCount = 1
      }
    })
    
    if (currentCount > 0) {
      spans.push({ label: currentLabel, colSpan: currentCount })
    }
    
    return spans
  }, [timelineDays])

  const tasks = ganttData?.tasks || []
  const leaveDays = ganttData?.leaveDays || []

  // Apply filters to tasks at client side
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      for (const key of appliedFilterKeys) {
        if (!Object.prototype.hasOwnProperty.call(filterDefinitions, key)) continue
        const filter = appliedFilterStates[key]
        if (filter === undefined || !filter.enabled) continue

        if (key === "status") {
          const statusVal = task.status
          if (filter.operator === "open") {
            const isOpen = ["todo", "in_progress", "in_review", "reopened"].includes(statusVal)
            if (!isOpen) return false
          } else if (filter.operator === "đóng") {
            const isClosed = ["done", "cancelled"].includes(statusVal)
            if (!isClosed) return false
          } else if (filter.operator === "tất cả") {
            // matches all
          } else if (filter.operator === "là") {
            if (statusVal !== filter.value) return false
          } else if (filter.operator === "không là") {
            if (statusVal === filter.value) return false
          }
        }

        if (key === "tracker") {
          const trackerVal = task.tracker
          if (filter.operator === "is") {
            if (trackerVal !== filter.value) return false
          } else if (filter.operator === "is_not") {
            if (trackerVal === filter.value) return false
          }
        }

        if (key === "priority") {
          const priorityVal = task.priority
          if (filter.operator === "is") {
            if (priorityVal !== filter.value) return false
          } else if (filter.operator === "is_not") {
            if (priorityVal === filter.value) return false
          }
        }

        if (key === "assignee") {
          const assigneeIdVal = task.assigneeId
          if (filter.operator === "là") {
            if (assigneeIdVal !== filter.value) return false
          } else if (filter.operator === "không là") {
            if (assigneeIdVal === filter.value) return false
          } else if (filter.operator === "tôi") {
            if (assigneeIdVal !== user?.id) return false
          } else if (filter.operator === "none") {
            if (assigneeIdVal) return false
          }
        }

        if (key === "author") {
          const authorVal = task.createdById
          if (filter.operator === "là") {
            if (authorVal !== filter.value) return false
          } else if (filter.operator === "không là") {
            if (authorVal === filter.value) return false
          } else if (filter.operator === "tôi") {
            if (authorVal !== user?.id) return false
          }
        }

        if (key === "subject" || key === "txt_subject") {
          const subjectVal = (task.title || "").toLowerCase()
          const val = (filter.value || "").toLowerCase()
          if (filter.operator === "chứa") {
            if (!subjectVal.includes(val)) return false
          } else if (filter.operator === "không chứa") {
            if (subjectVal.includes(val)) return false
          } else if (filter.operator === "bắt đầu bằng") {
            if (!subjectVal.startsWith(val)) return false
          } else if (filter.operator === "kết thúc bằng") {
            if (!subjectVal.endsWith(val)) return false
          } else if (filter.operator === "none") {
            if (subjectVal.trim()) return false
          } else if (filter.operator === "any") {
            if (!subjectVal.trim()) return false
          }
        }

        if (key === "txt_desc") {
          const descVal = (task.description || "").toLowerCase()
          const val = (filter.value || "").toLowerCase()
          if (filter.operator === "chứa") {
            if (!descVal.includes(val)) return false
          } else if (filter.operator === "không chứa") {
            if (descVal.includes(val)) return false
          }
        }

        if (key === "progress") {
          const progVal = task.progress || 0
          const val = Number(filter.value || 0)
          if (filter.operator === "=") {
            if (progVal !== val) return false
          } else if (filter.operator === ">=") {
            if (progVal < val) return false
          } else if (filter.operator === "<=") {
            if (progVal > val) return false
          }
        }

        if (key === "date_start") {
          if (!task.startDate) return false
          const taskStart = new Date(task.startDate)
          if (filter.operator === "after" && filter.value) {
            if (taskStart <= new Date(filter.value)) return false
          } else if (filter.operator === "before" && filter.value) {
            if (taskStart >= new Date(filter.value)) return false
          }
        }

        if (key === "date_due") {
          if (!task.dueDate) return false
          const taskDue = new Date(task.dueDate)
          if (filter.operator === "after" && filter.value) {
            if (taskDue <= new Date(filter.value)) return false
          } else if (filter.operator === "before" && filter.value) {
            if (taskDue >= new Date(filter.value)) return false
          }
        }

        if (key === "rel_parent") {
          const hasParent = !!task.parentTaskId
          if (filter.operator === "any") {
            if (!hasParent) return false
          } else if (filter.operator === "none") {
            if (hasParent) return false
          }
        }

        // Custom hidden filters for Quick Queries
        if (key === "_reported") {
          if (task.createdById !== filter.value) return false
        }
        if (key === "_updated") {
          if (!task.updatedAt) return false
          const updatedDate = new Date(task.updatedAt)
          const diff = differenceInDays(new Date(), updatedDate)
          if (diff > 7) return false
        }
        if (key === "_watched") {
          const myId = filter.value
          if (task.assigneeId !== myId && task.createdById !== myId) return false
        }
      }
      return true
    })
  }, [tasks, appliedFilterKeys, appliedFilterStates, user?.id])

  // Flatten tree array builder (subtask tree structure support)
  const treeTasks = useMemo(() => {
    const rootTasks = filteredTasks.filter((t: Task) => !t.parentTaskId)
    const childTasks = filteredTasks.filter((t: Task) => t.parentTaskId)

    const result: (Task & { depth: number })[] = []

    const traverse = (parent: Task, depth: number) => {
      result.push({ ...parent, depth })
      const children = childTasks.filter((t: Task) => t.parentTaskId === parent.id)
      children.forEach((child: Task) => {
        traverse(child, depth + 1)
      })
    }

    rootTasks.forEach((root: Task) => {
      traverse(root, 0)
    })

    // Include orphan child tasks (if parentTask is missing from project tasks somehow)
    const processedIds = new Set(result.map((r) => r.id))
    filteredTasks.forEach((t: Task) => {
      if (!processedIds.has(t.id)) {
        result.push({ ...t, depth: 0 })
      }
    })

    return result
  }, [filteredTasks])

  // Navigate timeline view
  const shiftTimeline = (days: number) => {
    setTimelineStart((prev) => addDays(prev, days))
  }

  // Reset timeline to project start
  const resetTimelineToProjectStart = () => {
    if (project.startDate) {
      setTimelineStart(new Date(project.startDate))
    } else {
      setTimelineStart(new Date())
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Clock className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu Gantt...</p>
      </div>
    )
  }


  // Check roles/permissions
  const isLeader = project.teamLeaderId === user?.id
  const isAdminOrGM = user?.role === ROLE.ADMIN || user?.role === ROLE.GENERAL_MANAGER

  // Find overlap leave days for a task and its assignee
  const getLeaveConflict = (task: Task) => {
    if (!task.assigneeId || !task.startDate || !task.dueDate) return null

    const taskStart = new Date(task.startDate)
    const taskDue = new Date(task.dueDate)

    // Filter approved leaves for this assignee
    const assigneeLeaves = leaveDays.filter((l: GanttLeaveDay) => l.employeeId === task.assigneeId)

    const conflictingLeaves = assigneeLeaves.filter((leave: GanttLeaveDay) => {
      const leaveStart = new Date(leave.startDate)
      const leaveEnd = new Date(leave.endDate)

      // Check interval overlap
      return (
        taskStart <= leaveEnd && taskDue >= leaveStart
      )
    })

    if (conflictingLeaves.length === 0) return null

    // Format leave dates for tooltips
    return conflictingLeaves.map((l: GanttLeaveDay) => {
      const startStr = format(new Date(l.startDate), "dd/MM")
      const endStr = format(new Date(l.endDate), "dd/MM")
      return `${startStr} - ${endStr}${l.reason ? ` (${l.reason})` : ""}`
    }).join(", ")
  }

  // Helper to check if a member is on leave on a specific day
  const isEmployeeOnLeaveOnDay = (employeeId: string, day: Date) => {
    const employeeLeaves = leaveDays.filter((l: GanttLeaveDay) => l.employeeId === employeeId)
    return employeeLeaves.some((leave: GanttLeaveDay) => {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      // Check if day is within [start, end]
      return day >= start && day <= end
    })
  }

  // Helper to render task bar position and duration
  const getTaskGridStyle = (task: Task) => {
    if (!task.startDate || !task.dueDate) return null

    const taskStart = new Date(task.startDate)
    const taskDue = new Date(task.dueDate)

    // Check if task falls completely out of timeline view
    const timelineEnd = addDays(timelineStart, 29)
    if (taskDue < timelineStart || taskStart > timelineEnd) {
      return null
    }

    // Calculate grid positions (1-indexed columns, 1 column per day)
    let startCol = differenceInDays(taskStart, timelineStart) + 1
    let span = differenceInDays(taskDue, taskStart) + 1

    // Crop to timeline bounds
    if (startCol < 1) {
      span += startCol - 1
      startCol = 1
    }
    if (startCol + span > 30) {
      span = 31 - startCol
    }

    if (span <= 0) return null

    return {
      gridColumnStart: startCol,
      gridColumnEnd: startCol + span,
    }
  }

  // Change task date duration (shifting task days)
  const shiftTaskDates = (task: Task, days: number) => {
    if (!task.startDate || !task.dueDate) return
    const newStart = addDays(new Date(task.startDate), days)
    const newDue = addDays(new Date(task.dueDate), days)

    updateTaskMutation.mutate({
      taskId: task.id,
      data: {
        startDate: format(newStart, "yyyy-MM-dd"),
        dueDate: format(newDue, "yyyy-MM-dd"),
      },
    })
  }

  // Shift timeline start by a specific number of months
  const shiftTimelineByMonth = (months: number) => {
    setTimelineStart((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + months, 1)
      setMonthInput(newDate.getMonth())
      setYearInput(newDate.getFullYear())
      return newDate
    })
  }

  // Helper to get month label relative to current timelineStart
  const getMonthOffsetLabel = (offset: number) => {
    const d = new Date(timelineStart.getFullYear(), timelineStart.getMonth() + offset, 1)
    const months = [
      "Tháng một", "Tháng hai", "Tháng ba", "Tháng tư", "Tháng năm", "Tháng sáu",
      "Tháng bảy", "Tháng tám", "Tháng chín", "Tháng mười", "Tháng mười một", "Tháng mười hai"
    ]
    return months[d.getMonth()]
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setDayWidth((prev) => Math.min(prev + 4, 48))
  }
  const handleZoomOut = () => {
    setDayWidth((prev) => Math.max(prev - 4, 16))
  }

  // Apply filters
  const handleApplyFilters = () => {
    const range = parseInt(monthsInput) || 6
    setMonthsRange(range)
    const newStart = new Date(yearInput, monthInput, 1)
    setTimelineStart(newStart)
    
    // Apply filters
    setAppliedFilterKeys([...activeFilterKeys])
    setAppliedFilterStates(JSON.parse(JSON.stringify(filterStates)))
    
    toast.success("Đã áp dụng bộ lọc và dòng thời gian")
  }

  // Clear/Reset filters
  const handleClearFilters = () => {
    setMonthsInput("6")
    setMonthsRange(6)
    if (project.startDate) {
      const pStart = new Date(project.startDate)
      setTimelineStart(pStart)
      setMonthInput(pStart.getMonth())
      setYearInput(pStart.getFullYear())
    } else {
      const today = new Date()
      setTimelineStart(today)
      setMonthInput(today.getMonth())
      setYearInput(today.getFullYear())
    }

    // Reset filters
    setActiveFilterKeys(["status"])
    const defaultStates = {
      status: { enabled: true, operator: "open", value: "" },
      tracker: { enabled: true, operator: "is", value: "task" },
      priority: { enabled: true, operator: "is", value: "medium" },
      assignee: { enabled: true, operator: "is", value: "" },
    }
    setFilterStates(defaultStates)
    setAppliedFilterKeys(["status"])
    setAppliedFilterStates(defaultStates)
    
    toast.info("Đã khôi phục bộ lọc mặc định")
  }

  // Quick Query Sidebar Handler
  const handleQuickQuery = (type: string) => {
    if (type === "assigned_to_me") {
      setActiveFilterKeys(["status", "assignee"])
      const states = {
        status: { enabled: true, operator: "open", value: "" },
        tracker: { enabled: false, operator: "is", value: "task" },
        priority: { enabled: false, operator: "is", value: "medium" },
        assignee: { enabled: true, operator: "tôi", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys(["status", "assignee"])
      setAppliedFilterStates(states)
      toast.success("Đã áp dụng: Công việc phân công cho tôi")
    } else if (type === "reported_issues") {
      setActiveFilterKeys(["status"])
      const states = {
        status: { enabled: true, operator: "open", value: "" },
        tracker: { enabled: false, operator: "is", value: "task" },
        priority: { enabled: false, operator: "is", value: "medium" },
        assignee: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys(["status", "_reported"])
      setAppliedFilterStates({
        ...states,
        _reported: { enabled: true, operator: "is", value: user?.id || "" }
      })
      toast.success("Đã áp dụng: Công việc do tôi tạo")
    } else if (type === "updated_issues") {
      setActiveFilterKeys(["status"])
      const states = {
        status: { enabled: true, operator: "open", value: "" },
        tracker: { enabled: false, operator: "is", value: "task" },
        priority: { enabled: false, operator: "is", value: "medium" },
        assignee: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys(["status", "_updated"])
      setAppliedFilterStates({
        ...states,
        _updated: { enabled: true, operator: "is", value: "" }
      })
      toast.success("Đã áp dụng: Công việc được cập nhật gần đây")
    } else if (type === "watched_issues") {
      setActiveFilterKeys(["status"])
      const states = {
        status: { enabled: true, operator: "open", value: "" },
        tracker: { enabled: false, operator: "is", value: "task" },
        priority: { enabled: false, operator: "is", value: "medium" },
        assignee: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys(["status", "_watched"])
      setAppliedFilterStates({
        ...states,
        _watched: { enabled: true, operator: "is", value: user?.id || "" }
      })
      toast.success("Đã áp dụng: Công việc tôi quan tâm")
    }
  }

  // Render values selector dynamically
  const renderValueSelector = (key: string, operator: string, value: string, onChange: (val: string) => void) => {
    const def = filterDefinitions[key as keyof typeof filterDefinitions]
    if (def === undefined) return null

    if (key === "status") {
      if (operator !== "là" && operator !== "không là") return null
      return (
        <select
          value={value || "todo"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value="todo">New</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">Resolved</option>
          <option value="reopened">Feedback</option>
          <option value="done">Closed</option>
          <option value="cancelled">Rejected</option>
        </select>
      )
    }

    if (key === "tracker") {
      return (
        <select
          value={value || "task"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value="feature">Feature</option>
          <option value="bug">Bug</option>
          <option value="support">Support</option>
          <option value="task">Task</option>
          <option value="meeting">Meeting</option>
          <option value="test">Test</option>
          <option value="subtask">Subtask</option>
          <option value="management">Management</option>
        </select>
      )
    }

    if (key === "priority") {
      return (
        <select
          value={value || "medium"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
          <option value="urgent">Khẩn cấp</option>
        </select>
      )
    }

    // Dynamic checks based on type definition
    if (def.type === "employee") {
      if (operator !== "là" && operator !== "không là") return null
      return (
        <select
          value={value || (assignees[0]?.id || "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer max-w-[200px]"
        >
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.fullName}</option>
          ))}
        </select>
      )
    }

    if (def.type === "text") {
      if (operator === "none" || operator === "any") return null
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="..."
          className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background w-32 font-semibold"
        />
      )
    }

    if (def.type === "number" || def.type === "progress") {
      if (operator === "none" || operator === "any") return null
      return (
        <input
          type="number"
          value={value || "0"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background w-20"
        />
      )
    }

    if (def.type === "date") {
      if (operator === "any" || operator === "today" || operator === "yesterday") return null
      if (operator === "in_days" || operator === "more_than_days") {
        return (
          <div className="flex items-center gap-1 font-semibold">
            <input
              type="number"
              value={value || "0"}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background w-16"
            />
            <span>ngày trước</span>
          </div>
        )
      }
      if (operator === "between") {
        const [d1 = "", d2 = ""] = (value || "").split(",")
        return (
          <div className="flex items-center gap-1 font-semibold">
            <input
              type="date"
              value={d1}
              onChange={(e) => onChange(`${e.target.value},${d2}`)}
              className="h-8 rounded-full border border-border/40 px-3 text-[10px] focus:outline-none focus:border-primary bg-background"
            />
            <span>và</span>
            <input
              type="date"
              value={d2}
              onChange={(e) => onChange(`${d1},${e.target.value}`)}
              className="h-8 rounded-full border border-border/40 px-3 text-[10px] focus:outline-none focus:border-primary bg-background"
            />
          </div>
        )
      }
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background"
        />
      )
    }

    return null
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Gantt Header Tools */}
        <div className="flex flex-col gap-4 bg-background p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-3">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Dòng thời gian dự án</h4>
                <p className="text-xs text-muted-foreground">
                  Từ {format(timelineStart, "dd/MM/yyyy")} đến {format(addDays(timelineStart, timelineDays.length - 1), "dd/MM/yyyy")}
                </p>
              </div>
            </div>

            {/* Top View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetTimelineToProjectStart()}
                className="rounded-full text-xs"
              >
                Về ngày bắt đầu dự án
              </Button>
              <div className="flex items-center bg-secondary rounded-full p-0.5 border border-border/40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => shiftTimeline(-7)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs font-semibold px-2">Di chuyển</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => shiftTimeline(7)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Filters Link Toggle */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              {isFiltersExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Bộ lọc
            </button>
          </div>

          {/* Collapsible Filters Box */}
          {isFiltersExpanded && (
            <div className="bg-muted/10 p-4 rounded-xl border border-border/40 text-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Active filters list */}
                <div className="space-y-3 flex-1">
                  {activeFilterKeys.map((key) => {
                    const filter = filterStates[key]
                    if (!filter) return null
                    
                    return (
                      <div key={key} className="flex flex-wrap items-center gap-2 md:gap-4 py-1">
                        {/* Checkbox & Label */}
                        <label className="flex items-center gap-2 cursor-pointer select-none font-semibold min-w-[120px]">
                          <input 
                            type="checkbox" 
                            checked={filter.enabled} 
                            onChange={(e) => {
                              setFilterStates(prev => ({
                                ...prev,
                                [key]: { ...prev[key], enabled: e.target.checked }
                              }))
                            }} 
                            className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                          />
                          <span>{filterDefinitions[key as keyof typeof filterDefinitions]?.label || key}</span>
                        </label>

                        {/* Operator Select */}
                        <select
                          value={filter.operator}
                          onChange={(e) => {
                            const op = e.target.value
                            let val = filter.value
                            const def = filterDefinitions[key as keyof typeof filterDefinitions]
                            
                            // Initialize default value when changing operators if needed
                            if (def) {
                              if (def.type === "employee" && (op === "là" || op === "không là") && !val) {
                                val = assignees[0]?.id || ""
                              } else if (key === "status" && (op === "là" || op === "không là") && !val) {
                                val = "todo"
                              } else if (def.type === "progress" && !val) {
                                val = "50"
                              } else if (def.type === "number" && !val) {
                                val = "0"
                              }
                            }

                            setFilterStates(prev => ({
                              ...prev,
                              [key]: { ...prev[key], operator: op, value: val }
                            }))
                          }}
                          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
                        >
                          {/* Render operators based on type */}
                          {(() => {
                            const def = filterDefinitions[key as keyof typeof filterDefinitions]
                            if (!def) return <option value="is">là</option>

                            if (key === "status") {
                              return (
                                <>
                                  <option value="open">mở</option>
                                  <option value="đóng">đóng</option>
                                  <option value="tất cả">tất cả</option>
                                  <option value="là">là</option>
                                  <option value="không là">không là</option>
                                </>
                              )
                            }
                            if (key === "tracker" || key === "priority") {
                              return (
                                <>
                                  <option value="is">là</option>
                                  <option value="is_not">không là</option>
                                </>
                              )
                            }
                            if (def.type === "employee") {
                              return (
                                <>
                                  <option value="là">là</option>
                                  <option value="không là">không là</option>
                                  <option value="tôi">tôi</option>
                                  <option value="none">không phân công</option>
                                </>
                              )
                            }
                            if (def.type === "text") {
                              return (
                                <>
                                  <option value="chứa">chứa</option>
                                  <option value="không chứa">không chứa</option>
                                  <option value="bắt đầu bằng">bắt đầu bằng</option>
                                  <option value="kết thúc bằng">kết thúc bằng</option>
                                  <option value="none">rỗng</option>
                                  <option value="any">không rỗng</option>
                                </>
                              )
                            }
                            if (def.type === "number" || def.type === "progress") {
                              return (
                                <>
                                  <option value="=">=</option>
                                  <option value=">=">&gt;=</option>
                                  <option value="<=">&lt;=</option>
                                  <option value="none">rỗng</option>
                                  <option value="any">không rỗng</option>
                                </>
                              )
                            }
                            if (def.type === "date") {
                              return (
                                <>
                                  <option value="any">bất kỳ lúc nào</option>
                                  <option value="today">hôm nay</option>
                                  <option value="yesterday">hôm qua</option>
                                  <option value="in_days">trong vòng</option>
                                  <option value="more_than_days">hơn</option>
                                  <option value="between">giữa</option>
                                  <option value="after">sau</option>
                                  <option value="before">trước</option>
                                </>
                              )
                            }
                            if (def.type === "relation") {
                              return (
                                <>
                                  <option value="any">có</option>
                                  <option value="none">không</option>
                                </>
                              )
                            }
                            return <option value="is">là</option>
                          })()}
                        </select>

                        {/* Value Select (Conditional) */}
                        {renderValueSelector(key, filter.operator, filter.value, (val) => {
                          setFilterStates(prev => ({
                            ...prev,
                            [key]: { ...prev[key], value: val }
                          }))
                        })}

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setActiveFilterKeys(prev => prev.filter(k => k !== key))
                          }}
                          className="text-muted-foreground hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-muted shrink-0 ml-2"
                          title="Xóa bộ lọc"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Add Filter Selector */}
                <div className="flex items-center gap-2 shrink-0 md:self-start bg-secondary/10 p-2 rounded-xl border border-dashed border-border/40">
                  <span className="font-semibold text-muted-foreground">Thêm lọc</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = e.target.value
                      if (selected && !activeFilterKeys.includes(selected)) {
                        setActiveFilterKeys(prev => [...prev, selected])
                        setFilterStates(prev => ({
                          ...prev,
                          [selected]: {
                            enabled: true,
                            operator: getDefaultOperator(selected),
                            value: getDefaultValue(selected)
                          }
                        }))
                      }
                    }}
                    className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer min-w-[140px]"
                  >
                    <option value="" disabled>-- Chọn --</option>
                    {/* Flat filters (with no group) */}
                    {Object.entries(filterDefinitions)
                      .filter(([k, def]) => !def.group && !activeFilterKeys.includes(k))
                      .map(([k, def]) => (
                        <option key={k} value={k}>{def.label}</option>
                      ))
                    }
                    {/* Grouped filters */}
                    {Array.from(new Set(Object.values(filterDefinitions).map(d => d.group).filter(Boolean))).map(group => (
                      <optgroup key={group} label={group}>
                        {Object.entries(filterDefinitions)
                          .filter(([k, def]) => def.group === group && !activeFilterKeys.includes(k))
                          .map(([k, def]) => (
                            <option key={k} value={k}>
                              {def.label}
                            </option>
                          ))
                        }
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Options Link Toggle */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              {isOptionsExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Tùy chọn
            </button>
          </div>

          {/* Collapsible Options Box */}
          {isOptionsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/10 p-4 rounded-xl border border-border/40 text-xs">
              {/* Display Columns */}
              <div className="space-y-2">
                <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
                  Cột hiển thị
                </h5>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showEstTime} 
                      onChange={(e) => setShowEstTime(e.target.checked)} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Ước lượng thời gian & log time (Est)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showAssignee} 
                      onChange={(e) => setShowAssignee(e.target.checked)} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Người thực hiện nhiệm vụ (Assignee)</span>
                  </label>
                </div>
              </div>

              {/* HR Leave Relations */}
              <div className="space-y-2">
                <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
                  Liên quan
                </h5>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showLeaves} 
                      onChange={(e) => setShowLeaves(e.target.checked)} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Hiển thị ngày nghỉ phép nhân sự (HR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showConflicts} 
                      onChange={(e) => setShowConflicts(e.target.checked)} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Cảnh báo xung đột trùng lịch nghỉ phép ⚠️</span>
                  </label>
                </div>
              </div>

              {/* Progress Settings */}
              <div className="space-y-2">
                <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
                  Tiến độ
                </h5>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showProgress} 
                      onChange={(e) => setShowProgress(e.target.checked)} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Hiển thị nhãn tiến độ dòng thời gian</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Filter Controls & Zoom Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs pt-1 border-t border-border/5">
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="number" 
                value={monthsInput} 
                onChange={(e) => setMonthsInput(e.target.value)} 
                className="w-12 h-8 rounded-md border border-border/40 px-2 text-center text-xs font-semibold focus:outline-none focus:border-primary bg-background"
                min="1"
                max="12"
              />
              <span className="text-muted-foreground font-medium">tháng từ</span>
              <select 
                value={monthInput} 
                onChange={(e) => setMonthInput(parseInt(e.target.value))} 
                className="h-8 rounded-md border border-border/40 px-2 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
              >
                <option value={0}>Tháng một</option>
                <option value={1}>Tháng hai</option>
                <option value={2}>Tháng ba</option>
                <option value={3}>Tháng tư</option>
                <option value={4}>Tháng năm</option>
                <option value={5}>Tháng sáu</option>
                <option value={6}>Tháng bảy</option>
                <option value={7}>Tháng tám</option>
                <option value={8}>Tháng chín</option>
                <option value={9}>Tháng mười</option>
                <option value={10}>Tháng mười một</option>
                <option value={11}>Tháng mười hai</option>
              </select>
              <select 
                value={yearInput} 
                onChange={(e) => setYearInput(parseInt(e.target.value))} 
                className="h-8 rounded-md border border-border/40 px-2 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>

              <Button 
                onClick={handleApplyFilters} 
                className="h-8 px-3 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                Áp dụng
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters} 
                className="h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Xóa
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSaveQuery} 
                className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-dashed border-border/40"
              >
                <Save className="size-3.5" />
                Save truy vấn riêng
              </Button>
            </div>

            {/* Right Zoom and Quick Navigate Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 border-r border-border/40 pr-4">
                <button 
                  onClick={handleZoomIn} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Phóng to ngày"
                >
                  <ZoomIn className="size-3.5" />
                  <span>Phóng to</span>
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button 
                  onClick={handleZoomOut} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Thu nhỏ ngày"
                >
                  <ZoomOut className="size-3.5" />
                  <span>Thu nhỏ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => shiftTimelineByMonth(-1)} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-normal flex items-center gap-0.5"
                >
                  <ChevronLeft className="size-3.5" />
                  {getMonthOffsetLabel(-1)}
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button 
                  onClick={() => shiftTimelineByMonth(1)} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-normal flex items-center gap-0.5"
                >
                  {getMonthOffsetLabel(1)}
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-sky-500" />
            <span>Mới / Đang làm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-indigo-500" />
            <span>Chờ đánh giá</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-emerald-500" />
            <span>Đã hoàn thành</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-amber-500" />
            <span>Yêu cầu sửa đổi (Mở lại)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-rose-600 animate-pulse" />
            <span>Trễ hạn (Overdue)</span>
          </div>
          {showLeaves && (
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.1)_0px,rgba(239,68,68,0.1)_2px,transparent_2px,transparent_8px)] border border-rose-500/20" />
              <span>Ngày nghỉ phép (HR)</span>
            </div>
          )}
          {showConflicts && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <span>Xung đột nghỉ phép</span>
            </div>
          )}
        </div>

        {/* Main Gantt Grid Container */}
        <div className="rounded-xl border border-border/40 shadow-sm overflow-hidden bg-background">
          <div className="grid grid-cols-12 min-w-[900px] divide-x divide-border/40">
            
            {/* Left Panel: Task & Assignee Details (Col span: 4) */}
            <div className="col-span-4 flex flex-col bg-muted/10">
              {/* Header */}
              <div className="h-12 border-b border-border/40 flex items-center px-4 bg-muted/20">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Công việc & Nhân sự
                </span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/40">
                {treeTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Chưa có công việc nào khớp với bộ lọc
                  </div>
                ) : (
                  treeTasks.map((task: any) => (
                    <div key={task.id} className="h-16 flex items-center justify-between px-4 hover:bg-muted/5 transition-colors">
                      <div 
                        className="flex flex-col min-w-0 pr-2"
                        style={{ paddingLeft: `${task.depth * 16}px` }}
                      >
                        <div className="flex items-center text-[11px] font-normal text-foreground">
                          {task.depth > 0 && (
                            <span className="text-muted-foreground/45 font-mono select-none mr-1.5 shrink-0">
                              └─
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedTaskForReview(task)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-normal shrink-0 mr-1"
                          >
                            {task.tracker ? task.tracker.charAt(0).toUpperCase() + task.tracker.slice(1) : "Task"} #{task.id.slice(-5)}
                          </button>
                          <span className="truncate text-foreground" title={task.title}>
                            :{" "}
                            <Link
                              to={`/project/tasks/${task.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer text-foreground"
                            >
                              {task.title}
                            </Link>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 pl-2">
                          {task.estimatedTime && showEstTime ? (
                            <div className="flex items-center gap-1 font-normal">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>{task.spentTimes?.reduce((s: number, st: any) => s + st.hours, 0) || 0}h / {task.estimatedTime}h</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Assignee profile avatar */}
                      {showAssignee && (task.assignee ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 bg-secondary border border-border/40 py-0.5 px-2 rounded-full text-[10px] font-normal cursor-default shrink-0">
                                <User className="size-2.5 text-muted-foreground" />
                                <span className="max-w-[60px] truncate">{task.assignee.fullName.split(" ").pop()}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs rounded-xl">
                              <p className="font-semibold">{task.assignee.fullName}</p>
                              <p className="text-muted-foreground text-[10px]">{task.assignee.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic bg-secondary border border-dashed border-border/40 py-0.5 px-2 rounded-full shrink-0">
                          Chưa giao
                        </span>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Scrollable Grid Timeline (Col span: 8) */}
            <div className="col-span-8 overflow-x-auto">
              <div 
                style={{ width: `${timelineDays.length * dayWidth}px` }} 
                className="flex flex-col"
              >
                
                {/* Header: Months/Years and Days column labels */}
                <div className="flex flex-col border-b border-border/40 bg-muted/20">
                  {/* Month/Year Span Header Row */}
                  <div 
                    className="h-6 border-b border-border/20 grid divide-x divide-border/20 text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none"
                    style={{ 
                      gridTemplateColumns: monthSpans.map(s => `${s.colSpan * dayWidth}px`).join(' ') 
                    }}
                  >
                    {monthSpans.map((span, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-center h-full truncate px-1 text-center bg-muted/10"
                        title={span.label}
                      >
                        {span.label}
                      </div>
                    ))}
                  </div>

                  {/* Days column labels */}
                  <div 
                    className="h-10 grid"
                    style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)` }}
                  >
                    {timelineDays.map((day, idx) => {
                      const dayName = format(day, "EEEEE", { locale: vi })
                      const dayNum = format(day, "d")
                      const isWeekend = ["T7", "CN", "S", "Su"].includes(dayName) || day.getDay() === 0 || day.getDay() === 6
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col items-center justify-center border-r border-border/20 text-[10px] font-semibold py-0.5 h-full ${
                            isWeekend ? "bg-muted/30 text-rose-500/80" : "text-muted-foreground"
                          }`}
                          style={{ width: `${dayWidth}px` }}
                        >
                          {dayWidth >= 20 && <span>{dayName}</span>}
                          <span className={`${dayWidth < 20 ? "text-[9px]" : "text-[11px]"} font-bold`}>{dayNum}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rows: Task bars display */}
                <div className="divide-y divide-border/40 relative">
                  {treeTasks.map((task: any) => {
                    const gridStyle = getTaskGridStyle(task)
                    const conflict = getLeaveConflict(task)
                    const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()
                    
                    // Check if it was completed early
                    let isCompletedEarly = false
                    let earlyCompletionRatio = 0
                    if (task.status === "done" && task.completedAt && task.startDate && task.dueDate) {
                      const taskStart = new Date(task.startDate)
                      const taskDue = new Date(task.dueDate)
                      const taskDone = new Date(task.completedAt)
                      if (taskDone < taskDue) {
                        isCompletedEarly = true
                        const totalDays = differenceInDays(taskDue, taskStart) + 1
                        const doneDays = differenceInDays(taskDone, taskStart) + 1
                        if (totalDays > 0) {
                          earlyCompletionRatio = Math.max(0, Math.min(1, doneDays / totalDays))
                        }
                      }
                    }

                    // Style configuration based on status & timeline rules
                    let containerBg = "bg-sky-950/20 dark:bg-sky-950/60 border border-sky-500/20"
                    let progressBg = "bg-sky-500"
                    let progressVal = task.progress
                    let textColor = "text-sky-900 dark:text-sky-200"

                    if (task.status === "done") {
                      if (isCompletedEarly) {
                        // Completed early: remaining part is slate (gray/saved time), completed portion is green
                        containerBg = "bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                        progressBg = "bg-emerald-500"
                        progressVal = Math.round(earlyCompletionRatio * 100)
                        textColor = "text-slate-800 dark:text-slate-200"
                      } else {
                        // Completed on time / late: entire bar is green
                        containerBg = "bg-emerald-500 border border-emerald-600/30"
                        progressBg = "bg-emerald-500"
                        progressVal = 100
                        textColor = "text-white"
                      }
                    } else if (task.status === "in_review") {
                      containerBg = "bg-indigo-950/20 dark:bg-indigo-950/60 border border-indigo-500/20"
                      progressBg = "bg-indigo-500 animate-pulse"
                      textColor = "text-indigo-900 dark:text-indigo-200"
                    } else if (task.status === "reopened") {
                      containerBg = "bg-amber-950/20 dark:bg-amber-950/60 border border-amber-500/20"
                      progressBg = "bg-amber-500"
                      textColor = "text-amber-900 dark:text-amber-200"
                    } else if (isOverdue) {
                      // Overdue: completed part is green, remaining part is red
                      containerBg = "bg-rose-600 border border-rose-700/30"
                      progressBg = "bg-emerald-500"
                      textColor = "text-white"
                    }

                    return (
                      <div 
                        key={task.id} 
                        className="h-16 relative grid items-center border-b border-border/40 hover:bg-muted/5 transition-colors"
                        style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)` }}
                      >
                        
                        {/* Vùng mờ nghỉ phép (Leave shadow zones) for this employee under the timeline */}
                        {showLeaves && task.assigneeId && timelineDays.map((day, idx) => {
                          const onLeave = isEmployeeOnLeaveOnDay(task.assigneeId, day)
                          if (onLeave) {
                            return (
                              <div 
                                key={idx} 
                                style={{ gridColumnStart: idx + 1, gridColumnEnd: idx + 2 }}
                                className="h-full bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.1)_0px,rgba(239,68,68,0.1)_2px,transparent_2px,transparent_8px)] border-r border-border/10 pointer-events-none"
                                title={`${task.assignee.fullName} nghỉ phép`}
                              />
                            )
                          }
                          return null
                        })}

                        {/* Task Bar */}
                        {gridStyle ? (
                          <div 
                            style={gridStyle} 
                            className="px-1 z-10 h-full flex items-center overflow-visible relative"
                          >
                            <div className="relative w-full flex items-center overflow-visible">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className={`h-7 w-full ${containerBg} ${textColor} rounded-full px-2.5 flex items-center justify-between text-[10px] font-medium shadow-sm select-none relative overflow-hidden group cursor-pointer`}
                                      onDoubleClick={() => setSelectedTaskForReview(task)}
                                    >
                                      {/* Progress bar inside task bar */}
                                      {showProgress && (
                                        <div 
                                          className={`absolute top-0 left-0 h-full ${progressBg} transition-all duration-300`}
                                          style={{ width: `${progressVal}%` }}
                                        />
                                      )}

                                      <span className="truncate pr-1 z-10 text-[10px] font-semibold">{task.title}</span>

                                      {/* Right tools (Conflict badge, shift buttons) */}
                                      <div className="flex items-center gap-1 shrink-0 z-10">
                                        {conflict && showConflicts && (
                                          <AlertTriangle className="size-3 text-amber-300 animate-bounce" />
                                        )}
                                        {task.status === "in_review" && (
                                          <FileText className="size-3 text-white/90" />
                                        )}
                                        {task.status === "done" && (
                                          <CheckCircle2 className="size-3 text-white" />
                                        )}
                                        {isOverdue && (
                                          <Clock className="size-3 text-white animate-pulse" />
                                        )}

                                        {/* Small shift adjustments (Leader/Admin only) */}
                                        {(isLeader || isAdminOrGM) && (
                                          <div className="hidden group-hover:flex items-center gap-0.5 ml-1 bg-black/20 rounded-full p-0.5">
                                            <button 
                                              className="size-3.5 flex items-center justify-center hover:bg-black/20 rounded-full text-[9px]"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                shiftTaskDates(task, -1)
                                              }}
                                              title="Dịch sớm 1 ngày"
                                            >
                                              -
                                            </button>
                                            <button 
                                              className="size-3.5 flex items-center justify-center hover:bg-black/20 rounded-full text-[9px]"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                shiftTaskDates(task, 1)
                                              }}
                                              title="Dịch muộn 1 ngày"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs space-y-1 rounded-xl p-3 max-w-[280px]">
                                    <p className="font-bold">{task.title}</p>
                                    <p className="text-muted-foreground font-medium text-[10px]">
                                      Lịch: {task.startDate ? format(new Date(task.startDate), "dd/MM/yyyy") : "?"} - {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "?"}
                                    </p>
                                    <p className="font-medium text-[10px]">
                                      Tiến độ: {task.progress}% ({task.status === "done" && isCompletedEarly ? "hoàn thành sớm" : task.status})
                                    </p>
                                    {task.status === "done" && isCompletedEarly && task.completedAt && (
                                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                        Xong ngày: {format(new Date(task.completedAt), "dd/MM/yyyy")}
                                      </p>
                                    )}
                                    {isOverdue && (
                                      <p className="text-rose-500 font-bold text-[10px]">Cảnh báo: Đã quá hạn hoàn thành!</p>
                                    )}
                                    {conflict && (
                                      <div className="flex items-start gap-1 text-amber-500 font-semibold text-[10px] mt-1 pt-1 border-t border-border/40">
                                        <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                                        <span>Trùng lịch nghỉ của {task.assignee?.fullName}: {conflict}</span>
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Status and Progress label next to the bar */}
                              {showProgress && (
                                <span 
                                  className={`absolute left-full ml-2 text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none ${
                                    task.status === "done"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : task.status === "in_review"
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : task.status === "reopened"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : isOverdue
                                      ? "text-rose-600 dark:text-rose-400 animate-pulse"
                                      : "text-sky-600 dark:text-sky-400"
                                  }`}
                                >
                                  {task.status === "done" ? (
                                    isCompletedEarly ? "Hoàn thành sớm" : "Hoàn thành 100%"
                                  ) : task.status === "in_review" ? (
                                    `Đợi duyệt ${task.progress}%`
                                  ) : task.status === "reopened" ? (
                                    `Mở lại ${task.progress}%`
                                  ) : isOverdue ? (
                                    `Quá hạn ${task.progress}%`
                                  ) : (
                                    `Đang làm ${task.progress}%`
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          // If task dates are not inside current timeline viewport
                          <div className="absolute left-4 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            Ngoài khoảng dòng thời gian hiển thị
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sidebar for Quick Queries */}
      {!isSidebarExpanded && (
        <button
          onClick={() => setIsSidebarExpanded(true)}
          className="p-2.5 border border-border/40 bg-background rounded-full shadow-sm hover:bg-muted transition-colors shrink-0 font-bold text-xs flex items-center justify-center hover:scale-102"
          title="Mở rộng truy vấn riêng"
        >
          «
        </button>
      )}

      {/* Expanded Sidebar */}
      {isSidebarExpanded && (
        <div className="w-56 shrink-0 bg-background p-4 rounded-xl border border-border/40 shadow-sm space-y-4 relative transition-all duration-200">
          <button
            onClick={() => setIsSidebarExpanded(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs font-bold"
            title="Thu nhỏ truy vấn riêng"
          >
            »
          </button>
          
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-2">
            Truy vấn riêng
          </h4>
          
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => handleQuickQuery("assigned_to_me")}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Issues assigned to me
              </button>
            </li>
            <li>
              <button
                onClick={() => handleQuickQuery("reported_issues")}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Reported issues
              </button>
            </li>
            <li>
              <button
                onClick={() => handleQuickQuery("updated_issues")}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Updated issues
              </button>
            </li>
            <li>
              <button
                onClick={() => handleQuickQuery("watched_issues")}
                className="text-rose-600 dark:text-rose-400 hover:underline text-left font-medium block w-full"
              >
                Watched issues
              </button>
            </li>

            {savedQueries && savedQueries.length > 0 && (
              <>
                <li className="border-t border-border/10 my-2 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold select-none">
                  Truy vấn đã lưu
                </li>
                {savedQueries.map((q: any) => (
                  <li key={q.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => applySavedQuery(q)}
                      className="text-sky-600 dark:text-sky-400 hover:underline text-left font-medium block truncate max-w-[150px]"
                      title={q.name}
                    >
                      {q.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Bạn chắc chắn muốn xóa truy vấn "${q.name}"?`)) {
                          deleteQueryMutation.mutate(q.id)
                        }
                      }}
                      className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0"
                      title="Xóa truy vấn này"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}

      {/* Review & Deliverable submission Modal */}
      {selectedTaskForReview && (
        <TaskReviewModal
          isOpen={!!selectedTaskForReview}
          onOpenChange={(open) => {
            if (!open) setSelectedTaskForReview(null)
          }}
          task={selectedTaskForReview}
          projectId={projectId}
          isLeader={isLeader}
          isAdminOrGM={isAdminOrGM}
        />
      )}
    </div>
  )
}

