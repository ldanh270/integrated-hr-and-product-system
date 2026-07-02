import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectApi } from "@/lib/api/project.api"
import { extractErrorMessage } from "@/utils/error-helper"
import {
  PROJECT_STATUSES,
  TASK_CREATION_POLICIES,
} from "@/config/entities/project.config"
import type { Employee } from "@/types/employee.types"
import type { Project } from "@/types/project.types"

interface EditProjectModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  project: Project
  allEmployees: Employee[]
}

const SELECT_NONE_VALUE = "none"

const PROJECT_STATUS_LABELS = new Map<string, string>([
  ["planning", "Lên kế hoạch"],
  ["active", "Đang hoạt động"],
  ["on_hold", "Tạm dừng"],
  ["completed", "Hoàn thành"],
  ["cancelled", "Đã hủy"],
])

export function EditProjectModal({
  isOpen,
  onOpenChange,
  projectId,
  project,
  allEmployees,
}: EditProjectModalProps) {
  const queryClient = useQueryClient()

  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDesc, setEditProjectDesc] = useState("")
  const [editProjectStatus, setEditProjectStatus] = useState("")
  const [editProjectPolicy, setEditProjectPolicy] = useState("")
  const [editProjectLeader, setEditProjectLeader] = useState(SELECT_NONE_VALUE)
  const [editProjectStart, setEditProjectStart] = useState("")
  const [editProjectEnd, setEditProjectEnd] = useState("")
  const [editProjectError, setEditProjectError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && project) {
      setTimeout(() => {
        setEditProjectName(project.name)
        setEditProjectDesc(project.description || "")
        setEditProjectStatus(project.status)
        setEditProjectPolicy(project.taskCreationPolicy)
        setEditProjectLeader(project.teamLeaderId || SELECT_NONE_VALUE)
        setEditProjectStart(
          project.startDate
            ? new Date(project.startDate).toISOString().split("T")[0]
            : ""
        )
        setEditProjectEnd(
          project.expectedEndDate
            ? new Date(project.expectedEndDate).toISOString().split("T")[0]
            : ""
        )
        setEditProjectError(null)
      }, 0)
    }
  }, [isOpen, project])

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!editProjectName.trim()) {
        throw new Error("Vui lòng nhập tên dự án")
      }
      if (editProjectStart && editProjectEnd) {
        const start = new Date(editProjectStart)
        const end = new Date(editProjectEnd)
        if (start > end) {
          throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến")
        }
      }
      return projectApi.update(projectId, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim() || null,
        status: editProjectStatus as (typeof PROJECT_STATUSES)[number],
        taskCreationPolicy: editProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        teamLeaderId: editProjectLeader === SELECT_NONE_VALUE ? null : editProjectLeader,
        startDate: editProjectStart || null,
        expectedEndDate: editProjectEnd || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      setEditProjectError(null)
      toast.success("Cập nhật thông tin dự án thành công")
    },
    onError: (err: unknown) => {
      setEditProjectError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditProjectError(null)
    updateProjectMutation.mutate()
  }

  const handleClose = () => {
    setEditProjectError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-[550px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Chỉnh sửa dự án</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật thông tin và cấu hình cho dự án này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {editProjectError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {editProjectError}
            </div>
          )}

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
            <div className="space-y-1.5">
              <Label htmlFor="editProjStatus" className="text-xs font-semibold text-muted-foreground">
                Trạng thái
              </Label>
              <Select value={editProjectStatus} onValueChange={setEditProjectStatus}>
                <SelectTrigger id="editProjStatus" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {PROJECT_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="rounded-lg">
                      {PROJECT_STATUS_LABELS.get(st) || st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editProjPolicy" className="text-xs font-semibold text-muted-foreground">
                Ai được tạo task?
              </Label>
              <Select value={editProjectPolicy} onValueChange={setEditProjectPolicy}>
                <SelectTrigger id="editProjPolicy" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {TASK_CREATION_POLICIES.map((p) => (
                    <SelectItem key={p} value={p} className="rounded-lg">
                      {p === "leader_only" ? "Chỉ trưởng nhóm" : "Tất cả thành viên"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editProjLeader" className="text-xs font-semibold text-muted-foreground">
              Trưởng dự án (Team Leader)
            </Label>
            <Select value={editProjectLeader} onValueChange={setEditProjectLeader}>
              <SelectTrigger id="editProjLeader" className="w-full h-10 border-border rounded-full px-4 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">Chưa phân công</SelectItem>
                {allEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
  )
}
