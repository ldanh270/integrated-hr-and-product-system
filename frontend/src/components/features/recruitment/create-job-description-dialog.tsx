import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateJobDescription, useRequisitions, useUpdateJobDescription } from "@/hooks/recruitment/use-recruitment-queries"
import type { JobDescription } from "@/types/recruitment.types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRequisitionId?: string
  jobDescription?: JobDescription | null
}

export function CreateJobDescriptionDialog({ open, onOpenChange, initialRequisitionId, jobDescription }: Props) {
  const { data } = useRequisitions({ status: "approved", pageSize: 100 })
  const create = useCreateJobDescription()
  const update = useUpdateJobDescription()
  
  const [requisitionId, setRequisitionId] = useState(initialRequisitionId ?? "")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [requirements, setRequirements] = useState("")
  const [benefits, setBenefits] = useState("")

  useEffect(() => {
    if (open) {
      if (jobDescription) {
        setRequisitionId(jobDescription.requisitionId)
        setTitle(jobDescription.title)
        setSummary(jobDescription.summary ?? "")
        setResponsibilities(jobDescription.responsibilities ?? "")
        setRequirements(jobDescription.requirements ?? "")
        setBenefits(jobDescription.benefits ?? "")
      } else {
        setRequisitionId(initialRequisitionId ?? "")
        setTitle("")
        setSummary("")
        setResponsibilities("")
        setRequirements("")
        setBenefits("")
      }
    }
  }, [open, jobDescription, initialRequisitionId])

  const submit = () => {
    if (!requisitionId || !title.trim()) return
    const payload = {
      requisitionId,
      title: title.trim(),
      summary: summary || undefined,
      responsibilities: responsibilities || undefined,
      requirements: requirements || undefined,
      benefits: benefits || undefined,
    }

    if (jobDescription) {
      const { requisitionId: _, ...updatePayload } = payload
      update.mutate(
        { id: jobDescription.id, data: updatePayload },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      create.mutate(
        payload,
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  const isEdit = Boolean(jobDescription)
  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa bản mô tả công việc" : "Tạo bản mô tả công việc"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Chỉnh sửa các trường của bản mô tả công việc." : "JD chỉ được tạo từ yêu cầu tuyển dụng đã phê duyệt."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label>Yêu cầu tuyển dụng</Label>
            <Select value={requisitionId} onValueChange={setRequisitionId} disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn yêu cầu đã duyệt" />
              </SelectTrigger>
              <SelectContent>
                {(data?.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} · {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jd-title">Tiêu đề JD</Label>
            <Input id="jd-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Senior Frontend Engineer" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jd-summary">Tóm tắt vị trí</Label>
            <Textarea id="jd-summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jd-responsibilities">Trách nhiệm</Label>
            <Textarea id="jd-responsibilities" value={responsibilities} onChange={(event) => setResponsibilities(event.target.value)} rows={5} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jd-requirements">Yêu cầu</Label>
            <Textarea id="jd-requirements" value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={5} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jd-benefits">Quyền lợi</Label>
            <Textarea id="jd-benefits" value={benefits} onChange={(event) => setBenefits(event.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={!requisitionId || !title.trim() || isPending}>
            {isPending ? (isEdit ? "Đang lưu..." : "Đang tạo...") : (isEdit ? "Lưu thay đổi" : "Tạo JD")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

