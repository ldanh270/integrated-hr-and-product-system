import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROJECT_MESSAGES } from "@/config/messages/project.message"
import {
  PROJECT_MEMBER_WORK_MODE,
  PROJECT_MEMBER_WORK_MODES,
  getProjectMemberWorkModeLabel,
} from "@/config/entities/project.config"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util"
import { projectApi } from "@/lib/api/project.api"
import { extractErrorMessage } from "@/utils/error-helper"
import type { Employee } from "@/types/employee.types"
import type { ProjectMember } from "@/types/project.types"

interface EditMemberModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  member: ProjectMember | null
  allEmployees: Employee[]
}

interface EditMemberFormProps {
  projectId: string
  member: ProjectMember
  isPartTime: boolean
  onClose: () => void
}

function EditMemberForm({ projectId, member, isPartTime, onClose }: EditMemberFormProps) {
  const queryClient = useQueryClient()
  const [hourlyRate, setHourlyRate] = useState(
    () => (member.hourlyRate != null ? String(member.hourlyRate) : ""),
  )
  const [workMode, setWorkMode] = useState(
    () => member.workMode || PROJECT_MEMBER_WORK_MODE.REMOTE,
  )
  const [memberError, setMemberError] = useState<string | null>(null)

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (isPartTime && (!hourlyRate || Number(hourlyRate) <= 0)) {
        throw new Error(PROJECT_MESSAGES.PART_TIME_HOURLY_RATE_REQUIRED)
      }

      return projectApi.updateMember(projectId, member.employeeId, {
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        workMode,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      onClose()
      toast.success("Cập nhật thành viên thành công")
    },
    onError: (err: unknown) => {
      setMemberError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMemberError(null)
    updateMemberMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-3">
      {memberError ? (
        <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
          {memberError}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="editHourlyRate" className="text-xs font-semibold text-muted-foreground">
          Lương theo giờ (VND){isPartTime ? " *" : ""}
        </Label>
        <Input
          id="editHourlyRate"
          type="number"
          min="0"
          step="1000"
          value={hourlyRate}
          onChange={(event) => {
            setHourlyRate(event.target.value)
          }}
          placeholder="VD: 50000"
          className="h-10 rounded-full"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="editWorkMode" className="text-xs font-semibold text-muted-foreground">
          Chế độ làm việc
        </Label>
        <Select value={workMode} onValueChange={setWorkMode}>
          <SelectTrigger
            id="editWorkMode"
            className="w-full h-10 border-border rounded-full px-4 bg-background"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover">
            {PROJECT_MEMBER_WORK_MODES.map((mode) => (
              <SelectItem key={mode} value={mode} className="rounded-lg">
                {getProjectMemberWorkModeLabel(mode)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-10 rounded-full px-5 text-sm"
          disabled={updateMemberMutation.isPending}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
          disabled={updateMemberMutation.isPending}
        >
          {updateMemberMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  )
}

export function EditMemberModal({
  isOpen,
  onOpenChange,
  projectId,
  member,
  allEmployees,
}: EditMemberModalProps) {
  if (!member) return null

  const employee = allEmployees.find((entry) => entry.id === member.employeeId)
  const isPartTime = employee ? isPartTimeWorkSchedule(employee) : false
  const formKey = `${member.employeeId}-${isOpen}`

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[450px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Chỉnh sửa thành viên
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật mức lương/giờ và chế độ làm việc cho{" "}
            {member.employee?.fullName ?? "thành viên"}.
          </DialogDescription>
        </DialogHeader>

        {isOpen ? (
          <EditMemberForm
            key={formKey}
            projectId={projectId}
            member={member}
            isPartTime={isPartTime}
            onClose={handleClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
