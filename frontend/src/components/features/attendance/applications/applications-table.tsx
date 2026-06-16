import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  APPLICATION_STATUS,
  getApplicationStatusLabel,
  getApplicationStatusVariant,
  getApplicationTypeLabel,
} from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
import { formatDate } from "@/lib/utils"

import { Loader2 } from "lucide-react"

interface ApplicationsTableProps {
  applications: IApplication[]
  isLoading: boolean
  mode: "mine" | "manage"
  processingId?: string | null
  onCancel?: (app: IApplication) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

export function ApplicationsTable({
  applications,
  isLoading,
  mode,
  processingId,
  onCancel,
  onApprove,
  onReject,
}: ApplicationsTableProps) {
  const colSpan = mode === "manage" ? 6 : 5

  return (
    <div className="overflow-x-auto">
      <Table className="text-sm">
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              Loại
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              Thời gian
            </TableHead>
            {mode === "manage" && (
              <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Nhân viên
              </TableHead>
            )}
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              Lý do
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              Trạng thái
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                Chưa có đơn nào.
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-muted/30">
                <TableCell className="px-4 py-4 font-medium">
                  {getApplicationTypeLabel(app.type)}
                </TableCell>
                <TableCell className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {formatDate(app.startDate)}
                  {app.endDate && app.endDate !== app.startDate && ` → ${formatDate(app.endDate)}`}
                </TableCell>
                {mode === "manage" && (
                  <TableCell className="px-4 py-4">
                    <p className="font-medium">{app.employee?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{app.employee?.email}</p>
                  </TableCell>
                )}
                <TableCell
                  className="px-4 py-4 max-w-40 truncate text-muted-foreground"
                  title={app.reason}
                >
                  {app.reason || "—"}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <StatusPill
                    label={getApplicationStatusLabel(app.status)}
                    variant={getApplicationStatusVariant(app.status)}
                  />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {mode === "mine" && onCancel && app.status === APPLICATION_STATUS.PENDING && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => onCancel(app)}
                      >
                        Hủy
                      </Button>
                    )}
                    {mode === "manage" && app.status === APPLICATION_STATUS.PENDING && (
                      <>
                        {onApprove && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-success hover:bg-success/90 text-success-foreground"
                            onClick={() => onApprove(app.id)}
                            disabled={processingId === app.id}
                          >
                            Duyệt
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => onReject(app.id)}
                          >
                            Từ chối
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
