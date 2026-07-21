import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useKanban, useMoveKanban } from "@/hooks/recruitment/use-recruitment-queries"
import { APPLICATION_STATUS_LABELS } from "@/config/entities/recruitment.config"
import type { KanbanApplication } from "@/types/recruitment.types"
import { Loader2 } from "lucide-react"

const KANBAN_COLUMNS = [
  "new",
  "reviewing",
  "shortlisted",
  "interviewing",
  "final_review",
  "offer_sent",
  "offer_accepted",
  "background_check",
  "pending_onboarding",
  "hired",
]

const columnVariantMap: Record<string, "success" | "warning" | "info" | "neutral" | "danger"> = {
  new: "neutral",
  reviewing: "info",
  shortlisted: "warning",
  interviewing: "info",
  final_review: "warning",
  offer_sent: "info",
  offer_accepted: "success",
  background_check: "info",
  pending_onboarding: "warning",
  hired: "success",
}

interface KanbanCardProps {
  application: KanbanApplication
  onMove: (targetStatus: string) => void
}

function KanbanCard({ application, onMove }: KanbanCardProps) {
  return (
    <Card className="p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {application.candidate?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{application.candidateName}</p>
            <p className="text-xs text-muted-foreground truncate">{application.positionTitle}</p>
          </div>
        </div>
      </div>

      {application.requisitionCode && (
        <p className="text-xs text-muted-foreground mb-2">@{application.requisitionCode}</p>
      )}

      <div className="flex items-center justify-between">
        {application.source && (
          <Badge variant="outline" className="text-[10px]">
            {application.source}
          </Badge>
        )}
        <div className="flex gap-1 ml-auto">
          {KANBAN_COLUMNS
            .filter((col) => col !== application.status)
            .slice(0, 2)
            .map((col) => (
              <Button
                key={col}
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-[10px]"
                onClick={(e) => {
                  e.stopPropagation()
                  onMove(col)
                }}
              >
                →
              </Button>
            ))}
        </div>
      </div>
    </Card>
  )
}

interface KanbanColumnProps {
  status: string
  applications: KanbanApplication[]
  onMove: (appId: string, targetStatus: string) => void
}

function KanbanColumn({ status, applications, onMove }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <StatusPill
            label={APPLICATION_STATUS_LABELS[status]}
            variant={columnVariantMap[status]}
          />
          <Badge variant="secondary" className="text-[10px]">
            {applications.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="pr-3">
          {applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onMove={(targetStatus) => onMove(app.id, targetStatus)}
            />
          ))}
          {applications.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Chưa có ứng viên
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function KanbanPage() {
  const [page] = useState(1)
  const [pageSize] = useState(100)

  const { data, isLoading } = useKanban({ page, pageSize })
  const moveKanban = useMoveKanban()

  const applications = data?.data ?? []

  const handleMove = (applicationId: string, targetStatus: string) => {
    moveKanban.mutate({
      applicationId,
      targetStatus,
    })
  }

  const groupedApplications = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status)
      return acc
    },
    {} as Record<string, KanbanApplication[]>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Kanban Tuyển dụng"
        description="Quản lý pipeline ứng viên theo từng giai đoạn"
      />

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={groupedApplications[status] ?? []}
              onMove={handleMove}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
