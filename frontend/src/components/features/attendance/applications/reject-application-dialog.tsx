import { Button } from "@/components/ui/button"

import { useState } from "react"

import { X } from "lucide-react"
import { toast } from "sonner"

interface RejectApplicationDialogProps {
  onCancel: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}

export function RejectApplicationDialog({
  onCancel,
  onConfirm,
  isLoading,
}: RejectApplicationDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối")
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-border">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-1">
            <X size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">Từ chối đơn?</h3>
          <p className="text-sm text-muted-foreground">Nhập lý do từ chối để thông báo đến nhân viên.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Lý do từ chối *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do..."
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={onCancel}>
              Hủy
            </Button>
            <Button variant="destructive" className="flex-1" type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
