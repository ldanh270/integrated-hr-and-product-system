import { AppDrawer } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE_LABELS,
  ROLE_LABELS,
} from "@/config/entities/employee.config"
import { useEmployeeEditModal } from "@/hooks/employees/useEmployeeEditModal"
import type { Employee } from "@/types/employee.types"

/**
 * Prop definitions for EmployeeEditDrawer component.
 */
interface Props {
  /** Boolean state flag indicating if the edit drawer is visible */
  isOpen: boolean
  /** Callback event function triggered on closing the drawer */
  onClose: () => void
  /** The Employee object to edit, or null if none is selected */
  employee: Employee | null
}

/**
 * EmployeeEditDrawer Component.
 * Slide-out sidebar drawer containing a form to update an existing employee's details.
 * Integrates useEmployeeEditModal hook to handle reactive form state and mutation updates.
 */
export function EmployeeEditDrawer({ isOpen, onClose, employee }: Props) {
  // Extract react hook form fields, submission status from custom hook
  const { register, handleSubmit, errors, isPending } = useEmployeeEditModal(
    employee,
    isOpen,
    onClose,
  )

  // Avoid rendering if no employee is selected for editing
  if (!employee) return null

  return (
    <AppDrawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header toolbar banner */}
        <div className="px-10 pt-14 pb-8 bg-muted/20 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Chỉnh sửa nhân sự</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Cập nhật thông tin cho {employee.fullName}
          </p>
        </div>

        {/* Form content viewport */}
        <div className="p-10 flex-1 overflow-y-auto">
          <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Account section */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Tài khoản & Phân quyền
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-[12px] text-muted-foreground">
                      Tên đăng nhập
                    </Label>
                    <Input
                      id="username"
                      {...register("username")}
                      className={`bg-background ${errors.username ? "border-destructive" : ""}`}
                    />
                    {errors.username && (
                      <p className="text-xs text-destructive">{errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[12px] text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={`bg-background ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[12px] text-muted-foreground">
                      Mật khẩu mới (Tùy chọn)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Để trống nếu không đổi"
                      {...register("password")}
                      className={`bg-background ${errors.password ? "border-destructive" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-[12px] text-muted-foreground">
                      Phân quyền
                    </Label>
                    <select
                      id="role"
                      {...register("role")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {EMPLOYEE_ROLES.map((roleKey) => (
                        <option key={roleKey} value={roleKey}>
                          {ROLE_LABELS[roleKey]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Basic Info section */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thông tin cơ bản
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[12px] text-muted-foreground">
                    Họ và tên
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    className={`bg-background ${errors.fullName ? "border-destructive" : ""}`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[12px] text-muted-foreground">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    className={`bg-background ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth" className="text-[12px] text-muted-foreground">
                      Ngày sinh
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      className={`bg-background ${errors.dateOfBirth ? "border-destructive" : ""}`}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nationalId" className="text-[12px] text-muted-foreground">
                      CCCD / CMND
                    </Label>
                    <Input
                      id="nationalId"
                      {...register("nationalId")}
                      className={`bg-background ${errors.nationalId ? "border-destructive" : ""}`}
                    />
                    {errors.nationalId && (
                      <p className="text-xs text-destructive">{errors.nationalId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[12px] text-muted-foreground">
                    Địa chỉ
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    className={`bg-background ${errors.address ? "border-destructive" : ""}`}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Employment and contract options section */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Công việc & Hợp đồng
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="position" className="text-[12px] text-muted-foreground">
                    Chức danh (Vị trí)
                  </Label>
                  <Input
                    id="position"
                    {...register("position")}
                    className={`bg-background ${errors.position ? "border-destructive" : ""}`}
                  />
                  {errors.position && (
                    <p className="text-xs text-destructive">{errors.position.message}</p>
                  )}
                </div>

                {/* Dropdowns for status & employment contract type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-[12px] text-muted-foreground">
                      Trạng thái
                    </Label>
                    <select
                      id="status"
                      {...register("status")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {EMPLOYEE_STATUSES.map((statusKey) => (
                        <option key={statusKey} value={statusKey}>
                          {EMPLOYEE_STATUS_LABELS[statusKey]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="employeeType" className="text-[12px] text-muted-foreground">
                      Loại hợp đồng
                    </Label>
                    <select
                      id="employeeType"
                      {...register("employeeType")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {EMPLOYEE_TYPES.map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {EMPLOYEE_TYPE_LABELS[typeKey]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-[12px] text-muted-foreground">
                      Ngày bắt đầu
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register("startDate")}
                      className={`bg-background ${errors.startDate ? "border-destructive" : ""}`}
                    />
                    {errors.startDate && (
                      <p className="text-xs text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-[12px] text-muted-foreground">
                      Ngày kết thúc
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register("endDate")}
                      className={`bg-background ${errors.endDate ? "border-destructive" : ""}`}
                    />
                    {errors.endDate && (
                      <p className="text-xs text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Actions footer toolbar */}
        <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} type="button">
            Hủy
          </Button>
          <Button type="submit" form="edit-employee-form" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </AppDrawer>
  )
}
