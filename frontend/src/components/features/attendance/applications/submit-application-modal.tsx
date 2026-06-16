import { APP_TYPE_META } from "@/components/features/attendance/applications/application-type-meta.config"
import {
  buildApplicationDetail,
  INITIAL_SUBMIT_FORM,
  INPUT_CLASS,
  LABEL_CLASS,
  type SubmitApplicationForm,
} from "@/components/features/attendance/applications/submit-application-form.config"
import { SubmitApplicationTypeFields } from "@/components/features/attendance/applications/submit-application-type-fields"
import { SubmitApplicationTypePicker } from "@/components/features/attendance/applications/submit-application-type-picker"
import { Button } from "@/components/ui/button"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"

import { useState } from "react"

import { ArrowLeft, Loader2, Send, X } from "lucide-react"
import { toast } from "sonner"

export { LEAVE_TYPE_OPTIONS } from "@/components/features/attendance/applications/submit-application-form.config"

interface SubmitApplicationModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function SubmitApplicationModal({ onClose, onSuccess }: SubmitApplicationModalProps) {
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [step, setStep] = useState<"type" | "details">("type")
  const [selectedType, setSelectedType] = useState<string>("")
  const [form, setForm] = useState<SubmitApplicationForm>(INITIAL_SUBMIT_FORM)

  const set = <K extends keyof SubmitApplicationForm>(k: K, v: SubmitApplicationForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu")
      return
    }

    const built = buildApplicationDetail(selectedType, form)
    if ("error" in built) {
      toast.error(built.error)
      return
    }

    const success = await submitApplication({
      type: selectedType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      detail: built.detail,
    })

    if (success) {
      onSuccess()
      onClose()
    }
  }

  const meta = APP_TYPE_META[selectedType as keyof typeof APP_TYPE_META]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button
                type="button"
                onClick={() => setStep("type")}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 className="text-base font-bold text-foreground">
              {step === "type" ? "Chọn loại đơn" : `Tạo đơn ${meta?.label}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === "type" && (
            <SubmitApplicationTypePicker
              onSelect={(type) => {
                setSelectedType(type)
                setStep("details")
              }}
            />
          )}

          {step === "details" && meta && (
            <form id="submit-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
                <meta.icon size={16} className={meta.color} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLASS}>Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLASS}>Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <SubmitApplicationTypeFields selectedType={selectedType} form={form} set={set} />

              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Lý do (tối thiểu 5 ký tự)</label>
                <textarea
                  rows={3}
                  minLength={5}
                  placeholder="Nhập lý do..."
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
            </form>
          )}
        </div>

        {step === "details" && (
          <div className="border-t border-border px-5 py-4 flex gap-3 bg-muted">
            <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>
              Quay lại
            </Button>
            <Button type="submit" form="submit-form" disabled={isSubmitting} className="flex-1 gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Gửi đơn
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
