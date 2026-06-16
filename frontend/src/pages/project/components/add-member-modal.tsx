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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectApi } from "@/lib/api/project.api"
import { extractErrorMessage } from "@/utils/error-helper"
import type { Employee } from "@/types/employee.types"
import type { ProjectMember } from "@/types/project.types"

interface AddMemberModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  members: ProjectMember[]
  allEmployees: Employee[]
  teamLeaderId?: string | null
}

const SELECT_NONE_VALUE = "none"

export function AddMemberModal({
  isOpen,
  onOpenChange,
  projectId,
  members,
  allEmployees,
  teamLeaderId,
}: AddMemberModalProps) {
  const queryClient = useQueryClient()
  const [memberEmployeeId, setMemberEmployeeId] = useState(SELECT_NONE_VALUE)
  const [memberError, setMemberError] = useState<string | null>(null)

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (memberEmployeeId === SELECT_NONE_VALUE) {
        throw new Error("Vui lòng chọn nhân viên")
      }
      return projectApi.addMember(projectId, memberEmployeeId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      onOpenChange(false)
      setMemberEmployeeId(SELECT_NONE_VALUE)
      setMemberError(null)
      toast.success("Thêm thành viên vào dự án thành công")
    },
    onError: (err: unknown) => {
      setMemberError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMemberError(null)
    addMemberMutation.mutate()
  }

  const handleClose = () => {
    setMemberEmployeeId(SELECT_NONE_VALUE)
    setMemberError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-[450px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Thêm thành viên dự án</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn một nhân viên để đưa họ vào tham gia dự án này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {memberError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {memberError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="memberEmp" className="text-xs font-semibold text-muted-foreground">
              Chọn nhân sự
            </Label>
            <Select value={memberEmployeeId} onValueChange={setMemberEmployeeId}>
              <SelectTrigger id="memberEmp" className="w-full h-10 border-border rounded-full px-4 bg-background">
                <SelectValue placeholder="Chọn nhân sự" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">Chọn nhân viên</SelectItem>
                {allEmployees
                  .filter(
                    (emp) =>
                      !members.some((m) => m.employeeId === emp.id) &&
                      emp.id !== teamLeaderId
                  )
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                      {emp.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
  )
}
