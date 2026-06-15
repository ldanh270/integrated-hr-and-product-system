// Import layout card structures and visual status display pills
import { PageCard, StatusPill } from "@/components/common"
// Import custom UI badge and button elements
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// Import custom UI Dialog layouts
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// Import custom UI dropdown-menu layouts
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Import custom UI form inputs and label components
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Import custom UI select controls
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Import Skeleton screen layout placeholder
import { Skeleton } from "@/components/ui/skeleton"
// Import custom UI tables
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// Import custom tabs selectors
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
// Import project domain entity configurations lists
import {
  PROJECT_STATUSES,
  TASK_CREATION_POLICIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TRACKERS,
} from "@/config/entities/project.config"
// Import employee roles definitions
import { ROLE } from "@/config/entities/employee.config"
// Import tracker type specifications
import type { TaskTracker, TaskPriority, TaskStatus } from "@/types/task.types"
// Import API endpoint wrappers
import { employeeApi } from "@/lib/api/employee.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { taskCategoryApi } from "@/lib/api/task-category.api"
// Import authorization store
import { useAuthStore } from "@/store/auth-store"
// Import TanStack Query hooks for querying and mutating server data
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// Import Lucide icons
import {
  Activity,
  AlertCircle,
  Clock,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Tag,
  Trash,
  UserPlus,
  Users,
} from "lucide-react"
// Import React hooks
import { useState, useEffect } from "react"
// Import routing hooks for route values, search queries, and navigate callbacks
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom"
// Import Toast notifications provider
import { toast } from "sonner"

