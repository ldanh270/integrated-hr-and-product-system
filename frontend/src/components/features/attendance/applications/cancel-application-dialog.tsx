import { Button } from "@/components/ui/button"
import { getApplicationTypeLabel } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
import { formatDate } from "@/lib/utils"

import { AlertTriangle } from "lucide-react"

interface CancelApplicationDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function CancelApplicationDialog({
  app,
  onCancel,
  onConfirm,
  isLoading,
}: CancelApplicationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-border">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">Xác nhận hủy đơn?</h3>
          <p className="text-sm text-muted-foreground">
            Hủy đơn <strong>{getApplicationTypeLabel(app.type)}</strong> từ {formatDate(app.startDate)}?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Không
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </div>
      </div>
    </div>
  )
}
