import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE_LABELS,
  ROLE_LABELS,
} from "@/config/entities/employee.config"
import { useEmployeeCreateModal } from "@/hooks/employees/useEmployeeCreateModal"
import { X } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function EmployeeCreateModal({ isOpen, onClose }: Props) {
  const { register, handleSubmit, errors, isPending, handleClose } = useEmployeeCreateModal(onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Thêm nhân sự mới</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="create-employee-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Họ và tên *</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Nhập họ tên"
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Nhập username"
                  className={errors.username ? "border-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Nhập email"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Mật khẩu tạm"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" {...register("phone")} placeholder="Nhập SĐT" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="position">Vị trí</Label>
                <Input id="position" {...register("position")} placeholder="Ví dụ: Tech Lead" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role">Nhóm quyền</Label>
                <select
                  id="role"
                  {...register("role")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {EMPLOYEE_ROLES.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_LABELS[roleKey]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employeeType">Loại hợp đồng</Label>
                <select
                  id="employeeType"
                  {...register("employeeType")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {EMPLOYEE_TYPES.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {EMPLOYEE_TYPE_LABELS[typeKey]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 mt-auto">
          <Button variant="outline" onClick={handleClose} type="button">
            Hủy
          </Button>
          <Button type="submit" form="create-employee-form" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu nhân sự"}
          </Button>
        </div>
      </div>
    </div>
  )
}
