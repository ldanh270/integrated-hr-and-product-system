import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  LEAVE_TYPES,
  WORK_MODES,
} from "@/config/entities/attendance.config"
import { useApplications } from "@/hooks/attendance/useApplications"
import { type ApplicationSchemaType, applicationSchema } from "@/schemas/attendance.schema"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Clock, Send } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"

interface ApplicationFormProps {
  onSuccess?: () => void
}

export default function ApplicationForm({ onSuccess }: ApplicationFormProps) {
  const { createApplication, isCreating } = useApplications()

  const form = useForm<ApplicationSchemaType>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      type: "leave",
      details: {
        reason: "",
      },
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const applicationType = watch("type")

  const onSubmit = async (data: ApplicationSchemaType) => {
    try {
      await createApplication(data)
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error handled in hook
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Loại đơn</Label>
          <Select
            value={applicationType}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại đơn" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(APPLICATION_TYPES).map((type) => (
                <SelectItem key={type.LABEL} value={type.LABEL}>
                  {type.DESCRIPTION}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Fields based on Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicationType === "leave" && (
            <>
              <div className="space-y-2">
                <Label>Loại phép</Label>
                <Select onValueChange={(value) => setValue("details.leaveType" as any, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phép" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LEAVE_TYPES).map((type) => (
                      <SelectItem key={type.LABEL} value={type.LABEL}>
                        {type.DESCRIPTION}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số ngày nghỉ</Label>
                <Input
                  type="number"
                  step="0.5"
                  {...register("details.totalDays" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...register("details.startDate" as any)} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register("details.endDate" as any)} />
              </div>
            </>
          )}

          {applicationType === "overtime" && (
            <>
              <div className="space-y-2">
                <Label>Ngày OT</Label>
                <Input type="date" {...register("details.otDate" as any)} />
              </div>
              <div className="space-y-2">
                <Label>Số giờ (dự kiến)</Label>
                <Input
                  type="number"
                  step="0.5"
                  {...register("details.totalHours" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <Input type="time" {...register("details.startTime" as any)} />
              </div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <Input type="time" {...register("details.endTime" as any)} />
              </div>
            </>
          )}

          {applicationType === "work_from_home" && (
            <>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...register("details.startDate" as any)} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register("details.endDate" as any)} />
              </div>
            </>
          )}

          {applicationType === "shift_swap" && (
            <>
              <div className="space-y-2">
                <Label>Ngày đổi ca</Label>
                <Input type="date" {...register("details.swapDate" as any)} />
              </div>
              {/* Note: fromShiftId and toShiftId would ideally be Selects from employee's shifts */}
              <div className="space-y-2">
                <Label>Ca hiện tại (Mã ca)</Label>
                <Input {...register("details.fromShiftId" as any)} />
              </div>
              <div className="space-y-2">
                <Label>Ca muốn đổi (Mã ca)</Label>
                <Input {...register("details.toShiftId" as any)} />
              </div>
            </>
          )}
        </div>

        {/* Common Fields */}
        <div className="space-y-2">
          <Label>Lý do</Label>
          <Textarea
            placeholder="Mô tả chi tiết lý do..."
            {...register("details.reason" as any)}
            className={errors.details?.reason ? "border-destructive" : ""}
          />
          {errors.details?.reason && (
            <p className="text-xs text-destructive">{errors.details.reason.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Ghi chú (Không bắt buộc)</Label>
          <Textarea placeholder="Ghi chú thêm..." {...register("details.note" as any)} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isCreating}>
        {isCreating ? (
          "Đang gửi..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Gửi đơn phê duyệt
          </>
        )}
      </Button>
    </form>
  )
}
