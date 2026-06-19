"use client"

import { APP_TYPE_META } from "@/components/attendance/attendance-ui.meta"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"

import { AlertTriangle } from "lucide-react"

export interface CancelDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function CancelDialog({ app, onCancel, onConfirm, isLoading }: CancelDialogProps) {
  const typeMeta = APP_TYPE_META[app.type] || APP_TYPE_META[APPLICATION_TYPES.LEAVE.LABEL]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Xác nhận hủy đơn?</h3>
          <p className="text-sm text-slate-500">
            Hủy đơn <strong className={typeMeta.color}>{typeMeta.label}</strong> từ{" "}
            {new Date(app.startDate).toLocaleDateString("vi-VN")}?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-colors"
          >
            {isLoading ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  )
}
