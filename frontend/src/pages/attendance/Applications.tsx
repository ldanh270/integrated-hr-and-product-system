import { PageCard, PageHeader, StatusPill } from "@/components/common"
import ApplicationForm from "@/components/features/attendance/ApplicationForm"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import { useApplications } from "@/hooks/attendance/useApplications"
import type { IApplication } from "@/types/attendance.types"

import { Plus, XCircle } from "lucide-react"
import { useState } from "react"

export default function Applications() {
  const { applications, isLoading, cancelApplication, isCancelling } = useApplications()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const getTypeName = (type: string) => {
    return (
      Object.values(APPLICATION_TYPES).find((t) => t.LABEL === type)?.DESCRIPTION || type
    )
  }

  const formatDetails = (app: IApplication) => {
    const { details, type } = app
    if (type === "leave") {
      return `Nghỉ từ ${new Date(details.startDate!).toLocaleDateString("vi-VN")} đến ${new Date(details.endDate!).toLocaleDateString("vi-VN")} (${details.totalDays} ngày)`
    }
    if (type === "overtime") {
      return `OT ngày ${new Date(details.otDate!).toLocaleDateString("vi-VN")} (${details.totalHours} giờ)`
    }
    return details.reason || "N/A"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Đơn từ & Nghỉ phép" description="Quản lý các yêu cầu của bạn" />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Tạo đơn mới
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Tạo đơn yêu cầu mới</SheetTitle>
            </SheetHeader>
            <ApplicationForm onSuccess={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <PageCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Loại đơn</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Bạn chưa có đơn từ nào.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="font-medium">{getTypeName(app.type)}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">
                    {formatDetails(app)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={app.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => cancelApplication(app._id)}
                        disabled={isCancelling}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Hủy
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PageCard>
    </div>
  )
}
