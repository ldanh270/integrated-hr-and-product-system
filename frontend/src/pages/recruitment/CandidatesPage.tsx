import { useState } from "react"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Eye, Mail, Phone } from "lucide-react"
import { useCandidates } from "@/hooks/recruitment/use-recruitment-queries"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import type { Candidate } from "@/types/recruitment.types"

export default function CandidatesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")

  const { data, isLoading } = useCandidates({
    keyword: keyword || undefined,
    page,
    pageSize,
  })

  const candidates = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Ứng viên"
        description="Quản lý danh sách ứng viên và hồ sơ"
        actions={
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Thêm ứng viên
          </Button>
        }
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(val) => {
            setKeyword(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm kiếm theo tên, email..."
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-64 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Ứng viên</TableHead>
                <TableHead className="w-56 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Email</TableHead>
                <TableHead className="hidden md:table-cell w-40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Điện thoại</TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Nguồn</TableHead>
                <TableHead className="hidden lg:table-cell w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kinh nghiệm</TableHead>
                <TableHead className="hidden lg:table-cell min-w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kỹ năng</TableHead>
                <TableHead className="w-28 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {keyword ? "Không tìm thấy ứng viên phù hợp với từ khóa" : "Chưa có ứng viên nào"}
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate: Candidate) => (
                  <TableRow key={candidate.id} className="transition-colors duration-100 hover:bg-muted/25">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {candidate.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{candidate.fullName}</p>
                          {candidate.currentPosition && (
                            <p className="text-xs text-muted-foreground mt-0.5">{candidate.currentPosition}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{candidate.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3">
                      {candidate.phone ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{candidate.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {RECRUITMENT_SOURCE_LABELS[candidate.source] || candidate.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">
                      {candidate.yearsOfExperience
                        ? `${candidate.yearsOfExperience} năm`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(candidate.skills || []).slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="rounded-full text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                        {(candidate.skills || []).length > 3 && (
                          <Badge variant="secondary" className="rounded-full text-[10px]">
                            +{(candidate.skills || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem chi tiết ứng viên</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AppPagination
          currentPage={page}
          totalPages={meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1}
          onPageChange={setPage}
          totalItems={meta?.total ?? candidates.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>
    </div>
  )
}

