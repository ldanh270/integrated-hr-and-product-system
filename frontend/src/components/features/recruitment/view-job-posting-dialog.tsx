import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import type { JobDescription, JobPosting } from "@/types/recruitment.types"
import { ExternalLink, Globe, Hash } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  posting: JobPosting | null
  jobDescription?: JobDescription | null
}

const channelLabel = (value: string) => POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

export function ViewJobPostingDialog({ open, onOpenChange, posting, jobDescription }: Props) {
  if (!posting) return null

  const isGoogleForm = posting.channel === "google_form"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              {channelLabel(posting.channel)}
            </Badge>
            <StatusPill
              label={posting.status === "open" ? "Đang mở" : posting.status === "closed" ? "Đã đóng" : "Nháp"}
              variant={posting.status === "open" ? "success" : posting.status === "closed" ? "danger" : "neutral"}
            />
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary shrink-0" />
            Chi tiết Bài đăng tuyển dụng
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-3 text-sm">
          {/* Job Title & Requisition */}
          <div className="rounded-lg bg-muted/30 p-4 border border-border space-y-2">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Vị trí công việc</span>
              <span className="text-sm font-semibold text-foreground">
                {jobDescription?.title ?? "Mô tả công việc"}
              </span>
            </div>
            {jobDescription?.requisition && (
              <div className="text-xs text-muted-foreground">
                <span>Mã yêu cầu: </span>
                <span className="font-mono text-primary font-medium">{jobDescription.requisition.code}</span>
                {" · "}
                <span>{jobDescription.requisition.department}</span>
              </div>
            )}
          </div>

          {/* Source Code & Connector status */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/20 p-3 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Mã nguồn (Source Code)</span>
              <div className="flex items-center gap-1 text-xs font-mono font-medium text-foreground mt-0.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{posting.sourceCode}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Kết nối tự động</span>
              <div className="mt-0.5">
                {isGoogleForm ? (
                  posting.connectorStatus === "ready" ? (
                    <StatusPill label="Sẵn sàng" variant="success" />
                  ) : posting.connectorStatus === "error" ? (
                    <StatusPill label="Lỗi kết nối" variant="danger" />
                  ) : (
                    <StatusPill label="Chưa cấu hình" variant="warning" />
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Public Link */}
          {posting.postingUrl && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground block font-medium">Đường dẫn ứng tuyển công khai</span>
              <a
                href={posting.postingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>{posting.postingUrl}</span>
              </a>
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            <span>Ngày tạo bài đăng: </span>
            <span className="font-medium text-foreground">
              {posting.createdAt ? new Date(posting.createdAt).toLocaleDateString("vi-VN") : "—"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full border-border text-foreground hover:bg-muted" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
