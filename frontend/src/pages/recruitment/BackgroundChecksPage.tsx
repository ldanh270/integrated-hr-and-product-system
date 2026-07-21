import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { StatusPill } from "@/components/common/status-pill"
import { DataTableToolbar } from "@/components/common/data-table-toolbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useBackgroundChecks,
  useStartBackgroundCheck,
  useCompleteBackgroundCheck,
} from "@/hooks/recruitment/use-recruitment-queries"
import {
  BGC_STATUS_LABELS,
  BGC_GROUP_LABELS,
  BGC_STATUS,
} from "@/config/entities/recruitment.config"
import type { BackgroundCheck } from "@/types/recruitment.types"
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Play,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  [BGC_STATUS.PENDING]: "warning",
  [BGC_STATUS.IN_PROGRESS]: "info",
  [BGC_STATUS.COMPLETED]: "info",
  [BGC_STATUS.PASSED]: "success",
  [BGC_STATUS.FAILED]: "danger",
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-"
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi })
  } catch {
    return dateStr
  }
}

interface BackgroundCheckRowProps {
  bgc: BackgroundCheck
  onStart: () => void
  onComplete: (passed: boolean) => void
}

function BackgroundCheckRow({ bgc, onStart, onComplete }: BackgroundCheckRowProps) {
  const hasIdVerification = bgc.idVerified !== null && bgc.idVerified !== undefined
  const hasAddressVerification = bgc.addressVerified !== null && bgc.addressVerified !== undefined
  const hasCriminalCheck = bgc.criminalRecordCheck !== null && bgc.criminalRecordCheck !== undefined

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {bgc.candidateName?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <p className="font-medium">{bgc.candidateName}</p>
            <p className="text-xs text-muted-foreground">{bgc.candidateEmail}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{BGC_GROUP_LABELS[bgc.group]}</Badge>
      </TableCell>
      <TableCell>
        <StatusPill
          label={BGC_STATUS_LABELS[bgc.status]}
          variant={statusVariantMap[bgc.status]}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {hasIdVerification ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">CCCD</span>
          </div>
          <div className="flex items-center gap-1">
            {hasAddressVerification ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">Địa chỉ</span>
          </div>
          <div className="flex items-center gap-1">
            {hasCriminalCheck ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">LLHP</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{formatDate(bgc.startedAt)}</TableCell>
      <TableCell className="text-sm">{formatDate(bgc.completedAt)}</TableCell>
      <TableCell>
        {bgc.failReason ? (
          <p className="text-xs text-destructive max-w-[150px] truncate" title={bgc.failReason}>
            {bgc.failReason}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {bgc.status === BGC_STATUS.PENDING && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onStart}
              title="Bắt đầu kiểm tra"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {bgc.status === BGC_STATUS.IN_PROGRESS && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onComplete(true)}
                title="Đạt"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onComplete(false)}
                title="Không đạt"
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" title="Xem chi tiết">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function BackgroundChecksPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>("")

  const { data, isLoading } = useBackgroundChecks({
    status: statusFilter || undefined,
    page,
    pageSize,
  })
  const startBgc = useStartBackgroundCheck()
  const completeBgc = useCompleteBackgroundCheck()

  const backgroundChecks = data?.data ?? []
  const meta = data?.meta

  const handleStart = (id: string) => {
    startBgc.mutate(id)
  }

  const handleComplete = (id: string, passed: boolean) => {
    completeBgc.mutate({
      id,
      data: {
        passed,
        failReason: passed ? undefined : "Không đạt kiểm tra background",
      },
    })
  }

  return (
    <div className="container flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Kiểm tra Background"
        description="Quản lý kiểm tra lý lịch ứng viên trước khi tuyển dụng"
        actions={
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Tạo kiểm tra mới
          </Button>
        }
      />

      <Card>
        <DataTableToolbar
          searchQuery={statusFilter}
          onSearchChange={setStatusFilter}
          searchPlaceholder="Lọc theo trạng thái..."
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ứng viên</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Xác minh</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày hoàn thành</TableHead>
              <TableHead>Lý do thất bại</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : backgroundChecks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Chưa có kiểm tra background nào
                </TableCell>
              </TableRow>
            ) : (
              backgroundChecks.map((bgc: BackgroundCheck) => (
                <BackgroundCheckRow
                  key={bgc.id}
                  bgc={bgc}
                  onStart={() => handleStart(bgc.id)}
                  onComplete={(passed) => handleComplete(bgc.id, passed)}
                />
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.total > pageSize && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {backgroundChecks.length} / {meta.total} kết quả
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={backgroundChecks.length < pageSize}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
