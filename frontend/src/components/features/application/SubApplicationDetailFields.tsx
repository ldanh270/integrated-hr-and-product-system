import { APPLICATION_TYPES, REGIME_TYPE } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
import { formatDate, minutesToTime } from "@/lib/utils"
import { SubApplicationField } from "./SubApplicationField"

function getShiftLabel(shift?: { name?: string; startTime?: number; endTime?: number } | null) {
  if (!shift) return null
  const time = `${minutesToTime(shift.startTime ?? 0)} - ${minutesToTime(shift.endTime ?? 0)}`
  return shift.name ? `${shift.name} (${time})` : time
}

export function SubApplicationDetailFields({ app }: { app: IApplication }) {
  const swapDetail = (app.shiftSwapDetail || app.detail) as {
    employeeShiftId?: string
    employeeShift?: { shift?: { name?: string; startTime?: number; endTime?: number } }
    swapWithEmployeeId?: string
    swapWithEmployee?: { fullName?: string }
    swapWithShiftId?: string
    swapWithShift?: { shift?: { name?: string; startTime?: number; endTime?: number } }
    partnerApprovalStatus?: string
  } | undefined
  const detail = app.detail as {
    employeeShift?: { shift?: { name?: string; startTime?: number; endTime?: number } }
    isLate?: boolean
    durationMinutes?: number
    location?: string
    leaveType?: string
    regimeType?: string
  } | undefined

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
      {app.type === APPLICATION_TYPES.LEAVE.LABEL && (
        <>
          <SubApplicationField label="Kiểu nghỉ" value={String(detail?.leaveType ?? "—")} />
          <SubApplicationField
            label="Chế độ"
            value={detail?.regimeType === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
          />
          <SubApplicationField label="Từ ngày" value={formatDate(app.startDate)} />
          <SubApplicationField label="Đến ngày" value={formatDate(app.endDate)} />
          {app.reason && <SubApplicationField label="Lý do" value={app.reason} span />}
        </>
      )}

      {app.type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
        <>
          <SubApplicationField label="Ngày" value={formatDate(app.startDate)} />
          <SubApplicationField
            label="Ca của bạn"
            value={getShiftLabel(swapDetail?.employeeShift?.shift) ?? swapDetail?.employeeShiftId ?? "—"}
          />
          {swapDetail?.swapWithEmployee && (
            <SubApplicationField label="Đổi với" value={swapDetail.swapWithEmployee.fullName ?? "—"} />
          )}
          {swapDetail?.swapWithShift && (
            <SubApplicationField label="Ca đổi" value={getShiftLabel(swapDetail.swapWithShift.shift) ?? "—"} />
          )}
          <SubApplicationField
            label="Phản hồi đối tác"
            value={
              swapDetail?.partnerApprovalStatus === "approved"
                ? "Đã đồng ý"
                : swapDetail?.partnerApprovalStatus === "rejected"
                  ? "Đã từ chối"
                  : "Đang chờ"
            }
          />
        </>
      )}

      {app.type === APPLICATION_TYPES.OVERTIME.LABEL && (
        <>
          <SubApplicationField label="Ngày tăng ca" value={formatDate(app.startDate)} />
          <SubApplicationField
            label="Ca làm việc"
            value={getShiftLabel(detail?.employeeShift?.shift) ?? "—"}
          />
          {app.reason && <SubApplicationField label="Lý do" value={app.reason} span />}
        </>
      )}

      {app.type === APPLICATION_TYPES.LATE_EARLY.LABEL && (
        <>
          <SubApplicationField label="Ngày làm việc" value={formatDate(app.startDate)} />
          <SubApplicationField
            label="Loại"
            value={detail?.isLate ? "Đi muộn" : "Về sớm"}
          />
          <SubApplicationField
            label="Số phút"
            value={`${detail?.durationMinutes ?? "—"} phút`}
          />
        </>
      )}

      {app.type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
        <>
          <SubApplicationField label="Từ ngày" value={formatDate(app.startDate)} />
          <SubApplicationField label="Đến ngày" value={formatDate(app.endDate)} />
          {detail?.location && (
            <SubApplicationField label="Hình thức" value={detail.location} />
          )}
        </>
      )}

      {app.rejectReason && (
        <SubApplicationField label="Lý do từ chối" value={app.rejectReason} span className="text-red-600" />
      )}
    </div>
  )
}
