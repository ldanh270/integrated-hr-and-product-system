import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateJobDescription, useRequisitions } from "@/hooks/recruitment/use-recruitment-queries"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRequisitionId?: string
}

export function CreateJobDescriptionDialog({ open, onOpenChange, initialRequisitionId }: Props) {
  const { data } = useRequisitions({ status: "approved", pageSize: 100 })
  const create = useCreateJobDescription()
  const [requisitionId, setRequisitionId] = useState(initialRequisitionId ?? "")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [requirements, setRequirements] = useState("")
  const [benefits, setBenefits] = useState("")

  const submit = () => {
    if (!requisitionId || !title.trim()) return
    create.mutate(
      { requisitionId, title: title.trim(), summary, responsibilities, requirements, benefits },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo bản mô tả công việc</DialogTitle>
          <DialogDescription>JD chỉ được tạo từ yêu cầu tuyển dụng đã phê duyệt.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2"><Label>Yêu cầu tuyển dụng</Label><Select value={requisitionId} onValueChange={setRequisitionId}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn yêu cầu đã duyệt" /></SelectTrigger><SelectContent>{(data?.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.code} · {item.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label htmlFor="jd-title">Tiêu đề JD</Label><Input id="jd-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Senior Frontend Engineer" /></div>
          <div className="grid gap-2"><Label htmlFor="jd-summary">Tóm tắt vị trí</Label><Textarea id="jd-summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} /></div>
          <div className="grid gap-2"><Label htmlFor="jd-responsibilities">Trách nhiệm</Label><Textarea id="jd-responsibilities" value={responsibilities} onChange={(event) => setResponsibilities(event.target.value)} rows={5} /></div>
          <div className="grid gap-2"><Label htmlFor="jd-requirements">Yêu cầu</Label><Textarea id="jd-requirements" value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={5} /></div>
          <div className="grid gap-2"><Label htmlFor="jd-benefits">Quyền lợi</Label><Textarea id="jd-benefits" value={benefits} onChange={(event) => setBenefits(event.target.value)} rows={4} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button onClick={submit} disabled={!requisitionId || !title.trim() || create.isPending}>{create.isPending ? "Đang tạo..." : "Tạo JD"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
