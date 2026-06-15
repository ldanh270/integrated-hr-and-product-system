"use client"

import { useAuthStore } from "@/store/auth-store"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { APPLICATION_STATUS, APPLICATION_TYPES, APPLICATION_TYPE_LABELS, LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get("type") || "leave"
  
  const { user } = useAuthStore()
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const typeLabel = APPLICATION_TYPE_LABELS[type] || "đơn từ"

  const handleBack = () => {
    navigate(-1)
  }

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    // leave
    leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    // overtime / late_early / shift_swap
    employeeShiftId: "",
    // late_early specific
    durationMinutes: 30,
    isLate: true,
    // shift_swap
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    // work_from_home
    location: "",
    // business_trip
    destination: "",
    purpose: "",
    // regime
    regimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    reducedMinutesPerDay: 0,
    applyToStart: false,
    applyToEnd: false,
    documentUrl: "",
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async () => {
    if (!form.startDate) return
    
    let detail: Record<string, unknown> = {}

    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim()) detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case APPLICATION_TYPES.BUSINESS_TRIP.LABEL:
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break

      case APPLICATION_TYPES.REGIME.LABEL:
        detail = {
          regimeType: form.regimeType,
          reducedMinutesPerDay: form.reducedMinutesPerDay,
          applyToStart: form.applyToStart,
          applyToEnd: form.applyToEnd,
        }
        if (form.documentUrl.trim()) detail.documentUrl = form.documentUrl.trim()
        break
    }

    const success = await submitApplication({
      type,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      detail,
    })

    if (success) {
      navigate(-1)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full animate-in fade-in duration-300 overflow-hidden">
      {/* Header Breadcrumbs */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <button 
          onClick={handleBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-primary hover:bg-blue-50 transition-colors mr-3"
        >
          <Plus size={16} strokeWidth={2.5} className="rotate-45" /> {/* Close/Back icon */}
        </button>
        <span className="text-[15px] font-semibold text-slate-800">Đơn thư</span>
        <ChevronRight size={16} className="text-slate-400 mx-2" />
        <span className="text-[15px] text-slate-600">Tạo mới {typeLabel.toLowerCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        
        {/* Section 1: Thông tin đơn */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-800">Thông tin đơn</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Nhân sự <span className="text-red-500">*</span></label>
              <select className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                <option>{user?.fullName || "Người dùng"} - {user?.username}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Người duyệt <span className="text-red-500">*</span></label>
              <select className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                <option value="">Chọn nhân sự</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Thời gian */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-800">Thời gian</h3>
          </div>
          <div className="p-5">
            {type === APPLICATION_TYPES.LEAVE.LABEL ? (
              <>
                <p className="text-sm text-slate-700 mb-4">
                  Số phép còn lại: <span className="font-semibold text-red-600">0</span> ngày phép
                </p>
                
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-medium flex items-center gap-2">
                          <button className="h-4 w-4 rounded-full border border-slate-400 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary">
                            <Plus size={10} />
                          </button>
                          Kiểu nghỉ <span className="text-red-500">*</span>
                        </th>
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                        <th className="px-4 py-3 font-medium">Số ngày</th>
                        <th className="px-4 py-3 font-medium">Dùng phép</th>
                        <th className="px-4 py-3 font-medium">Lý do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="px-4 py-3">
                          <select 
                            value={form.leaveType}
                            onChange={(e) => set("leaveType", e.target.value)}
                            className="w-full h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value={LEAVE_TYPE.ANNUAL_LEAVE}>Nghỉ phép năm</option>
                            <option value={LEAVE_TYPE.SICK_LEAVE}>Nghỉ ốm</option>
                            <option value={LEAVE_TYPE.MATERNITY_LEAVE}>Thai sản</option>
                            <option value={LEAVE_TYPE.UNPAID_LEAVE}>Không lương</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 flex gap-2 items-center">
                          <input 
                            type="date"
                            value={form.startDate}
                            onChange={(e) => set("startDate", e.target.value)}
                            className="w-32 h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-slate-400">-</span>
                          <input 
                            type="date"
                            value={form.endDate}
                            onChange={(e) => set("endDate", e.target.value)}
                            className="w-32 h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number"
                            disabled
                            placeholder="Tự động"
                            className="w-20 h-8 px-2 text-sm border border-slate-300 bg-slate-50 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={form.leaveRegimeType}
                            onChange={(e) => set("leaveRegimeType", e.target.value as "paid" | "unpaid")}
                            className="w-24 h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value={REGIME_TYPE.PAID}>Có hưởng lương</option>
                            <option value={REGIME_TYPE.UNPAID}>Không lương</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text"
                            placeholder="Nhập lý do"
                            value={form.reason}
                            onChange={(e) => set("reason", e.target.value)}
                            className="w-full h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Common fields for other types */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input 
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Ngày kết thúc</label>
                  <input 
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                {/* Specific fields */}
                {[APPLICATION_TYPES.OVERTIME.LABEL, APPLICATION_TYPES.LATE_EARLY.LABEL, APPLICATION_TYPES.SHIFT_SWAP.LABEL].includes(type) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Mã ca làm việc <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      placeholder="Nhập ID ca làm việc"
                      value={form.employeeShiftId}
                      onChange={(e) => set("employeeShiftId", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
                
                {type === APPLICATION_TYPES.LATE_EARLY.LABEL && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Số phút <span className="text-red-500">*</span></label>
                      <input 
                        type="number"
                        min="1"
                        max="480"
                        value={form.durationMinutes}
                        onChange={(e) => set("durationMinutes", parseInt(e.target.value))}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-sm text-slate-700 mt-6 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.isLate}
                          onChange={(e) => set("isLate", e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <span>Là đi muộn (bỏ chọn nếu về sớm)</span>
                      </label>
                    </div>
                  </>
                )}

                {type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Địa điểm làm việc</label>
                    <input 
                      type="text"
                      placeholder="Nhập địa điểm làm việc"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {type === APPLICATION_TYPES.BUSINESS_TRIP.LABEL && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Nơi công tác <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        placeholder="Nhập nơi công tác"
                        value={form.destination}
                        onChange={(e) => set("destination", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Mục đích</label>
                      <input 
                        type="text"
                        placeholder="Nhập mục đích công tác"
                        value={form.purpose}
                        onChange={(e) => set("purpose", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </>
                )}

                {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">ID nhân sự đổi ca</label>
                      <input 
                        type="text"
                        placeholder="Nhập ID nhân sự"
                        value={form.swapWithEmployeeId}
                        onChange={(e) => set("swapWithEmployeeId", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">ID ca làm việc của họ</label>
                      <input 
                        type="text"
                        placeholder="Nhập ID ca"
                        value={form.swapWithShiftId}
                        onChange={(e) => set("swapWithShiftId", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </>
                )}

                {type === APPLICATION_TYPES.REGIME.LABEL && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Chế độ <span className="text-red-500">*</span></label>
                      <select 
                        value={form.regimeType}
                        onChange={(e) => set("regimeType", e.target.value as "paid" | "unpaid")}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value={REGIME_TYPE.PAID}>Có hưởng lương</option>
                        <option value={REGIME_TYPE.UNPAID}>Không lương</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Số phút giảm mỗi ngày</label>
                      <input 
                        type="number"
                        min="0"
                        max="480"
                        value={form.reducedMinutesPerDay}
                        onChange={(e) => set("reducedMinutesPerDay", parseInt(e.target.value))}
                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 flex items-center gap-6 mt-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.applyToStart}
                          onChange={(e) => set("applyToStart", e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <span>Áp dụng vào đầu giờ</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.applyToEnd}
                          onChange={(e) => set("applyToEnd", e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <span>Áp dụng vào cuối giờ</span>
                      </label>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-slate-700">Lý do/Ghi chú</label>
                  <textarea 
                    rows={2}
                    placeholder="Nhập lý do hoặc ghi chú chi tiết"
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    className="w-full p-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="flex justify-end gap-3 pb-8">
          <button 
            onClick={handleBack}
            className="px-6 py-2 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !form.startDate}
            className="px-6 py-2 rounded-md bg-primary text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đơn"}
          </button>
        </div>

      </div>
    </div>
  )
}
