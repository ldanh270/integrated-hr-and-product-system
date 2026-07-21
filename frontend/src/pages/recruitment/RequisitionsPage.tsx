import { useMemo, useState } from "react"
import { Check, FilePlus2, Plus, Send, X } from "lucide-react"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateRequisitionDialog } from "@/components/features/recruitment/create-requisition-dialog"
import { Badge } from "@/components/ui/badge"
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
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { useApproveRequisition, useRequisitions, useSubmitRequisitionForApproval } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { usePersonalEmployeeId } from "@/hooks/attendance/use-personal-employee-id"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"
import type { JobRequisition } from "@/types/recruitment.types"

const priorityVariantMap: Record<string, "destructive" | "secondary" | "outline"> = {
  [REQUISITION_PRIORITY.URGENT]: "destructive",
  [REQUISITION_PRIORITY.HIGH]: "secondary",
  [REQUISITION_PRIORITY.MEDIUM]: "outline",
  [REQUISITION_PRIORITY.LOW]: "outline",
}

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  closed: "neutral",
  filled: "info",
}

function formatCurrencyRange(requisition: JobRequisition) {
  const format = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
  if (requisition.salaryMin && requisition.salaryMax) return `${format(requisition.salaryMin)} – ${format(requisition.salaryMax)}`
  return requisition.salaryMin ? `Từ ${format(requisition.salaryMin)}` : "Chưa xác định"
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "—"
}

export default function RequisitionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { hasPermission } = usePermission()
  const employeeId = usePersonalEmployeeId()
  const { data, isLoading } = useRequisitions({ page, pageSize })
  const requisitions = data?.data
  const meta = data?.meta

  const visibleRequisitions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const list = requisitions ?? []
    if (!normalizedKeyword) return list
    return list.filter((requisition) => [requisition.code, requisition.title, requisition.department, requisition.approver?.fullName]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedKeyword)))
  }, [keyword, requisitions])

  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / pageSize))

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Yêu cầu tuyển dụng"
        description="Theo dõi nhu cầu tuyển dụng, người duyệt và tiến độ mở vị trí."
        actions={hasPermission("recruitment.create") ? <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Tạo yêu cầu mới</Button> : undefined}
      />

      <PageCard padding="sm" className="overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => { setKeyword(value); setPage(1) }}
          searchPlaceholder="Tìm theo mã, vị trí, phòng ban, người duyệt..."
        />

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-28 px-4 py-3 text-xs font-medium uppercase">Mã</TableHead>
                <TableHead className="min-w-60 px-4 py-3 text-xs font-medium uppercase">Vị trí tuyển</TableHead>
                <TableHead className="hidden lg:table-cell px-4 py-3 text-xs font-medium uppercase">Ngân sách</TableHead>
                <TableHead className="hidden xl:table-cell px-4 py-3 text-xs font-medium uppercase">Hạn tuyển</TableHead>
                <TableHead className="hidden md:table-cell px-4 py-3 text-xs font-medium uppercase">Người duyệt</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase">Trạng thái</TableHead>
                <TableHead className="w-16 px-4 py-3 text-right text-xs font-medium uppercase"><span className="sr-only">Thao tác</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Đang tải yêu cầu tuyển dụng...</TableCell></TableRow>
                : visibleRequisitions.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{keyword ? "Không tìm thấy yêu cầu phù hợp" : "Chưa có yêu cầu tuyển dụng nào"}</TableCell></TableRow>
                  : visibleRequisitions.map((requisition) => <RequisitionRow key={requisition.id} requisition={requisition} canCreateJd={hasPermission("recruitment.jd.create")} canSubmit={hasPermission("recruitment.update") && Boolean(requisition.approverId)} canApprove={hasPermission("recruitment.requisition.approve") && Boolean(requisition.approverId) && requisition.approverId === employeeId} />)}
            </TableBody>
          </Table>
        </div>

        <AppPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={meta?.total ?? 0}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(value) => { setPageSize(value); setPage(1) }}
        />
      </PageCard>
      <CreateRequisitionDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

function RequisitionRow({ requisition, canCreateJd, canSubmit, canApprove }: { requisition: JobRequisition; canCreateJd: boolean; canSubmit: boolean; canApprove: boolean }) {
  const submit = useSubmitRequisitionForApproval()
  const approve = useApproveRequisition()
  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell className="px-4 py-3 font-mono text-xs font-medium text-primary">{requisition.code}</TableCell>
      <TableCell className="px-4 py-3">
        <p className="font-medium text-foreground">{requisition.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{requisition.department || "Chưa có phòng ban"}</span>
          {requisition.positionLevel && <><span aria-hidden>•</span><span>{requisition.positionLevel}</span></>}
          <Badge variant={priorityVariantMap[requisition.priority]} className="rounded-full px-2 py-0 text-[11px]">{REQUISITION_PRIORITY_LABELS[requisition.priority]}</Badge>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">{formatCurrencyRange(requisition)}</TableCell>
      <TableCell className="hidden xl:table-cell px-4 py-3 text-sm text-muted-foreground">{formatDate(requisition.targetHireDate)}</TableCell>
      <TableCell className="hidden md:table-cell px-4 py-3"><p className="text-sm font-medium">{requisition.approver?.fullName ?? "Chưa chỉ định"}</p><p className="text-xs text-muted-foreground">{requisition.approver?.position ?? ""}</p></TableCell>
      <TableCell className="px-4 py-3"><StatusPill label={REQUISITION_STATUS_LABELS[requisition.status]} variant={statusVariantMap[requisition.status]} /></TableCell>
      <TableCell className="px-4 py-3 text-right"><div className="flex justify-end gap-1">
        {canSubmit && requisition.status === "draft" && <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Gửi duyệt ${requisition.code}`} onClick={() => submit.mutate(requisition.id)} disabled={submit.isPending}><Send className="h-4 w-4" /></Button>}
        {canApprove && requisition.status === "pending_approval" && <><Button variant="ghost" size="icon" className="rounded-full text-success" aria-label={`Duyệt ${requisition.code}`} onClick={() => approve.mutate({ id: requisition.id, data: { approved: true } })} disabled={approve.isPending}><Check className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="rounded-full text-destructive" aria-label={`Từ chối ${requisition.code}`} onClick={() => approve.mutate({ id: requisition.id, data: { approved: false } })} disabled={approve.isPending}><X className="h-4 w-4" /></Button></>}
        {canCreateJd && requisition.status === "approved" && <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Tạo JD từ ${requisition.code}`} onClick={() => routerNavigate(`${ROUTES.RECRUITMENT.JOB_DESCRIPTIONS}?requisitionId=${requisition.id}`)}><FilePlus2 className="h-4 w-4" /></Button>}
      </div></TableCell>
    </TableRow>
  )
}
