import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRoles } from "@/hooks/security/queries/use-security-query"
import type { IEmployeeWizardFormData } from "@/types/employee-wizard.types"
import { ChevronDown, ChevronUp } from "lucide-react"

interface JobTabProps {
  formData: IEmployeeWizardFormData
  updateField: <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K]
  ) => void
}

export function JobTab({ formData, updateField }: JobTabProps) {
  const { data: rolesData } = useRoles()
  const roles = Array.isArray(rolesData?.data) ? rolesData.data : []

  const [openJobInfo, setOpenJobInfo] = useState(true)
  const [openAccountInfo, setOpenAccountInfo] = useState(true)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Thông tin công việc ────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenJobInfo(!openJobInfo)}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/20 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openJobInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            Thông tin công việc
          </div>
        </button>

        {openJobInfo && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Mã nhân sự <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Outfiz00036"
                value={formData.employeeCode}
                onChange={(e) => updateField("employeeCode", e.target.value)}
                className="rounded-full bg-muted/40 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Nơi làm việc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.workLocation}
                onValueChange={(val) => updateField("workLocation", val)}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Nơi làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hanoi">Hà Nội - Trụ sở chính</SelectItem>
                  <SelectItem value="hcm">TP. Hồ Chí Minh - Chi nhánh</SelectItem>
                  <SelectItem value="danang">Đà Nẵng - Văn phòng đại diện</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Bộ phận <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(val) => updateField("department", val)}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Bộ phận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">Phòng Nhân sự</SelectItem>
                  <SelectItem value="it">Phòng Công nghệ Thông tin</SelectItem>
                  <SelectItem value="sales">Phòng Kinh doanh</SelectItem>
                  <SelectItem value="accounting">Phòng Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Vị trí <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Vị trí / Chức danh"
                value={formData.positionId}
                onChange={(e) => updateField("positionId", e.target.value)}
                className="rounded-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Ngày vào làm <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="rounded-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Hình thức làm việc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.workScheduleType}
                onValueChange={(val) => updateField("workScheduleType", val)}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Hình thức làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Chính thức (Full-time)</SelectItem>
                  <SelectItem value="part_time">Bán thời gian (Part-time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Quản lý trực tiếp</Label>
              <Input
                placeholder="Chọn nhân sự quản lý"
                value={formData.managerId}
                onChange={(e) => updateField("managerId", e.target.value)}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Thông tin tài khoản ────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenAccountInfo(!openAccountInfo)}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/20 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openAccountInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            Thông tin tài khoản
          </div>
        </button>

        {openAccountInfo && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tên đăng nhập <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Outfiz00036"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  disabled={formData.autoGenUsername}
                  className="rounded-full bg-muted/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Mật khẩu <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  disabled={formData.autoGenPassword}
                  className="rounded-full bg-muted/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Nhóm quyền <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => updateField("role", val)}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Nhóm quyền" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="EMPLOYEE">Nhân viên (Employee)</SelectItem>
                        <SelectItem value="HR_MANAGER">Quản lý HR (HR Manager)</SelectItem>
                        <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoGenUsername"
                  checked={formData.autoGenUsername}
                  onChange={(e) => updateField("autoGenUsername", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="autoGenUsername"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Tự động tạo tên đăng nhập (Mã nhân viên)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoGenPassword"
                  checked={formData.autoGenPassword}
                  onChange={(e) => updateField("autoGenPassword", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="autoGenPassword"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Tự động tạo mật khẩu
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
