import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INTERVIEW_FORMAT, INTERVIEW_FORMAT_LABELS } from "@/config/entities/recruitment.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { useCreateInterview } from "@/hooks/recruitment/use-recruitment-queries"
import type { KanbanApplication } from "@/types/recruitment.types"

interface ScheduleInterviewDialogProps {
  applications: KanbanApplication[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function ScheduleInterviewDialog({ applications, open, onOpenChange, onCreated }: ScheduleInterviewDialogProps) {
  const [applicationId, setApplicationId] = useState("")
  const [title, setTitle] = useState("")
  const [format, setFormat] = useState<string>(INTERVIEW_FORMAT.VIDEO_CALL)
  const [scheduledAt, setScheduledAt] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [interviewerId, setInterviewerId] = useState("")
  const { data: employeeData } = useEmployees({ limit: 200 }, { enabled: open })
  const createInterview = useCreateInterview()
  const employees = employeeData?.data ?? []

  const reset = () => {
    setApplicationId("")
    setTitle("")
    setFormat(INTERVIEW_FORMAT.VIDEO_CALL)
    setScheduledAt("")
    setDurationMinutes("60")
    setInterviewerId("")
  }

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const submit = () => {
    const application = applications.find((item) => item.id === applicationId)
    if (!application || !scheduledAt || !interviewerId) return

    createInterview.mutate({
      applicationId,
      title: title.trim(),
      roundNumber: (application.interviewRounds?.length ?? 0) + 1,
      format,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: Number(durationMinutes),
      interviewerIds: [interviewerId],
    }, {
      onSuccess: () => {
        onCreated()
        close(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg rounded-xl border-border bg-popover">
        <DialogHeader><DialogTitle>Tạo lịch phỏng vấn</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Ứng viên</Label><Select value={applicationId} onValueChange={setApplicationId}><SelectTrigger className="rounded-full"><SelectValue placeholder="Chọn ứng viên" /></SelectTrigger><SelectContent>{applications.map((application) => <SelectItem key={application.id} value={application.id}>{application.candidate.fullName} · {application.candidate.email}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Tên vòng phỏng vấn</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Phỏng vấn kỹ thuật" className="rounded-full" /></div>
          <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><Label>Hình thức</Label><Select value={format} onValueChange={setFormat}><SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger><SelectContent>{Object.values(INTERVIEW_FORMAT).map((value) => <SelectItem key={value} value={value}>{INTERVIEW_FORMAT_LABELS[value]}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Thời lượng (phút)</Label><Input type="number" min="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} className="rounded-full" /></div></div>
          <div className="grid gap-2"><Label>Thời gian</Label><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="rounded-full" /></div>
          <div className="grid gap-2"><Label>Người phỏng vấn chính</Label><Select value={interviewerId} onValueChange={setInterviewerId}><SelectTrigger className="rounded-full"><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.fullName}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" className="rounded-full" onClick={() => close(false)}>Hủy</Button><Button type="button" className="rounded-full" onClick={submit} disabled={!applicationId || !title.trim() || !scheduledAt || !interviewerId || createInterview.isPending}>{createInterview.isPending ? "Đang tạo..." : "Tạo lịch"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
