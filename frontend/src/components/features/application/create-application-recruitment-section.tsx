import type { ApplicationFormState } from "@/hooks/application/useCreateApplicationForm"

import { Trash2 } from "lucide-react"

interface Props {
  form: ApplicationFormState
  set: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  formIndex?: number
  onRemove?: () => void
}

/** Renders the position, headcount, and requirements fields for a recruitment proposal. */
export function CreateApplicationRecruitmentSection({ form, set, formIndex, onRemove }: Props) {
  return (
    <section className="relative flex shrink-0 flex-col overflow-visible rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border bg-muted/50 rounded-t-lg flex items-center gap-3">
        {formIndex !== undefined && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {formIndex + 1}
          </div>
        )}
        <h3 className="font-semibold text-[15px] text-foreground flex-1">Thông tin tuyển dụng</h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-destructive text-sm flex items-center gap-1.5 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            <Trash2 size={15} /> Xóa
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-slate-700">Vị trí cần tuyển</label>
          <input
            type="text"
            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            placeholder="VD: Lập trình viên Backend..."
            value={form.positionName}
            onChange={(e) => set("positionName", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Số lượng</label>
          <input
            type="number"
            min="1"
            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.quantity}
            onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-slate-700">Yêu cầu / Mô tả công việc</label>
          <textarea
            className="min-h-[100px] w-full resize-y rounded-xl border border-input bg-background p-4 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            placeholder="Yêu cầu kỹ năng, kinh nghiệm..."
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
