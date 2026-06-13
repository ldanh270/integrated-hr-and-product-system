import { PageCard, PageHeader, StatusPill } from "@/components/common"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PROJECT_STATUSES, TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { ROLE } from "@/config/entities/employee.config"
import { employeeApi } from "@/lib/api/employee.api"
import { projectApi } from "@/lib/api/project.api"
import { useAuthStore } from "@/store/auth-store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderKanban, Plus, Search, Users } from "lucide-react"
import React, { useState } from "react"
import { Link } from "react-router-dom"

export default function ProjectList() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isManager = user?.role === ROLE.ADMIN || user?.role === ROLE.GENERAL_MANAGER

  // State for filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // State for Create Project Modal
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [newProjectTech, setNewProjectTech] = useState("")
  const [newProjectLeader, setNewProjectLeader] = useState("none")
  const [newProjectPolicy, setNewProjectPolicy] = useState("all_members")
  const [newProjectStart, setNewProjectStart] = useState("")
  const [newProjectEnd, setNewProjectEnd] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  // Fetch projects list
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectApi.list({ limit: 100 }),
  })

  // Fetch employees list for Leader dropdown
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeApi.list({ limit: 200 }),
    enabled: isOpenCreateModal,
  })

  const projects = projectsData?.data || []
  const employees = employeesData?.data || []

  // Filter projects client-side
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(search.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(search.toLowerCase())) ||
      proj.techStack.some((tech) => tech.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === "all" || proj.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Create Project mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const techStack = newProjectTech
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      return projectApi.create({
        name: newProjectName,
        description: newProjectDesc.trim() || null,
        techStack,
        status: "planning",
        taskCreationPolicy: newProjectPolicy as any,
        startDate: newProjectStart || null,
        expectedEndDate: newProjectEnd || null,
        teamLeaderId: newProjectLeader === "none" ? null : newProjectLeader,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsOpenCreateModal(false)
      // Reset form
      setNewProjectName("")
      setNewProjectDesc("")
      setNewProjectTech("")
      setNewProjectLeader("none")
      setNewProjectPolicy("all_members")
      setNewProjectStart("")
      setNewProjectEnd("")
      setCreateError(null)
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.error?.message || err.message || "Đã xảy ra lỗi")
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!newProjectName.trim()) {
      setCreateError("Vui lòng nhập tên dự án")
      return
    }
    createMutation.mutate()
  }

  const formatStatus = (status: string) => {
    if (status === "planning") return "Lập kế hoạch"
    if (status === "active") return "Đang hoạt động"
    if (status === "on_hold") return "Tạm dừng"
    if (status === "completed") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    return status
  }

  const getStatusVariant = (status: string) => {
    if (status === "active") return "success"
    if (status === "planning") return "neutral"
    if (status === "on_hold") return "warning"
    if (status === "completed") return "info"
    return "danger"
  }

  return (
    <div className="container p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Danh sách dự án" description="Quản lý các dự án đang phát triển trong công ty" />
        {isManager && (
          <Button
            onClick={() => setIsOpenCreateModal(true)}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-11 px-5 text-sm"
          >
            <Plus className="size-4" />
            Tạo dự án mới
          </Button>
        )}
      </div>

      {/* Toolbar / Filters */}
      <PageCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mô tả, công nghệ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-10 text-sm border-border rounded-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Trạng thái:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 border-border rounded-full px-4 bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all" className="rounded-lg">Tất cả</SelectItem>
              {PROJECT_STATUSES.map((st) => (
                <SelectItem key={st} value={st} className="rounded-lg">
                  {formatStatus(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageCard>

      {/* List PageCard */}
      <PageCard className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-secondary p-4 mb-4 text-muted-foreground">
              <FolderKanban className="size-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Không tìm thấy dự án nào</h3>
            <p className="text-sm text-muted-foreground mt-1">Vui lòng điều chỉnh bộ lọc hoặc tạo dự án mới.</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent h-12">
                  <TableHead className="font-semibold">Tên dự án</TableHead>
                  <TableHead className="font-semibold">Trưởng nhóm (TL)</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold">Công nghệ (Tech Stack)</TableHead>
                  <TableHead className="font-semibold">Ngày bắt đầu</TableHead>
                  <TableHead className="font-semibold">Dự kiến kết thúc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((proj) => (
                  <TableRow key={proj.id} className="h-16 hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold">
                      <Link to={`/project/${proj.id}`} className="text-primary hover:underline font-bold text-sm">
                        {proj.name}
                      </Link>
                      {proj.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[280px]">
                          {proj.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {proj.teamLeader ? (
                        <div className="flex items-center gap-1.5">
                          <div className="rounded-full bg-secondary p-1 text-muted-foreground">
                            <Users className="size-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {proj.teamLeader.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa phân công</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusPill label={formatStatus(proj.status)} variant={getStatusVariant(proj.status)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {proj.techStack.length > 0 ? (
                          proj.techStack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
                              {tech}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {proj.startDate ? new Date(proj.startDate).toLocaleDateString("vi-VN") : "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {proj.expectedEndDate ? new Date(proj.expectedEndDate).toLocaleDateString("vi-VN") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageCard>

      {/* Create Project Modal */}
      <Dialog open={isOpenCreateModal} onOpenChange={setIsOpenCreateModal}>
        <DialogContent className="sm:max-w-[600px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Tạo dự án mới</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nhập các thông tin chi tiết để thiết lập dự án mới trong phân hệ quản lý.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-3">
            {createError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {createError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="projName" className="text-xs font-semibold text-muted-foreground">
                Tên dự án <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projName"
                placeholder="Nhập tên dự án..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="h-10 text-sm border-border rounded-full px-4"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projDesc" className="text-xs font-semibold text-muted-foreground">
                Mô tả dự án
              </Label>
              <Textarea
                id="projDesc"
                placeholder="Nhập mô tả tóm tắt dự án..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="projStart" className="text-xs font-semibold text-muted-foreground">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="projStart"
                  type="date"
                  value={newProjectStart}
                  onChange={(e) => setNewProjectStart(e.target.value)}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projEnd" className="text-xs font-semibold text-muted-foreground">
                  Ngày dự kiến kết thúc
                </Label>
                <Input
                  id="projEnd"
                  type="date"
                  value={newProjectEnd}
                  onChange={(e) => setNewProjectEnd(e.target.value)}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="projLeader" className="text-xs font-semibold text-muted-foreground">
                  Trưởng nhóm (Team Leader)
                </Label>
                <Select value={newProjectLeader} onValueChange={setNewProjectLeader}>
                  <SelectTrigger id="projLeader" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue placeholder="Chọn Trưởng nhóm" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    <SelectItem value="none" className="rounded-lg">Không phân công</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projPolicy" className="text-xs font-semibold text-muted-foreground">
                  Quyền tạo công việc
                </Label>
                <Select value={newProjectPolicy} onValueChange={setNewProjectPolicy}>
                  <SelectTrigger id="projPolicy" className="w-full h-10 border-border rounded-full px-4 bg-background">
                    <SelectValue placeholder="Chọn quyền" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {TASK_CREATION_POLICIES.map((pol) => (
                      <SelectItem key={pol} value={pol} className="rounded-lg">
                        {pol === "leader_only" ? "Chỉ trưởng nhóm (Leader)" : "Tất cả thành viên"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projTech" className="text-xs font-semibold text-muted-foreground">
                Công nghệ sử dụng (Tech Stack)
              </Label>
              <Input
                id="projTech"
                placeholder="Ví dụ: React, Node.js, TypeScript (Ngăn cách bằng dấu phẩy)"
                value={newProjectTech}
                onChange={(e) => setNewProjectTech(e.target.value)}
                className="h-10 text-sm border-border rounded-full px-4"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenCreateModal(false)}
                className="h-10 rounded-full px-5 text-sm"
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
