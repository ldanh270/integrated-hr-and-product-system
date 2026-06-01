import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
} from "@/config/entities/employee.config"
import { useUpdateEmployee } from "@/hooks/useEmployees"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Employee } from "../../../types/employee.types"

const editSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
})

type EditFormValues = z.infer<typeof editSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}

export function EmployeeEditModal({ isOpen, onClose, employee }: Props) {
  const updateMutation = useUpdateEmployee()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (employee && isOpen) {
      reset({
        fullName: employee.fullName,
        phone: employee.phone || undefined,
        position: employee.position || undefined,
        employeeType: employee.employeeType,
        status: employee.status,
      })
    }
  }, [employee, isOpen, reset])

  if (!isOpen || !employee) return null

  const onSubmit = async (data: EditFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: employee.id, data })
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chỉnh sửa nhân sự</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" {...register("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="position">Vị trí</Label>
                <Input id="position" {...register("position")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={EMPLOYEE_STATUS.ACTIVE}>Đang làm việc</option>
                  <option value={EMPLOYEE_STATUS.INACTIVE}>Tạm nghỉ</option>
                  <option value={EMPLOYEE_STATUS.ON_LEAVE}>Nghỉ phép</option>
                  <option value={EMPLOYEE_STATUS.TERMINATED}>Đã nghỉ việc</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employeeType">Loại hợp đồng</Label>
                <select
                  id="employeeType"
                  {...register("employeeType")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={EMPLOYEE_TYPES[0]}>Chính thức</option>
                  <option value={EMPLOYEE_TYPES[1]}>Bán thời gian</option>
                  <option value={EMPLOYEE_TYPES[2]}>Hợp đồng</option>
                  <option value={EMPLOYEE_TYPES[3]}>Thực tập</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 mt-auto">
          <Button variant="outline" onClick={onClose} type="button">
            Hủy
          </Button>
          <Button type="submit" form="edit-employee-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </div>
      </div>
    </div>
  )
}
