"use client"

import {
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/config/entities/attendance.config"
import { useAuthStore } from "@/store/auth-store"

import { ChevronRight, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useCreateApplicationForm } from "@/hooks/application/useCreateApplicationForm"
import { CreateApplicationInfoSection } from "@/components/features/application/CreateApplicationInfoSection"
import { CreateApplicationTimeSection } from "@/components/features/application/CreateApplicationTimeSection"
import { ROUTES } from "@/config/routes.config"

export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get("type") || "leave"

  const { user } = useAuthStore()

  const { forms, addForm, removeForm, updateForm, assignedToId, setAssignedToId, approvers, employees, isSubmitting, handleSubmit } = useCreateApplicationForm(type)

  const typeLabel = Object.entries(APPLICATION_TYPE_LABELS).find(([k]) => k === type)?.[1] || "đơn từ"

  const handleBack = () => {
    navigate(ROUTES.APPLICATION.BASE, { replace: true })
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

      <div className="flex-1 overflow-y-auto w-full h-full">
        <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6 min-h-full">
        {/* Section 1: Thông tin đơn */}
        <CreateApplicationInfoSection 
          type={type} 
          form={forms[0]}
          set={(k, v) => updateForm(0, k, v)}
          assignedToId={assignedToId} 
          setAssignedToId={setAssignedToId} 
          user={user} 
          approvers={approvers} 
        />

        {/* Section 2: Danh sách các đơn chi tiết */}
        {type !== APPLICATION_TYPES.RESIGNATION.LABEL && (
          <div className="space-y-6">
            {forms.map((form, index) => (
              <CreateApplicationTimeSection 
                key={index}
                formIndex={index}
                onRemove={forms.length > 1 ? () => removeForm(index) : undefined}
                type={type} 
                form={form} 
                set={(k, v) => updateForm(index, k, v)} 
                employees={employees} 
              />
            ))}
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={addForm} 
                className="border border-dashed border-primary text-primary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/5 transition-colors font-medium text-sm"
              >
                <Plus size={16} /> Thêm {typeLabel.toLowerCase()}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8 mt-auto pt-6">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-md border border-input text-foreground font-medium hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
              onClick={(e) => { e.preventDefault(); void handleSubmit(); }}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : `Gửi ${forms.length} đơn`}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
