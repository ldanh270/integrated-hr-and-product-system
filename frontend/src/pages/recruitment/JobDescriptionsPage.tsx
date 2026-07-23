import { useMemo, useState } from "react"
import { Eye, Pencil, Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { CreateJobDescriptionDialog } from "@/components/features/recruitment/create-job-description-dialog"
import { ViewJobDescriptionDialog } from "@/components/features/recruitment/view-job-description-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useJobDescriptions } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { JobDescription } from "@/types/recruitment.types"

export default function JobDescriptionsPage() {
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createJdOpen, setCreateJdOpen] = useState(Boolean(params.get("requisitionId")))
  const [selectedJd, setSelectedJd] = useState<JobDescription | null>(null)
  const [viewJdOpen, setViewJdOpen] = useState(false)
  const [selectedEditJd, setSelectedEditJd] = useState<JobDescription | null>(null)
  const [editJdOpen, setEditJdOpen] = useState(false)
  const { hasPermission } = usePermission()
  const { data: descriptions = [], isLoading } = useJobDescriptions()

  const filtered = useMemo(() => descriptions.filter((jd) =>
    [jd.title, jd.requisition?.code, jd.requisition?.department].filter(Boolean)
      .some((value) => value?.toLowerCase().includes(keyword.trim().toLowerCase())),
  ), [descriptions, keyword])
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Mô tả công việc (JD)"
        description="Soạn JD từ yêu cầu tuyển dụng đã phê duyệt. JD chỉ dùng nội bộ."
        actions={hasPermission("recruitment.jd.create") ? (
          <Button onClick={() => setCreateJdOpen(true)} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Tạo JD
          </Button>
        ) : undefined}
      />
      <PageCard padding="sm" className="p-0 overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => { setKeyword(value); setPage(1) }}
          searchPlaceholder="Tìm JD, mã yêu cầu, phòng ban..."
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-72 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Mô tả công việc</TableHead>
                <TableHead className="min-w-48 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Yêu cầu tuyển dụng</TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Mức lương</TableHead>
                <TableHead className="w-36 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    {keyword ? "Không tìm thấy dữ liệu phù hợp với bộ lọc" : "Chưa có JD. Hãy tạo từ một yêu cầu đã phê duyệt."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((jd) => (
                  <TableRow
                    key={jd.id}
                    onClick={() => {
                      setSelectedJd(jd)
                      setViewJdOpen(true)
                    }}
                    className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
                  >
                    <TableCell className="px-4 py-3">
                      <p className="font-medium text-foreground">{jd.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {jd.summary || "Chưa có mô tả"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm">
                        <span className="font-mono text-primary font-medium">{jd.requisition?.code ?? "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {jd.requisition?.department || "Chưa có phòng ban"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {jd.salaryMin || jd.salaryMax ? (
                        <span className="text-sm font-medium">
                          {jd.salaryMin ? `${jd.salaryMin.toLocaleString()}đ` : "—"}
                          {" - "}
                          {jd.salaryMax ? `${jd.salaryMax.toLocaleString()}đ` : "—"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Thỏa thuận</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-muted"
                              onClick={() => {
                                setSelectedJd(jd)
                                setViewJdOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết</TooltipContent>
                        </Tooltip>

                        {hasPermission("recruitment.jd.update") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-muted"
                                aria-label={`Sửa ${jd.title}`}
                                onClick={() => {
                                  setSelectedEditJd(jd)
                                  setEditJdOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Chỉnh sửa JD</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <AppPagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
          onPageChange={setPage}
          totalItems={filtered.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(value) => { setPageSize(value); setPage(1) }}
        />
      </PageCard>
      <CreateJobDescriptionDialog
        open={createJdOpen || editJdOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateJdOpen(false)
            setEditJdOpen(false)
            setSelectedEditJd(null)
          }
        }}
        initialRequisitionId={params.get("requisitionId") ?? undefined}
        jobDescription={selectedEditJd}
      />
      <ViewJobDescriptionDialog
        open={viewJdOpen}
        onOpenChange={setViewJdOpen}
        jobDescription={selectedJd}
      />
    </div>
  )
}
