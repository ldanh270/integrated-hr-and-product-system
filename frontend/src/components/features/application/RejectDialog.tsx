"use client"

import type { IApplication } from "@/lib/api/application.api"

import { useState } from "react"

import { toast } from "sonner"

export interface RejectDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
  title?: string
  description?: string
  optionalReason?: boolean
}

export function RejectDialog({
  onCancel,
  onConfirm,
  isLoading,
  optionalReason,
}: RejectDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!optionalReason && !reason.trim()) {
      toast.error("Vui lòng nhập lý do không duyệt")
      return
    }
    onConfirm(reason)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => { e.stopPropagation() }}
        className="bg-background w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-800">
              Lý do không duyệt {!optionalReason && "*"}
            </label>
            <textarea
              rows={3}
              required={!optionalReason}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
              }}
              placeholder="Nhập lý do..."
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none mt-2"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-colors"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận không duyệt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
