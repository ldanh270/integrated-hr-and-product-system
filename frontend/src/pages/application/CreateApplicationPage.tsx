"use client"

import {
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/config/entities/attendance.config"
import { useAuthStore } from "@/store/auth-store"

import { ChevronRight, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useCreateApplicationForm } from "./hooks/useCreateApplicationForm"
import { CreateApplicationInfoSection } from "./components/CreateApplicationInfoSection"
import { CreateApplicationTimeSection } from "./components/CreateApplicationTimeSection"

export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get("type") || "leave"

  const { user } = useAuthStore()

  const { form, set, approvers, shifts, employees, isSubmitting, handleSubmit } = useCreateApplicationForm(type)

  const typeLabel = Object.entries(APPLICATION_TYPE_LABELS).find(([k]) => k === type)?.[1] || "đơn từ"

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-full bg-background w-full animate-in fade-in duration-300 overflow-hidden">
      {/* Header Breadcrumbs */}
      <div className="flex items-center px-6 py-4 bg-background border-b border-border shadow-sm z-10 shrink-0">
        <button
          onClick={handleBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors mr-3"
        >
          <Plus size={16} strokeWidth={2.5} className="rotate-45" /> {/* Close/Back icon */}
        </button>
        <span className="text-[15px] font-semibold text-foreground">Đơn thư</span>
        <ChevronRight size={16} className="text-muted-foreground/70 mx-2" />
        <span className="text-[15px] text-muted-foreground">Tạo mới {typeLabel.toLowerCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        {/* Section 1: Thông tin đơn */}
        <CreateApplicationInfoSection type={type} form={form} set={set} user={user} approvers={approvers} />

        {/* Section 2: Thời gian */}
        {type !== APPLICATION_TYPES.RESIGNATION.LABEL && (
          <CreateApplicationTimeSection type={type} form={form} set={set} shifts={shifts} employees={employees} />
        )}

        <div className="flex justify-end gap-3 pb-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-md border border-input text-foreground font-medium hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
              onClick={(e) => { e.preventDefault(); void handleSubmit(); }}
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