// Main React component to render project details dashboard
export default function ProjectDetail() {
  // Extract active project ID from routing params
  const { id } = useParams<{ id: string }>()
  const projectId = id || ""
  
  // Initialize query client, navigator, search query parameters, and auth state store
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const openCreateParam = searchParams.get("createTask") === "true"
  const { user } = useAuthStore()

  // Active Tab State: holds the name of the currently selected tab
  const [activeTab, setActiveTab] = useState("overview")

  // Filter & Pagination States: variables used to filter and paginate tasks in the Issues tab
  const [issueSearch, setIssueSearch] = useState("") // Search keyword
  const [trackerFilter, setTrackerFilter] = useState<string>("all") // Tracker type filter
  const [statusFilter, setStatusFilter] = useState<string>("all") // Task status filter
  const [priorityFilter, setPriorityFilter] = useState<string>("all") // Task priority filter
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all") // Task assignee ID filter
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>("all") // Task category ID filter
  const [createdByIdFilter, setCreatedByIdFilter] = useState<string>("all") // Task creator ID filter
  const [sortBy, setSortBy] = useState<string>("createdAt") // Sorting field parameter
  const [sortOrder, setSortOrder] = useState<string>("desc") // Sorting order parameter
  const [currentPage, setCurrentPage] = useState(1) // Active page number index
  const [pageSize, setPageSize] = useState(25) // Page size limit count

  // Category management States: fields to manage project tags/categories create/update modal
  const [isOpenCreateCategoryModal, setIsOpenCreateCategoryModal] = useState(false) // Category modal visibility
  const [newCategoryName, setNewCategoryName] = useState("") // Title input for category creation
  const [categoryError, setCategoryError] = useState<string | null>(null) // Category errors warning message
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null) // Category ID currently being modified
  const [editCategoryName, setEditCategoryName] = useState("") // Edited title input

  // Side-effect hook: automatically resets current page index back to 1 when filters are updated
  useEffect(() => {
    setCurrentPage(1)
  }, [
    issueSearch,
    trackerFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    categoryIdFilter,
    createdByIdFilter,
  ])

  // Modals Visibility States: handles backdrop dialog overlay overlays
  const [isOpenMemberModal, setIsOpenMemberModal] = useState(false) // Add project member dialog
  const [isOpenEditProjectModal, setIsOpenEditProjectModal] = useState(false) // Edit project dialog

  // Add Member Form States: holds details for adding a member
  const [memberEmployeeId, setMemberEmployeeId] = useState("none") // Member employee identifier
  const [memberError, setMemberError] = useState<string | null>(null) // Member error message

  // Edit Project Settings Form States: binds inputs for updating project configs
  const [editProjectName, setEditProjectName] = useState("") // Project name input
  const [editProjectDesc, setEditProjectDesc] = useState("") // Project description input
  const [editProjectStatus, setEditProjectStatus] = useState("") // Status select input
  const [editProjectPolicy, setEditProjectPolicy] = useState("") // Task creation policy select input
  const [editProjectLeader, setEditProjectLeader] = useState("none") // Team leader select input
  const [editProjectStart, setEditProjectStart] = useState("") // Start date input
  const [editProjectEnd, setEditProjectEnd] = useState("") // Expected end date input
  const [editProjectError, setEditProjectError] = useState<string | null>(null) // Project update errors banner

  // Query hook: fetches metadata properties of the active project entity
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  // Query hook: fetches all tasks under project without pagination (for overview statistics mapping)
  const { data: overviewTasksData } = useQuery({
    queryKey: ["tasks", "overview", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!projectId,
  })

  // Query hook: fetches paginated, filtered lists of tasks for display in Issues tab
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
      categoryIdFilter,
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
        tracker: trackerFilter === "all" ? undefined : (trackerFilter as TaskTracker),
        status: statusFilter === "all" ? undefined : (statusFilter as TaskStatus),
        priority: priorityFilter === "all" ? undefined : (priorityFilter as TaskPriority),
        assigneeId: assigneeFilter === "all" ? undefined : assigneeFilter,
        categoryId: categoryIdFilter === "all" ? undefined : categoryIdFilter,
        createdById: createdByIdFilter === "all" ? undefined : createdByIdFilter,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      }),
    enabled: !!projectId,
  })

  // Query hook: fetches project categories to populate category selection selects
  const { data: categories } = useQuery({
    queryKey: ["project-categories", projectId],
    queryFn: () => taskCategoryApi.list(projectId),
    enabled: !!projectId,
  })

  // Query hook: fetches spent time records logs list
  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", "project", projectId],
    queryFn: () => taskApi.listSpentTimes({ projectId }),
    enabled: !!projectId,
  })

  // Query hook: fetches members currently assigned to the project
  const { data: members } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  // Query hook: fetches all active employees database (manager settings use cases)
  const { data: allEmployeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeApi.list({ limit: 200 }),
    enabled: true,
  })

  // Safely extract lists arrays, fallback to empty arrays on undefined responses
  const tasks = tasksData?.data || []
  const allEmployees = allEmployeesData?.data || []

  // Check roles/permissions to verify access levels
  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = user?.role === ROLE.ADMIN || user?.role === ROLE.GENERAL_MANAGER
  const isProjectMember = members?.some((m) => m.employeeId === user?.id) || isLeader

  // Enforce task creation policy based on user roles and project configuration settings
  // policy: leader_only (restricted to TL/Admin/GM) or all_members (any member can create tasks)
  const canCreateTask =
    isAdminOrGM ||
    isLeader ||
    (isProjectMember && project?.taskCreationPolicy === "all_members")

  // Auto-redirect to task creation screen if search parameter 'createTask' is present and user has permission
  useEffect(() => {
    if (openCreateParam && canCreateTask) {
      navigate(`/project/${projectId}/tasks/new`, { replace: true })
    }
  }, [openCreateParam, canCreateTask, projectId, navigate])

  // Determine if the current user is allowed to manage project members (TL/Admin/GM only)
  const canManageMembers = isAdminOrGM || isLeader

  // Calculate statistics for the Overview Tab using all fetched tasks
  const overviewTasks = overviewTasksData?.data || []
  const openTasksCount = overviewTasks.filter((t) => ["todo", "in_progress", "in_review", "reopened"].includes(t.status)).length
  const closedTasksCount = overviewTasks.filter((t) => ["done", "cancelled"].includes(t.status)).length
  const totalTasksCount = overviewTasks.length

  // Calculate task counts and statuses grouped by tracker types (e.g. bug, feature)
  const trackerStats = TASK_TRACKERS.reduce((acc, tr) => {
    const trTasks = overviewTasks.filter((t) => t.tracker === tr)
    const open = trTasks.filter((t) => ["todo", "in_progress", "in_review", "reopened"].includes(t.status)).length
    const closed = trTasks.filter((t) => ["done", "cancelled"].includes(t.status)).length
    acc.set(tr, { open, closed, total: trTasks.length })
    return acc;
  }, new Map<string, { open: number; closed: number; total: number }>())

  // Compute total estimated time and actual spent time hours for the project
  const totalEstimatedHours = overviewTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0)
  const totalSpentHours = spentTimes?.reduce((sum, st) => sum + st.hours, 0) || 0

  // Category CRUD mutations: Create new task category under this project
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return taskCategoryApi.create(projectId, { name })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-categories", projectId] })
      setNewCategoryName("")
      setCategoryError(null)
      toast.success("Thêm chủ đề dự án thành công")
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setCategoryError(errorMessage)
    },
  })

  // Category CRUD mutations: Update existing category properties
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return taskCategoryApi.update(projectId, id, { name })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-categories", projectId] })
      setEditingCategoryId(null)
      setEditCategoryName("")
      setCategoryError(null)
      toast.success("Cập nhật chủ đề dự án thành công")
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setCategoryError(errorMessage)
    },
  })

  // Category CRUD mutations: Delete category by ID
  const deleteCategoryMutation = useMutation({
    mutationFn: async (catId: string) => {
      return taskCategoryApi.delete(projectId, catId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-categories", projectId] })
      setCategoryError(null)
      toast.success("Xóa chủ đề dự án thành công")
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setCategoryError(errorMessage)
    },
  })

  // Add Member mutation: Add selected employee to project members list
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (memberEmployeeId === "none") throw new Error("Vui lòng chọn nhân viên")
      return projectApi.addMember(projectId, memberEmployeeId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      setIsOpenMemberModal(false)
      setMemberEmployeeId("none")
      setMemberError(null)
      toast.success("Thêm thành viên vào dự án thành công")
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setMemberError(errorMessage)
    },
  })

  // Edit Project handlers: Open and populate edit details dialog
  const handleOpenEditProject = () => {
    if (!project) return
    setEditProjectName(project.name)
    setEditProjectDesc(project.description || "")
    setEditProjectStatus(project.status)
    setEditProjectPolicy(project.taskCreationPolicy)
    setEditProjectLeader(project.teamLeaderId || "none")
    setEditProjectStart(project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "")
    setEditProjectEnd(project.expectedEndDate ? new Date(project.expectedEndDate).toISOString().split("T")[0] : "")
    setEditProjectError(null)
    setIsOpenEditProjectModal(true)
  }

  // Update Project configuration settings mutation
  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!editProjectName.trim()) throw new Error("Vui lòng nhập tên dự án")
      return projectApi.update(projectId, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim() || null,
        status: editProjectStatus as (typeof PROJECT_STATUSES)[number],
        taskCreationPolicy: editProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        teamLeaderId: editProjectLeader === "none" ? null : editProjectLeader,
        startDate: editProjectStart || null,
        expectedEndDate: editProjectEnd || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsOpenEditProjectModal(false)
      setEditProjectError(null)
      toast.success("Cập nhật thông tin dự án thành công")
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setEditProjectError(errorMessage)
    },
  })

  // Quick Status update mutation for task rows in table list views
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return taskApi.update(taskId, { status: status as TaskStatus })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      toast.success("Cập nhật trạng thái công việc thành công")
    },
  })

  // Delete project member relationship from team membership list
  const removeMemberMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return projectApi.removeMember(projectId, employeeId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      toast.success("Đã xóa thành viên khỏi dự án")
    },
  })

  // Loading state placeholder view using Skeleton structure panels
  if (isLoadingProject) {
    return (
      <div className="container p-8 space-y-6">
        <Skeleton className="h-14 w-1/3 rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-xl" />
          <Skeleton className="h-64 col-span-1 rounded-xl" />
        </div>
      </div>
    )
  }

  // Error feedback view if the target project record is not found in database
  if (!project) {
    return (
      <div className="container p-8 text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Không tìm thấy dự án</h3>
        <p className="text-sm text-muted-foreground">Dự án không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button asChild className="rounded-full">
          <Link to="/project/list">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  // Activity list builder: combine spent time logs and task updates (mocking recent task updates based on createdAt/updatedAt)
  const activitiesList: Array<{
    id: string
    type: "spent_time" | "task"
    user: string
    text: string
    date: Date
    comment?: string | null
    hours?: number
  }> = []

  // Add recorded spent time sessions to activities log array
  spentTimes?.forEach((st) => {
    activitiesList.push({
      id: st.id,
      type: "spent_time",
      user: st.employee?.fullName || "Thành viên",
      text: `đã ghi nhận ${st.hours} giờ (${st.activity}) vào công việc`,
      date: new Date(st.createdAt),
      comment: st.comment,
      hours: st.hours,
    })
  })

  // Add newly created task events to activities log array
  overviewTasks.forEach((t) => {
    activitiesList.push({
      id: `task-create-${t.id}`,
      type: "task",
      user: t.createdBy?.fullName || "Thành viên",
      text: `đã tạo công việc mới [${t.tracker}] "${t.title}"`,
      date: new Date(t.createdAt),
    })
  })

  // Sort consolidated activity records chronological from most recent to oldest
  activitiesList.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Pagination range parameters and total metrics calculations
  const totalItems = tasksData?.meta.total || 0
  const totalPages = tasksData?.meta.totalPages || 1
  const startRange = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRange = Math.min(currentPage * pageSize, totalItems)

  // Determine which page numbers to render in pagination controls layout (supporting ellipsis truncation)
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

  // Helper function to map task status values to localized Vietnamese titles
  const formatStatus = (status: string) => {
    if (status === "todo") return "Đang mở"
    if (status === "in_progress") return "Đang làm"
    if (status === "in_review") return "Đánh giá"
    if (status === "done") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    if (status === "reopened") return "Mở lại"
    return status
  }

  // Helper function to map status values to semantic visual color themes/variants
  const getStatusVariant = (status: string) => {
    if (status === "done") return "success"
    if (status === "in_progress") return "warning"
    if (status === "in_review") return "info"
    if (status === "cancelled") return "danger"
    if (status === "reopened") return "info"
    return "neutral"
  }

  return (
    <div className="container p-8 space-y-6">
      {/* Top Header Section displaying project title and detail summary info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Dự án chi tiết
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-0.5">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-[600px]">{project.description}</p>
          )}
        </div>

        {/* Global project settings and creation actions row buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreateTask && (
            <Button
              onClick={() => { navigate(`/project/${projectId}/tasks/new`); }}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 text-xs px-4"
            >
              <Plus className="size-4" />
              Công việc mới
            </Button>
          )}

          {canManageMembers && (
            <>
              <Button
                variant="outline"
                onClick={() => { setIsOpenCreateCategoryModal(true); }}
                className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-10 text-xs px-4"
              >
                <Tag className="size-4" />
                Quản lý chủ đề
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenEditProject}
                className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-10 text-xs px-4"
              >
                <Settings className="size-4" />
                Chỉnh sửa dự án
              </Button>
              {/* Dialog button trigger to add new project members */}
              <Button
                variant="outline"
                onClick={() => { setIsOpenMemberModal(true); }}
                className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-10 text-xs px-4"
              >
                <UserPlus className="size-4" />
                Thêm thành viên
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs navigation panel: switches between Overview, Issues, and Activity views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary rounded-full p-1 border border-border/40 inline-flex">
          <TabsTrigger value="overview" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Tổng quan (Overview)
          </TabsTrigger>
          <TabsTrigger value="issues" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Công việc (Issues)
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Hoạt động (Activity)
          </TabsTrigger>
        </TabsList>

        {/* -------------------- OVERVIEW TAB -------------------- */}
        <TabsContent value="overview" className="grid grid-cols-12 gap-6 outline-none">
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
                      <TableHead className="font-semibold text-xs text-center w-24">Đang mở (Open)</TableHead>
                      <TableHead className="font-semibold text-xs text-center w-24">Đã đóng (Closed)</TableHead>
                      <TableHead className="font-semibold text-xs text-right w-24">Tổng cộng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Render status totals for each task tracker type */}
                    {TASK_TRACKERS.map((tr) => {
                      const stat = trackerStats.get(tr) || { open: 0, closed: 0, total: 0 }
                      if (stat.total === 0) return null; // Skip showing trackers that contain no tasks
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
                  Thành viên ({members?.length || 0})
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
                    {members && members.length > 0 ? (
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
                              {member.employee?.email || ""}
                            </div>
                          </div>

                          {/* Render delete button to remove user from project team if authorized */}
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer"
                              onClick={() => { removeMemberMutation.mutate(member.employeeId); }}
                            >
                              Xóa
                            </Button>
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
        </TabsContent>

        {/* -------------------- ISSUES TAB -------------------- */}
        <TabsContent value="issues" className="outline-none">
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
                  {/* Tracker Filter dropdown list */}
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tracker:</Label>
                    <Select value={trackerFilter} onValueChange={setTrackerFilter}>
                      <SelectTrigger className="w-24 h-9 border-border rounded-full text-xs bg-background">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {TASK_TRACKERS.map((tr) => (
                          <SelectItem key={tr} value={tr}>{tr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter dropdown select menu */}
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {TASK_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>{formatStatus(st)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Filter dropdown options */}
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Độ ưu tiên:</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {TASK_PRIORITIES.map((pr) => (
                          <SelectItem key={pr} value={pr}>{pr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee Filter dropdown selection */}
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Người thực hiện:</Label>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger className="w-32 h-9 border-border rounded-full text-xs bg-background">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {project.teamLeader && (
                          <SelectItem value={project.teamLeader.id}>
                            {project.teamLeader.fullName} (TL)
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

                  {/* Category categorization Filter select */}
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chủ đề:</Label>
                    <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
                      <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PageCard>

              {/* Issues table card */}
              <PageCard className="p-6">
                {isLoadingTasks ? (
                  // Show Skeleton placeholder rows while tasks list is loading
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-full" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : tasks.length === 0 ? (
                  // Show empty state placeholder if no tasks match selected filters
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-secondary p-3 mb-4 text-muted-foreground">
                      <AlertCircle className="size-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Không tìm thấy công việc nào</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Hãy thiết lập bộ lọc khác hoặc tạo công việc mới.</p>
                  </div>
                ) : (
                  <>
                    {/* Render tasks list in a responsive table layout */}
                    <div className="relative overflow-x-auto rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent h-10">
                            <TableHead className="w-16 font-semibold text-xs">ID</TableHead>
                            <TableHead className="w-24 font-semibold text-xs">Tracker</TableHead>
                            <TableHead className="font-semibold text-xs">Tiêu đề</TableHead>
                            <TableHead className="w-28 font-semibold text-xs">Chủ đề</TableHead>
                            <TableHead className="w-28 font-semibold text-xs">Người thực hiện</TableHead>
                            <TableHead className="w-28 font-semibold text-xs">Trạng thái</TableHead>
                            <TableHead className="w-24 font-semibold text-xs">Độ ưu tiên</TableHead>
                            <TableHead className="w-16 text-right font-semibold text-xs">%</TableHead>
                            <TableHead className="w-10 font-semibold text-xs"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task) => {
                            // Assign styling tokens according to priority values
                            let priorityColor = "bg-secondary text-secondary-foreground"
                            if (task.priority === "urgent") priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
                            else if (task.priority === "high") priorityColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
                            else if (task.priority === "medium") priorityColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"

                            // Assign styling tokens according to tracker types
                            let trackerColor = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            if (task.tracker === "bug") trackerColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            else if (task.tracker === "feature") trackerColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            else if (task.tracker === "support") trackerColor = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"

                            return (
                              <TableRow key={task.id} className="h-14 hover:bg-muted/30">
                                {/* Shortened database ID */}
                                <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">
                                  #{task.id.substring(0, 5)}
                                </TableCell>
                                {/* Tracker type badge */}
                                <TableCell>
                                  <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${trackerColor}`}>
                                    {task.tracker}
                                  </Badge>
                                </TableCell>
                                {/* Title linking to task details screen */}
                                <TableCell className="max-w-[200px] truncate font-medium">
                                  <Link to={`/project/tasks/${task.id}`} className="text-primary hover:underline flex items-center gap-1">
                                    {task.title}
                                  </Link>
                                </TableCell>
                                {/* Task category/subject tag */}
                                <TableCell className="text-xs">
                                  {task.category ? (
                                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                      {task.category.name}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground italic text-[11px]">Không có</span>
                                  )}
                                </TableCell>
                                {/* Assigned developer name */}
                                <TableCell className="text-xs">
                                  {task.assignee ? (
                                    <span className="font-semibold text-foreground">{task.assignee.fullName}</span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Không chỉ định</span>
                                  )}
                                </TableCell>
                                {/* Localization and styling status pill */}
                                <TableCell>
                                  <StatusPill label={formatStatus(task.status)} variant={getStatusVariant(task.status)} />
                                </TableCell>
                                {/* Priority badge indicator */}
                                <TableCell>
                                  <Badge variant="outline" className={`rounded-full text-[9px] ${priorityColor}`}>
                                    {task.priority}
                                  </Badge>
                                </TableCell>
                                {/* Completion progress percentage */}
                                <TableCell className="text-right font-bold text-xs">
                                  {task.progress}%
                                </TableCell>
                                {/* Actions dropdown menu containing navigation and quick status transition commands */}
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon-xs" className="rounded-full cursor-pointer">
                                        <MoreVertical className="size-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-border">
                                      <DropdownMenuItem asChild className="rounded-lg text-xs font-semibold cursor-pointer">
                                        <Link to={`/project/tasks/${task.id}`}>Xem chi tiết</Link>
                                      </DropdownMenuItem>
                                      {TASK_STATUSES.map((st) => (
                                        <DropdownMenuItem
                                          key={st}
                                          className="rounded-lg text-xs font-medium cursor-pointer"
                                          onClick={() => { updateStatusMutation.mutate({ taskId: task.id, status: st }); }}
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

                    {/* Pagination Controls toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground font-semibold">
                        Hiện tổng: {startRange}-{endRange}/{totalItems}
                      </span>

                      {/* Display page numbers only if total pages is greater than 1 */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-full p-0.5">
                          {/* Previous page pagination button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage <= 1}
                            onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); }}
                            className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                          >
                            «
                          </Button>
                          {/* Mapping active page numbers and ellipsis separators */}
                          {getPageNumbers().map((p, idx) => {
                            if (p === "...") {
                              return (
                                <span key={`ellipsis-${idx}`} className="text-xs text-muted-foreground font-semibold px-2">
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
                                onClick={() => { setCurrentPage(pageNum); }}
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
                          {/* Next page pagination button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage >= totalPages}
                            onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
                            className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                          >
                            »
                          </Button>
                        </div>
                      )}

                      {/* Page size limit count selector */}
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
                  {/* Filter by tasks assigned to active user */}
                  <button
                    onClick={() => {
                      setAssigneeFilter(user?.id || "all")
                      setCreatedByIdFilter("all")
                    }}
                    className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      assigneeFilter === user?.id && createdByIdFilter === "all"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    Phân công cho tôi
                  </button>
                  {/* Filter by tasks created by active user */}
                  <button
                    onClick={() => {
                      setCreatedByIdFilter(user?.id || "all")
                      setAssigneeFilter("all")
                    }}
                    className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      createdByIdFilter === user?.id && assigneeFilter === "all"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    Do tôi tạo
                  </button>
                  {/* Sort by recent update timestamps */}
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
                  {/* Clear all active filters and reset list back to default settings */}
                  <button
                    onClick={() => {
                      setAssigneeFilter("all")
                      setCreatedByIdFilter("all")
                      setTrackerFilter("all")
                      setStatusFilter("all")
                      setPriorityFilter("all")
                      setCategoryIdFilter("all")
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
        </TabsContent>

        {/* -------------------- ACTIVITY TAB -------------------- */}
        <TabsContent value="activity" className="space-y-4 outline-none">
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-6 border-b border-border pb-2 flex items-center gap-1.5">
              <Activity className="size-4 text-muted-foreground" />
              Nhật ký hoạt động (Recent Activity)
            </h3>

            {isLoadingSpent || isLoadingTasks ? (
              // Loading state placeholder view for activity feed
              <div className="space-y-4">
                <Skeleton className="h-10 w-1/3 rounded-full" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : activitiesList.length === 0 ? (
              // Empty feedback text if no events are recorded in log
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Không có hoạt động gần đây nào.
              </p>
            ) : (
              // Render vertical timeline tracking project events
              <div className="relative pl-6 border-l border-border space-y-6">
                {activitiesList.map((act, idx) => (
                  <div key={`${act.id}-${idx}`} className="relative">
                    {/* Circle bullet on timeline vertical axis */}
                    <div className={`absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-background ${act.type === 'spent_time' ? 'bg-primary' : 'bg-indigo-500'}`} />

                    <div className="space-y-1">
                      <div className="text-xs text-foreground">
                        <span className="font-bold">{act.user}</span> {act.text}
                        {act.type === "spent_time" && (
                          <span className="font-semibold text-primary ml-1">
                            ({act.hours} giờ)
                          </span>
                        )}
                      </div>
                      {/* Sub-comment log if present under the activity block */}
                      {act.comment && (
                        <div className="text-xs bg-muted/30 p-2.5 rounded-xl border border-border/40 max-w-[500px] text-muted-foreground italic">
                          "{act.comment}"
                        </div>
                      )}
                      {/* Timestamp of the recorded action */}
                      <div className="text-[10px] text-muted-foreground">
                        {act.date.toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageCard>
        </TabsContent>
      </Tabs>


      {/* MEMBER MODAL: Dialog overlay to add a member to the active project team */}
      <Dialog open={isOpenMemberModal} onOpenChange={setIsOpenMemberModal}>
        <DialogContent className="sm:max-w-[450px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Thêm thành viên dự án</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Chọn một nhân viên để đưa họ vào tham gia dự án này.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setMemberError(null)
              addMemberMutation.mutate()
            }}
            className="space-y-4 pt-3"
          >
            {/* Alert banner to display form verification errors */}
            {memberError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {memberError}
              </div>
            )}

            {/* Form select wrapper to select employee from list */}
            <div className="space-y-1.5">
              <Label htmlFor="memberEmp" className="text-xs font-semibold text-muted-foreground">
                Chọn nhân sự
              </Label>
              <Select value={memberEmployeeId} onValueChange={setMemberEmployeeId}>
                <SelectTrigger id="memberEmp" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue placeholder="Chọn nhân sự" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="none" className="rounded-lg">Chọn nhân viên</SelectItem>
                  {allEmployees
                    // Filter out employees who are already team members or team leader of the project
                    .filter((emp) => !members?.some((m) => m.employeeId === emp.id) && emp.id !== project.teamLeaderId)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                        {emp.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cancel and submit action buttons for member modal */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsOpenMemberModal(false); }}
                className="h-10 rounded-full px-5 text-sm"
                disabled={addMemberMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? "Đang thêm..." : "Thêm thành viên"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PROJECT DIALOG: Dialog overlay to update project config properties */}
      <Dialog open={isOpenEditProjectModal} onOpenChange={setIsOpenEditProjectModal}>
        <DialogContent className="sm:max-w-[550px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Chỉnh sửa dự án</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cập nhật thông tin và cấu hình cho dự án này.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setEditProjectError(null)
              updateProjectMutation.mutate()
            }}
            className="space-y-4 pt-3"
          >
            {/* Show update warning alerts if mutation fails */}
            {editProjectError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {editProjectError}
              </div>
            )}

            {/* Edit project name text input */}
            <div className="space-y-1.5">
              <Label htmlFor="editProjName" className="text-xs font-semibold text-muted-foreground">
                Tên dự án <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editProjName"
                value={editProjectName}
                onChange={(e) => { setEditProjectName(e.target.value); }}
                className="h-10 text-sm border-border rounded-full px-4"
                required
              />
            </div>

            {/* Edit project description text area input */}
            <div className="space-y-1.5">
              <Label htmlFor="editProjDesc" className="text-xs font-semibold text-muted-foreground">
                Mô tả dự án
              </Label>
              <Textarea
                id="editProjDesc"
                value={editProjectDesc}
                onChange={(e) => { setEditProjectDesc(e.target.value); }}
                className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Mô tả ngắn gọn về dự án..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Edit project status select field */}
              <div className="space-y-1.5">
                <Label htmlFor="editProjStatus" className="text-xs font-semibold text-muted-foreground">
                  Trạng thái
                </Label>
                <Select value={editProjectStatus} onValueChange={setEditProjectStatus}>
                  <SelectTrigger id="editProjStatus" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {PROJECT_STATUSES.map((st) => {
                      const labelsMap = new Map<string, string>([
                        ["planning", "Lên kế hoạch"],
                        ["active", "Đang hoạt động"],
                        ["on_hold", "Tạm dừng"],
                        ["completed", "Hoàn thành"],
                        ["cancelled", "Đã hủy"],
                      ])
                      return (
                        <SelectItem key={st} value={st} className="rounded-lg">
                          {labelsMap.get(st) || st}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Edit task creation policy select parameter */}
              <div className="space-y-1.5">
                <Label htmlFor="editProjPolicy" className="text-xs font-semibold text-muted-foreground">
                  Ai được tạo task?
                </Label>
                <Select value={editProjectPolicy} onValueChange={setEditProjectPolicy}>
                  <SelectTrigger id="editProjPolicy" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {TASK_CREATION_POLICIES.map((p) => (
                      <SelectItem key={p} value={p} className="rounded-lg">
                        {p === "leader_only" ? "Chỉ trưởng nhóm" : "Tất cả thành viên"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Edit project Team Leader select dropdown option */}
            <div className="space-y-1.5">
              <Label htmlFor="editProjLeader" className="text-xs font-semibold text-muted-foreground">
                Trưởng dự án (Team Leader)
              </Label>
              <Select value={editProjectLeader} onValueChange={setEditProjectLeader}>
                <SelectTrigger id="editProjLeader" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="none" className="rounded-lg">Chưa phân công</SelectItem>
                  {allEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Edit project start date datepicker input */}
              <div className="space-y-1.5">
                <Label htmlFor="editProjStart" className="text-xs font-semibold text-muted-foreground">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="editProjStart"
                  type="date"
                  value={editProjectStart}
                  onChange={(e) => { setEditProjectStart(e.target.value); }}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              {/* Edit project expected end date datepicker input */}
              <div className="space-y-1.5">
                <Label htmlFor="editProjEnd" className="text-xs font-semibold text-muted-foreground">
                  Ngày kết thúc dự kiến
                </Label>
                <Input
                  id="editProjEnd"
                  type="date"
                  value={editProjectEnd}
                  onChange={(e) => { setEditProjectEnd(e.target.value); }}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>
            </div>

            {/* Cancel and Submit buttons for project updates */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsOpenEditProjectModal(false); }}
                className="h-10 rounded-full px-5 text-sm"
                disabled={updateProjectMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CATEGORY MANAGE DIALOG: Dialog overlay to perform CRUD on task categories tags */}
      <Dialog open={isOpenCreateCategoryModal} onOpenChange={setIsOpenCreateCategoryModal}>
        <DialogContent className="sm:max-w-[500px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Quản lý chủ đề dự án</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tạo mới, chỉnh sửa hoặc xóa các chủ đề (category) của dự án này.
            </DialogDescription>
          </DialogHeader>

          {/* Render error banner if category action mutation fails */}
          {categoryError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {categoryError}
            </div>
          )}

          {/* Form input fields to create a new category */}
          <div className="flex gap-2 pt-2 border-b border-border pb-4">
            <Input
              placeholder="Tên chủ đề mới..."
              value={newCategoryName}
              onChange={(e) => { setNewCategoryName(e.target.value); }}
              className="h-10 text-sm border-border rounded-full px-4 flex-1"
            />
            <Button
              onClick={() => {
                if (!newCategoryName.trim()) return
                createCategoryMutation.mutate(newCategoryName.trim())
              }}
              disabled={createCategoryMutation.isPending}
              className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Thêm mới
            </Button>
          </div>

          {/* List display matching all project categories */}
          <div className="space-y-3 pt-3 max-h-[300px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Danh sách chủ đề</h4>
            {!categories || categories.length === 0 ? (
              // Empty list fallback view
              <p className="text-xs text-muted-foreground italic py-2 text-center">Chưa có chủ đề nào.</p>
            ) : (
              // Map categories to list items with edit/delete buttons
              categories.map((cat) => {
                const isEditing = editingCategoryId === cat.id
                return (
                  <div key={cat.id} className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/50 bg-muted/10">
                    {isEditing ? (
                      // Render inputs and action buttons if item is in edit state mode
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => { setEditCategoryName(e.target.value); }}
                          className="h-8 text-xs border-border rounded-full px-3 flex-1"
                        />
                        <Button
                          onClick={() => {
                            if (!editCategoryName.trim()) return
                            updateCategoryMutation.mutate({ id: cat.id, name: editCategoryName.trim() })
                          }}
                          disabled={updateCategoryMutation.isPending}
                          className="rounded-full text-[10px] h-7 px-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                        >
                          Lưu
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setEditCategoryName("")
                          }}
                          className="rounded-full text-[10px] h-7 px-3 border-border hover:bg-muted"
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      // Render normal visual display with action edit/delete triggers
                      <>
                        <span className="text-xs font-semibold text-foreground px-2">{cat.name}</span>
                        <div className="flex items-center gap-1.5">
                          {/* Trigger editing mode */}
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingCategoryId(cat.id)
                              setEditCategoryName(cat.name)
                            }}
                            className="text-primary hover:bg-primary/10 rounded-full cursor-pointer h-7 w-7 p-0"
                          >
                            <Edit className="size-3" />
                          </Button>
                          {/* Trigger deletion mutation */}
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc muốn xóa chủ đề "${cat.name}"?`)) {
                                deleteCategoryMutation.mutate(cat.id)
                              }
                            }}
                            className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer h-7 w-7 p-0"
                          >
                            <Trash className="size-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Close dialog action button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpenCreateCategoryModal(false)
                setCategoryError(null)
              }}
              className="h-10 rounded-full px-5 text-sm border-border hover:bg-muted"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
