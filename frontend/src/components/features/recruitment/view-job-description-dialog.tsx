import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { JobDescription } from "@/types/recruitment.types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobDescription: JobDescription | null
}

export function ViewJobDescriptionDialog({ open, onOpenChange, jobDescription }: Props) {
  if (!jobDescription) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              {jobDescription.requisition?.code ?? "—"}
            </Badge>
            {jobDescription.requisition?.department && (
              <Badge variant="secondary" className="rounded-full bg-secondary text-secondary-foreground">
                {jobDescription.requisition.department}
              </Badge>
            )}
            {jobDescription.requisition?.positionLevel && (
              <Badge variant="secondary" className="rounded-full bg-secondary text-secondary-foreground">
                {jobDescription.requisition.positionLevel}
              </Badge>
            )}
          </div>
          <DialogTitle className="mt-2 text-2xl font-bold text-foreground">
            {jobDescription.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Salary & Employment Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Mức lương</span>
              <span className="text-sm font-semibold text-foreground">
                {jobDescription.salaryMin || jobDescription.salaryMax ? (
                  <>
                    {jobDescription.salaryMin ? `${jobDescription.salaryMin.toLocaleString()}đ` : "—"}
                    {" - "}
                    {jobDescription.salaryMax ? `${jobDescription.salaryMax.toLocaleString()}đ` : "—"}
                  </>
                ) : (
                  "Thỏa thuận"
                )}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Hình thức làm việc</span>
              <span className="text-sm font-semibold text-foreground capitalize">
                {jobDescription.requisition?.employmentType ? (
                  jobDescription.requisition.employmentType.replace("_", " ")
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>

          {/* Job Summary */}
          {jobDescription.summary && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Tóm tắt công việc</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {jobDescription.summary}
              </p>
            </div>
          )}

          {jobDescription.summary && <Separator className="bg-border" />}

          {/* Responsibilities */}
          {jobDescription.responsibilities && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Trách nhiệm công việc</h4>
              <div className="rounded-lg bg-muted/10 p-4 border border-border/50 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {jobDescription.responsibilities}
              </div>
            </div>
          )}

          {jobDescription.responsibilities && <Separator className="bg-border" />}

          {/* Requirements */}
          {jobDescription.requirements && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Yêu cầu ứng viên</h4>
              <div className="rounded-lg bg-muted/10 p-4 border border-border/50 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {jobDescription.requirements}
              </div>
            </div>
          )}

          {jobDescription.requirements && <Separator className="bg-border" />}

          {/* Benefits */}
          {jobDescription.benefits && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Quyền lợi được hưởng</h4>
              <div className="rounded-lg bg-muted/10 p-4 border border-border/50 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {jobDescription.benefits}
              </div>
            </div>
          )}
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
