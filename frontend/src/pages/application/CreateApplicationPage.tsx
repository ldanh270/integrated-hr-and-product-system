"use client"

import {
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
  BATCHABLE_APPLICATION_TYPES,
} from "@/config/entities/attendance.config"
import { useAuthStore } from "@/store/auth-store"

import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useCreateApplicationForm } from "./hooks/useCreateApplicationForm"
import { CreateApplicationInfoSection } from "./components/CreateApplicationInfoSection"
import { CreateApplicationTimeSection } from "./components/CreateApplicationTimeSection"
import { cn } from "@/lib/utils"

export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get("type") || "leave"

  const { user } = useAuthStore()

  const {
    items,
    addItem,
    removeItem,
    setItemField,
    assignedToId,
    setAssignedToId,
    approvers,
    employees,
    isSubmitting,
    handleSubmit,
  } = useCreateApplicationForm(type)

  const typeLabel = Object.entries(APPLICATION_TYPE_LABELS).find(([k]) => k === type)?.[1] || "đơn từ"
  const isBatchable = (BATCHABLE_APPLICATION_TYPES as readonly string[]).includes(type)
  const isMultiple = items.length > 1

  const handleBack = () => {
    navigate(-1)
  }

  // Shared info section — use first item's assignedToId (shared across all)
  // The "Thông tin đơn" section is shown once for all items in the batch
  const sharedForm = {
    ...items[0],
    assignedToId,
  } as any

  const sharedSet = <K extends string>(k: K, v: any) => {
    if (k === "assignedToId") {
      setAssignedToId(v as string)
    } else {
      setItemField(0, k as any, v)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background w-full animate-in fade-in duration-300 overflow-hidden">
      {/* Header Breadcrumbs */}
      <div className="flex items-center px-6 py-4 bg-background border-b border-border shadow-sm z-10 shrink-0">
        <button
          onClick={handleBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors mr-3"
        >
          <Plus size={16} strokeWidth={2.5} className="rotate-45" />
        </button>
        <span className="text-[15px] font-semibold text-foreground">Đơn thư</span>
        <ChevronRight size={16} className="text-muted-foreground/70 mx-2" />
        <span className="text-[15px] text-muted-foreground">Tạo mới {typeLabel.toLowerCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1400px] mx-auto w-full">
        {/* Section 1: Thông tin đơn (shared across batch) */}
        <CreateApplicationInfoSection
          type={type}
          form={sharedForm}
          set={sharedSet}
          user={user}
          approvers={approvers}
        />

        {/* Section 2: Multi-item form entries */}
        {type !== APPLICATION_TYPES.RESIGNATION.LABEL && (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative rounded-xl border border-border shadow-sm overflow-hidden transition-all",
                  isMultiple && "border-l-4 border-l-primary/40",
                )}
              >
                {/* Item header (only shown in multi mode) */}
                {isMultiple && (
                  <div className="flex items-center justify-between px-5 py-2.5 bg-muted/40 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {typeLabel}
                      </span>
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                        title="Xóa đơn này"
                      >
                        <Trash2 size={12} />
                        Xóa
                      </button>
                    )}
                  </div>
                )}

                {/* Time section for this item */}
                <div className={cn(isMultiple && "border-t-0")}>
                  <CreateApplicationTimeSection
                    type={type}
                    form={item}
                    set={(k, v) => setItemField(idx, k, v)}
                    myEmployeeShift={item._myEmployeeShift}
                    partnerEmployeeShift={item._partnerEmployeeShift}
                    employees={employees}
                  />
                </div>
              </div>
            ))}

            {/* Add more button — only for batchable types */}
            {isBatchable && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={addItem}
                  className="w-fit flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-[13px] font-medium"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Thêm {typeLabel.toLowerCase()}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-md border border-input text-foreground font-medium hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={(e) => { e.preventDefault(); void handleSubmit(); }}
            disabled={isSubmitting || items.some((item) => !item.startDate)}
            className="px-6 py-2 rounded-md bg-primary text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : isMultiple ? (
              `Gửi ${items.length} đơn`
            ) : (
              "Gửi đơn"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
