import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { DataTableToolbar } from "@/components/common/data-table-toolbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Mail, Phone } from "lucide-react"
import { useCandidates } from "@/hooks/recruitment/use-recruitment-queries"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import type { Candidate } from "@/types/recruitment.types"

export default function CandidatesPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState("")

  const { data, isLoading } = useCandidates({
    keyword: keyword || undefined,
    page,
    pageSize,
  })

  const candidates = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="container flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Ứng viên"
        description="Quản lý danh sách ứng viên và hồ sơ"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm ứng viên
          </Button>
        }
      />

      <Card>
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={setKeyword}
          searchPlaceholder="Tìm kiếm theo tên, email..."
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Kinh nghiệm</TableHead>
              <TableHead>Kỹ năng</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Chưa có ứng viên nào
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate: Candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {candidate.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{candidate.fullName}</p>
                        {candidate.currentPosition && (
                          <p className="text-xs text-muted-foreground">{candidate.currentPosition}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {candidate.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {candidate.phone ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {candidate.phone}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {RECRUITMENT_SOURCE_LABELS[candidate.source]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {candidate.yearsOfExperience
                      ? `${candidate.yearsOfExperience} năm`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {candidate.skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.total > pageSize && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {candidates.length} / {meta.total} kết quả
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
                disabled={candidates.length < pageSize}
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
