import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EMPLOYEE_TYPES, EMPLOYEE_TYPE_LABELS } from "@/config/entities/employee.config"
import {
  REQUISITION_PRIORITIES,
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
} from "@/config/entities/recruitment.config"
import { useCreateRequisition, useRequisitionApprovers } from "@/hooks/recruitment/use-recruitment-queries"
import type { CreateRequisitionDto } from "@/lib/api/recruitment.api"

const optionalText = z.string().trim().optional().transform((value) => value || undefined)
const optionalPositiveNumber = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.coerce.number().positive().optional(),
)

const requisitionFormSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập vị trí cần tuyển").max(255),
  department: optionalText,
  positionLevel: optionalText,
  employmentType: z.enum(EMPLOYEE_TYPES),
  headcount: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
  priority: z.enum(REQUISITION_PRIORITIES),
  salaryMin: optionalPositiveNumber,
  salaryMax: optionalPositiveNumber,
  reason: optionalText,
  targetHireDate: optionalText,
  targetCloseDate: optionalText,
  approverId: z.string().min(1, "Vui lòng chọn người duyệt"),
}).refine(
  ({ salaryMin, salaryMax }) => !salaryMin || !salaryMax || salaryMin <= salaryMax,
  { message: "Lương tối thiểu không được lớn hơn lương tối đa", path: ["salaryMax"] },
)

type RequisitionFormValues = z.input<typeof requisitionFormSchema>

interface CreateRequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultValues: RequisitionFormValues = {
  title: "",
  department: "",
  positionLevel: "",
  employmentType: EMPLOYEE_TYPES[0],
  headcount: 1,
  priority: REQUISITION_PRIORITY.MEDIUM,
  salaryMin: undefined,
  salaryMax: undefined,
  reason: "",
  targetHireDate: "",
  targetCloseDate: "",
  approverId: "",
}

export function CreateRequisitionDialog({ open, onOpenChange }: CreateRequisitionDialogProps) {
  const createRequisition = useCreateRequisition()
  const { data: approvers = [], isLoading: isLoadingApprovers } = useRequisitionApprovers()
  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues,
  })
  const [employmentType, priority, approverId] = useWatch({
    control: form.control,
    name: ["employmentType", "priority", "approverId"],
  })

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [form, open])

  const close = () => onOpenChange(false)

  const onSubmit = (values: RequisitionFormValues) => {
    const parsed = requisitionFormSchema.parse(values)
    const payload: CreateRequisitionDto = {
      ...parsed,
      targetHireDate: parsed.targetHireDate ? new Date(parsed.targetHireDate).toISOString() : undefined,
      targetCloseDate: parsed.targetCloseDate ? new Date(parsed.targetCloseDate).toISOString() : undefined,
    }

    createRequisition.mutate(payload, { onSuccess: close })
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-xl">
        <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Tạo yêu cầu tuyển dụng</DialogTitle>
            <DialogDescription>Tạo bản nháp để gửi duyệt trước khi đăng tuyển.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vị trí cần tuyển" error={errors.title?.message} className="sm:col-span-2">
              <Input placeholder="Ví dụ: Frontend Developer" {...form.register("title")} />
            </Field>
            <Field label="Loại hình làm việc" error={errors.employmentType?.message}>
              <Select value={employmentType} onValueChange={(value) => form.setValue("employmentType", value as RequisitionFormValues["employmentType"], { shouldValidate: true })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYEE_TYPES.map((type) => <SelectItem key={type} value={type}>{EMPLOYEE_TYPE_LABELS[type]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Số lượng" error={errors.headcount?.message}>
              <Input type="number" min="1" {...form.register("headcount")} />
            </Field>
            <Field label="Phòng ban" error={errors.department?.message}>
              <Input placeholder="Ví dụ: Công nghệ" {...form.register("department")} />
            </Field>
            <Field label="Cấp bậc" error={errors.positionLevel?.message}>
              <Input placeholder="Ví dụ: Junior, Senior" {...form.register("positionLevel")} />
            </Field>
            <Field label="Mức lương tối thiểu" error={errors.salaryMin?.message}>
              <Input type="number" min="0" placeholder="VND" {...form.register("salaryMin")} />
            </Field>
            <Field label="Mức lương tối đa" error={errors.salaryMax?.message}>
              <Input type="number" min="0" placeholder="VND" {...form.register("salaryMax")} />
            </Field>
            <Field label="Ưu tiên" error={errors.priority?.message}>
              <Select value={priority} onValueChange={(value) => form.setValue("priority", value as RequisitionFormValues["priority"], { shouldValidate: true })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{REQUISITION_PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{REQUISITION_PRIORITY_LABELS[priority]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Người duyệt" error={errors.approverId?.message}>
              <Select value={approverId} onValueChange={(value) => form.setValue("approverId", value, { shouldValidate: true })} disabled={isLoadingApprovers || approvers.length === 0}>
                <SelectTrigger className="w-full"><SelectValue placeholder={isLoadingApprovers ? "Đang tải..." : "Chọn người có quyền duyệt"} /></SelectTrigger>
                <SelectContent>{approvers.map((approver) => <SelectItem key={approver.id} value={approver.id}>{approver.fullName}{approver.position ? ` — ${approver.position}` : ""}</SelectItem>)}</SelectContent>
              </Select>
              {!isLoadingApprovers && approvers.length === 0 && <p className="text-sm text-destructive">Chưa có nhân viên nào được cấp quyền recruitment.requisition.approve.</p>}
            </Field>
            <Field label="Ngày dự kiến tuyển" error={errors.targetHireDate?.message}>
              <Input type="date" {...form.register("targetHireDate")} />
            </Field>
            <Field label="Ngày dự kiến đóng" error={errors.targetCloseDate?.message}>
              <Input type="date" {...form.register("targetCloseDate")} />
            </Field>
            <Field label="Lý do tuyển dụng" error={errors.reason?.message} className="sm:col-span-2">
              <Textarea placeholder="Bổ sung nhân sự, thay thế, mở rộng đội ngũ..." {...form.register("reason")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={createRequisition.isPending}>Hủy</Button>
            <Button type="submit" disabled={createRequisition.isPending}>{createRequisition.isPending ? "Đang tạo..." : "Tạo yêu cầu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <div className={`grid gap-2 ${className ?? ""}`}><Label>{label}</Label>{children}{error && <p className="text-sm text-destructive">{error}</p>}</div>
}
