import { LEAVE_TYPE_OPTIONS, INPUT_CLASS, LABEL_CLASS, toggleClass } from "@/components/features/attendance/applications/submit-application-form.config"
import type { SubmitApplicationForm } from "@/components/features/attendance/applications/submit-application-form.config"

interface SubmitApplicationTypeFieldsProps {
  selectedType: string
  form: SubmitApplicationForm
  set: <K extends keyof SubmitApplicationForm>(k: K, v: SubmitApplicationForm[K]) => void
}

export function SubmitApplicationTypeFields({
  selectedType,
  form,
  set,
}: SubmitApplicationTypeFieldsProps) {
  return (
    <>
      {selectedType === "leave" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Loại nghỉ phép *</label>
            <select
              value={form.leaveType}
              onChange={(e) => set("leaveType", e.target.value)}
              className={`w-full ${INPUT_CLASS}`}
            >
              {LEAVE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Chế độ lương *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["paid", "unpaid"] as const).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => set("leaveRegimeType", rt)}
                  className={`py-2 rounded-lg border-2 text-sm font-semibold ${toggleClass(form.leaveRegimeType === rt)}`}
                >
                  {rt === "paid" ? "Có lương" : "Không lương"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedType === "overtime" && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>ID Ca làm việc *</label>
          <input
            type="text"
            required
            placeholder="CUID ca làm việc..."
            value={form.employeeShiftId}
            onChange={(e) => set("employeeShiftId", e.target.value)}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
      )}

      {selectedType === "late_early" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>ID Ca làm việc *</label>
            <input
              type="text"
              required
              placeholder="CUID ca làm việc..."
              value={form.employeeShiftId}
              onChange={(e) => set("employeeShiftId", e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Loại *</label>
            <div className="grid grid-cols-2 gap-2">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("isLate", v)}
                  className={`py-2 rounded-lg border-2 text-sm font-semibold ${toggleClass(form.isLate === v)}`}
                >
                  {v ? "Đi muộn" : "Về sớm"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Số phút (1–480) *</label>
            <input
              type="number"
              required
              min={1}
              max={480}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </>
      )}

      {selectedType === "shift_swap" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>ID Ca của bạn *</label>
            <input
              type="text"
              required
              placeholder="CUID ca làm việc..."
              value={form.employeeShiftId}
              onChange={(e) => set("employeeShiftId", e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>ID Nhân viên muốn đổi</label>
            <input
              type="text"
              placeholder="CUID nhân viên..."
              value={form.swapWithEmployeeId}
              onChange={(e) => set("swapWithEmployeeId", e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
        </>
      )}

      {selectedType === "work_from_home" && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Địa điểm làm việc</label>
          <input
            type="text"
            placeholder="VD: Tại nhà, Quán cà phê..."
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      )}

      {selectedType === "business_trip" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Địa điểm công tác *</label>
            <input
              type="text"
              required
              placeholder="VD: Hà Nội, TP.HCM..."
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Mục đích chuyến đi</label>
            <input
              type="text"
              placeholder="Mô tả mục đích..."
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </>
      )}

      {selectedType === "regime" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Chế độ lương *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["paid", "unpaid"] as const).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => set("regimeType", rt)}
                  className={`py-2 rounded-lg border-2 text-sm font-semibold ${toggleClass(form.regimeType === rt)}`}
                >
                  {rt === "paid" ? "Có lương" : "Không lương"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Số phút giảm/ngày *</label>
            <input
              type="number"
              required
              min={0}
              max={480}
              value={form.reducedMinutesPerDay}
              onChange={(e) => set("reducedMinutesPerDay", Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </>
      )}
    </>
  )
}
