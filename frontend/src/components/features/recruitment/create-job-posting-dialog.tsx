import { useMemo, useState } from "react"
import { FileSpreadsheet } from "lucide-react"
import { RecruitmentFormFieldEditor } from "@/components/features/recruitment/recruitment-form-field-editor"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateJobPosting } from "@/hooks/recruitment/use-recruitment-queries"
import type { JobDescription, RecruitmentFormField } from "@/types/recruitment.types"

const DEFAULT_FIELDS: RecruitmentFormField[] = [
  { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
  { key: "email", label: "Email", type: "short_text", required: true },
  { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
  { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
  { key: "notes", label: "Thông tin bổ sung", type: "paragraph", required: false },
]

const FIELD_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobDescriptions: JobDescription[]
  initialJobDescriptionId?: string
}

function getFieldError(fields: RecruitmentFormField[]): string | null {
  if (fields.some((field) => !field.label.trim())) return "Mỗi field cần có nhãn hiển thị."
  if (fields.some((field) => !FIELD_KEY_PATTERN.test(field.key) || field.key.length > 50)) {
    return "Mã field phải là lower_snake_case và không quá 50 ký tự."
  }
  if (new Set(fields.map((field) => field.key)).size !== fields.length) return "Mã field không được trùng nhau."
  return null
}

export function CreateJobPostingDialog({ open, onOpenChange, jobDescriptions, initialJobDescriptionId }: Props) {
  const create = useCreateJobPosting()
  const [jobDescriptionId, setJobDescriptionId] = useState(initialJobDescriptionId ?? "")
  const [fields, setFields] = useState<RecruitmentFormField[]>(() => DEFAULT_FIELDS.map((field) => ({ ...field })))
  const fieldError = useMemo(() => getFieldError(fields), [fields])

  const submit = () => {
    if (!jobDescriptionId || fieldError) return
    create.mutate(
      { jobDescriptionId, fields: fields.map((field) => ({ ...field, label: field.label.trim() })) },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tạo Google Form ứng tuyển</DialogTitle>
          <DialogDescription>Chọn JD và cấu hình các field. Hệ thống sẽ tự tạo mã nguồn và Google Form.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label>JD</Label>
            <Select value={jobDescriptionId} onValueChange={setJobDescriptionId}>
              <SelectTrigger className="h-12 w-full"><SelectValue placeholder="Chọn JD" /></SelectTrigger>
              <SelectContent>{jobDescriptions.map((jd) => <SelectItem key={jd.id} value={jd.id}>{jd.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><p className="font-medium">Google Forms</p><p className="mt-1 text-muted-foreground">Họ tên và email luôn bắt buộc để tạo hồ sơ. Sau khi lưu, public form để nhận link ứng tuyển.</p></div>
          </div>
          <RecruitmentFormFieldEditor fields={fields} onChange={setFields} />
          {fieldError && <p role="alert" className="text-sm text-destructive">{fieldError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={!jobDescriptionId || Boolean(fieldError) || create.isPending}>{create.isPending ? "Đang lưu..." : "Lưu cấu hình"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
