import { useParams, useNavigate } from "react-router-dom"
import { useEmployee } from "@/hooks/useEmployees"
import { useAuthStore } from "@/store/auth-store"
import { PageCard, SectionHeader, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, User, Mail, Phone, Calendar, Briefcase, Building, MapPin, Hash } from "lucide-react"
import { useState } from "react"
import { EmployeeEditModal } from "@/components/features/employees/EmployeeEditModal"

export default function ViewEmployee() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: employee, isLoading, error } = useEmployee(id!)
  const user = useAuthStore((state) => state.user)
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager"
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  if (isLoading) {
    return <div className="container max-w-5xl px-6 py-12 text-center text-muted-foreground">Đang tải hồ sơ...</div>
  }

  if (error || !employee) {
    return (
      <div className="container max-w-5xl px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-muted-foreground mb-4">Không tìm thấy thông tin nhân sự này.</p>
        <Button onClick={() => navigate("/hrm/employees")} variant="outline">Quay lại danh sách</Button>
      </div>
    )
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'active': return <StatusPill label="Đang làm việc" variant="success" />
      case 'inactive': return <StatusPill label="Tạm nghỉ" variant="neutral" />
      case 'on_leave': return <StatusPill label="Nghỉ phép" variant="warning" />
      case 'terminated': return <StatusPill label="Đã nghỉ việc" variant="danger" />
      default: return <StatusPill label={status} variant="neutral" />
    }
  }

  const getTypeDisplay = (type: string) => {
    switch(type) {
      case 'full_time': return "Chính thức"
      case 'part_time': return "Bán thời gian"
      case 'contractor': return "Hợp đồng"
      case 'intern': return "Thực tập"
      default: return type
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa cập nhật"
    const d = new Date(dateStr)
    return d.toLocaleDateString("vi-VN")
  }

  return (
    <div className="container max-w-5xl px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/hrm/employees")} className="h-8 px-2">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ nhân sự</h1>
        </div>
        {isAdminOrManager && (
          <Button onClick={() => setIsEditModalOpen(true)} className="gap-2">
            <Edit size={16} /> Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <PageCard className="overflow-hidden p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-4 border-background shadow-md mb-4 shrink-0">
              {employee.avatar?.url ? (
                <img src={employee.avatar.url} alt={employee.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="opacity-50" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-1">{employee.fullName}</h2>
            <p className="text-muted-foreground text-sm mb-3">@{employee.username}</p>
            
            <div className="mb-4">
              {getStatusDisplay(employee.status)}
            </div>
            
            <div className="w-full pt-4 border-t border-border mt-2 space-y-3 text-left text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Briefcase size={16} />
                <span className="text-foreground">{employee.position || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building size={16} />
                <span className="text-foreground">{getTypeDisplay(employee.employeeType)}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <User size={16} />
                <span className="text-foreground capitalize">{employee.role}</span>
              </div>
            </div>
          </PageCard>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <PageCard>
            <SectionHeader title="Thông tin liên hệ" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail size={14} /> Email
                </div>
                <div className="font-medium">{employee.email}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone size={14} /> Số điện thoại
                </div>
                <div className="font-medium">{employee.phone || "Chưa cập nhật"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin size={14} /> Địa chỉ
                </div>
                <div className="font-medium">{employee.address || "Chưa cập nhật"}</div>
              </div>
            </div>
          </PageCard>

          <PageCard>
            <SectionHeader title="Thông tin cá nhân" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} /> Ngày sinh
                </div>
                <div className="font-medium">{formatDate(employee.dateOfBirth)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash size={14} /> CCCD / CMND
                </div>
                <div className="font-medium">{employee.nationalId || "Chưa cập nhật"}</div>
              </div>
            </div>
          </PageCard>

          <PageCard>
            <SectionHeader title="Thông tin hợp đồng" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} /> Ngày vào làm
                </div>
                <div className="font-medium">{formatDate(employee.startDate)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} /> Ngày kết thúc
                </div>
                <div className="font-medium">{formatDate(employee.endDate)}</div>
              </div>
            </div>
          </PageCard>
        </div>
      </div>

      <EmployeeEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={employee} />
    </div>
  )
}
