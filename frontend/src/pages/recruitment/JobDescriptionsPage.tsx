import { useMemo, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { CreateJobDescriptionDialog } from "@/components/features/recruitment/create-job-description-dialog"
import { ViewJobDescriptionDialog } from "@/components/features/recruitment/view-job-description-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
          <Button onClick={() => setCreateJdOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo JD
          </Button>
        ) : undefined}
      />
      <PageCard padding="sm" className="overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => { setKeyword(value); setPage(1) }}
          searchPlaceholder="Tìm JD, mã yêu cầu, phòng ban..."
        />
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="min-w-72 px-4 py-3">Mô tả công việc</TableHead>
                <TableHead className="min-w-48 px-4 py-3">Yêu cầu tuyển dụng</TableHead>
                <TableHead className="w-32 px-4 py-3">Mức lương</TableHead>
                <TableHead className="w-32 px-4 py-3 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    Đang tải JD...
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    Chưa có JD. Hãy tạo từ một yêu cầu đã phê duyệt.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((jd) => (
                  <TableRow key={jd.id} className="h-16 hover:bg-muted/30">
                    <TableCell className="px-4">
                      <p className="font-medium">{jd.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {jd.summary || "Chưa có mô tả"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4">
                      <p className="text-sm">
                        <span className="font-mono text-primary">{jd.requisition?.code ?? "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {jd.requisition?.department || "Chưa có phòng ban"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4">
                      {jd.salaryMin || jd.salaryMax ? (
                        <span className="text-sm">
                          {jd.salaryMin ? `${jd.salaryMin.toLocaleString()}đ` : "—"}
                          {" - "}
                          {jd.salaryMax ? `${jd.salaryMax.toLocaleString()}đ` : "—"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Thỏa thuận</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJd(jd)
                            setViewJdOpen(true)
                          }}
                        >
                          Xem chi tiết
                        </Button>
                        {hasPermission("recruitment.jd.update") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:text-primary h-8 w-8"
                            aria-label={`Sửa ${jd.title}`}
                            onClick={() => {
                              setSelectedEditJd(jd)
                              setEditJdOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
