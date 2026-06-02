import { APPLICATION_TYPES, REGIME_TYPES } from "@/config/entities/attendance.config"
import { ROLE } from "@/config/entities/employee.config"
import { APPROVAL_CATEGORY } from "@/config/rules/approval.config"
import { useApplicationDashboard } from "@/hooks/application/useApplicationDashboard"
import { type IApprovalItem } from "@/lib/api/approval.api"

import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  HelpCircle,
  KeyRound,
  Search,
  UserPlus,
  X,
} from "lucide-react"
import { toast } from "sonner"

export default function ApplicationDashboard() {
  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    selectedApproval,
    setSelectedApproval,
    rejectingItem,
    setRejectingItem,
    rejectReason,
    setRejectReason,
    isProcessing,
    newTempPassword,
    setNewTempPassword,
    approvedEmployeeName,
    setApprovedEmployeeName,
    user,
    handleApprove,
    handleRejectSubmit,
    filteredApprovals,
    pendingCount,
    appCount,
    pwCount,
    recruitmentCount,
  } = useApplicationDashboard()

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case APPROVAL_CATEGORY.APPLICATION:
        return {
          label: "Đơn ứng dụng",
          icon: FileText,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        }
      case APPROVAL_CATEGORY.PASSWORD_RESET:
        return {
          label: "Reset mật khẩu",
          icon: KeyRound,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        }
      case APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL:
        return {
          label: "Tuyển dụng",
          icon: UserPlus,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        }
      default:
        return {
          label: "Khác",
          icon: HelpCircle,
          color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
        }
    }
  }

  const formatDetails = (item: IApprovalItem) => {
    const { details, category } = item
    if (category === APPROVAL_CATEGORY.APPLICATION) {
      const typeLabels: Record<string, string> = {
        [APPLICATION_TYPES[0]]: "Xin nghỉ phép",
        [APPLICATION_TYPES[1]]: "Làm thêm giờ (OT)",
        [APPLICATION_TYPES[2]]: "Làm việc từ xa (WFH)",
        [APPLICATION_TYPES[3]]: "Đổi ca làm việc",
        [APPLICATION_TYPES[4]]: "Công tác",
        [APPLICATION_TYPES[5]]: "Nghỉ thai sản",
        [APPLICATION_TYPES[6]]: "Nghỉ thai sản (nam)",
        [APPLICATION_TYPES[7]]: "Nghỉ ốm",
      }
      return `${typeLabels[details.type!] || "Yêu cầu"} từ ${new Date(details.startDate!).toLocaleDateString("vi-VN")} đến ${new Date(details.endDate!).toLocaleDateString("vi-VN")}`
    }
    if (category === APPROVAL_CATEGORY.PASSWORD_RESET) {
      return "Yêu cầu cấp lại mật khẩu cho tài khẩu"
    }
    if (category === APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL) {
      return `Yêu cầu tuyển dụng vị trí ${details.position} (Số lượng: ${details.headcount})`
    }
    return "Chi tiết yêu cầu"
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Duyệt đơn từ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và phê duyệt các đơn từ của nhân viên dựa theo vai trò{" "}
            {user?.role === ROLE.ADMIN
              ? "Admin"
              : user?.role === ROLE.GENERAL_MANAGER
                ? "General Manager"
                : user?.role === ROLE.HR_MANAGER
                  ? "HR Manager"
                  : "Team Leader"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
          <Clock size={14} />
          <span>Có {pendingCount} đơn chờ duyệt</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filters Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">Bộ lọc phân hệ</h3>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Tất cả</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeCategory === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {pendingCount}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory(APPROVAL_CATEGORY.APPLICATION)}
                className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeCategory === APPROVAL_CATEGORY.APPLICATION
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>Đơn ứng dụng</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeCategory === APPROVAL_CATEGORY.APPLICATION ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {appCount}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory(APPROVAL_CATEGORY.PASSWORD_RESET)}
                className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeCategory === APPROVAL_CATEGORY.PASSWORD_RESET
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <KeyRound size={16} />
                  <span>Reset mật khẩu</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeCategory === APPROVAL_CATEGORY.PASSWORD_RESET ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {pwCount}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory(APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL)}
                className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeCategory === APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus size={16} />
                  <span>Tuyển dụng</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeCategory === APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {recruitmentCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative w-full">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên gửi đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border bg-card text-foreground rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* List items */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm">Đang tải danh sách đơn...</span>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border text-center p-6">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Không có đơn cần duyệt</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Hiện tại không tìm thấy bất kỳ yêu cầu chờ phê duyệt nào thỏa mãn bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredApprovals.map((item) => {
                const cfg = getCategoryDetails(item.category)
                const Icon = cfg.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedApproval(item)}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-card hover:bg-secondary/20 border border-border rounded-xl shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Left icon badge */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${cfg.color}`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {item.employeeName}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-foreground font-semibold mt-1.5 line-clamp-1">
                          {formatDetails(item)}
                        </p>
                        {item.details.reason && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                            Lý do: {item.details.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto shrink-0"
                      onClick={(e) => e.stopPropagation()} // Prevent details modal open
                    >
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Duyệt</span>
                      </button>

                      <button
                        onClick={() => setRejectingItem(item)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <X size={14} />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-lg p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryDetails(selectedApproval.category).color}`}
                >
                  {selectedApproval.category === APPROVAL_CATEGORY.APPLICATION
                    ? "Đơn ứng dụng"
                    : selectedApproval.category === APPROVAL_CATEGORY.PASSWORD_RESET
                      ? "Reset mật khẩu"
                      : "Tuyển dụng"}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-2">
                  Chi tiết yêu cầu phê duyệt
                </h3>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 text-sm rounded-lg bg-secondary/20 p-4 border border-border/50">
              <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                <span className="text-muted-foreground font-medium">Người gửi:</span>
                <span className="col-span-2 text-foreground font-semibold">
                  {selectedApproval.employeeName}
                </span>
              </div>

              <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                <span className="text-muted-foreground font-medium">Thời gian tạo:</span>
                <span className="col-span-2 text-foreground font-semibold">
                  {new Date(selectedApproval.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>

              {selectedApproval.category === APPROVAL_CATEGORY.APPLICATION && (
                <>
                  <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground font-medium">Loại đơn:</span>
                    <span className="col-span-2 text-foreground font-semibold uppercase">
                      {selectedApproval.details.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground font-medium">Thời gian nghỉ:</span>
                    <span className="col-span-2 text-foreground font-semibold">
                      {new Date(selectedApproval.details.startDate!).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(selectedApproval.details.endDate!).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {selectedApproval.details.regimeType && (
                    <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-medium">Chế độ:</span>
                      <span className="col-span-2 text-foreground font-semibold">
                        {selectedApproval.details.regimeType === REGIME_TYPES[0]
                          ? "Có lương"
                          : "Nghỉ không lương"}
                      </span>
                    </div>
                  )}
                </>
              )}

              {selectedApproval.category === APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL && (
                <>
                  <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground font-medium">Vị trí tuyển:</span>
                    <span className="col-span-2 text-foreground font-semibold">
                      {selectedApproval.details.position}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground font-medium">Số lượng tuyển:</span>
                    <span className="col-span-2 text-foreground font-semibold">
                      {selectedApproval.details.headcount} nhân viên
                    </span>
                  </div>
                  {selectedApproval.details.expectedStart && (
                    <div className="grid grid-cols-3 border-b border-border/30 pb-2">
                      <span className="text-muted-foreground font-medium">Bắt đầu dự kiến:</span>
                      <span className="col-span-2 text-foreground font-semibold">
                        {new Date(selectedApproval.details.expectedStart!).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}

              {selectedApproval.details.reason && (
                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-muted-foreground font-medium">Lý do:</span>
                  <span className="text-foreground">{selectedApproval.details.reason}</span>
                </div>
              )}

              {selectedApproval.details.note && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-medium">Ghi chú:</span>
                  <span className="text-foreground">{selectedApproval.details.note}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setRejectingItem(selectedApproval)}
                disabled={isProcessing}
                className="bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                Từ chối
              </button>

              <button
                onClick={() => handleApprove(selectedApproval)}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-card border border-border w-full max-w-md rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Nhập lý do từ chối</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng cung cấp lý do chi tiết từ chối yêu cầu của{" "}
                <strong>{rejectingItem.employeeName}</strong>.
              </p>
            </div>

            <textarea
              required
              rows={3}
              placeholder="Nhập lý do từ chối tại đây..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-transparent text-foreground text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-destructive focus:border-destructive"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null)
                  setRejectReason("")
                }}
                className="px-4 py-2 border border-border text-foreground hover:bg-secondary rounded-full text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-sm cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Temporary Password Dialog Modal */}
      {newTempPassword && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-lg p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <Check size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Phê duyệt cấp lại mật khẩu</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">
                Yêu cầu reset mật khẩu của <strong>{approvedEmployeeName}</strong> đã được phê
                duyệt. Hệ thống đã tự động tạo một mật khẩu tạm thời mới.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-secondary/35 border border-border rounded-lg text-center relative group">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Mật khẩu tạm thời mới
              </span>
              <div className="text-lg font-mono font-bold text-primary select-all tracking-wide py-1">
                {newTempPassword}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newTempPassword)
                  toast.success("Đã sao chép mật khẩu vào clipboard!")
                }}
                className="mt-1 text-xs text-primary hover:underline cursor-pointer focus:outline-none"
              >
                Sao chép mật khẩu
              </button>
            </div>

            <div className="bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-500 rounded-lg p-3 text-xs leading-relaxed">
              <strong>Lưu ý:</strong> Mật khẩu này chỉ được hiển thị{" "}
              <strong>một lần duy nhất</strong>. Hãy lưu lại hoặc sao chép và gửi trực tiếp cho nhân
              viên để họ đăng nhập và đổi mật khẩu mới.
            </div>

            <button
              onClick={() => {
                setNewTempPassword("")
                setApprovedEmployeeName("")
              }}
              className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-sm cursor-pointer shadow-sm"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
