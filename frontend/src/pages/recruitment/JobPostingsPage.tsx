import { useMemo, useState } from "react"
import { ExternalLink, FileSpreadsheet, Plus, RefreshCw } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateJobPostingDialog } from "@/components/features/recruitment/create-job-posting-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useJobDescriptions, useJobPostings, usePublishJobPosting, useSyncJobPosting } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import type { JobPosting } from "@/types/recruitment.types"

const channelLabel = (value: string) => POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

export default function JobPostingsPage() {
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createPostingJdId, setCreatePostingJdId] = useState<string | undefined>(params.get("jdId") ?? undefined)
  const { hasPermission } = usePermission()
  const { data: descriptions = [] } = useJobDescriptions()
  const { data: postings = [], isLoading } = useJobPostings()

  const filtered = useMemo(() => {
    return postings.filter((posting) => {
      const jd = descriptions.find((d) => d.id === posting.jobDescriptionId)
      const searchStr = keyword.toLowerCase()
      return (
        jd?.title?.toLowerCase().includes(searchStr) ||
        jd?.requisition?.code?.toLowerCase().includes(searchStr) ||
        jd?.requisition?.department?.toLowerCase().includes(searchStr) ||
        posting.sourceCode?.toLowerCase().includes(searchStr)
      )
    })
  }, [postings, descriptions, keyword])

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Đăng tuyển"
        description="Tạo và quản lý bài đăng tuyển dụng trên các kênh (Google Form, LinkedIn, Facebook, v.v.)"
        actions={
          hasPermission("recruitment.posting.manage") && descriptions.length > 0 ? (
            <Button onClick={() => setCreatePostingJdId(createPostingJdId ?? descriptions[0]?.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài đăng
            </Button>
          ) : undefined
        }
      />

      <PageCard padding="sm" className="overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => { setKeyword(value); setPage(1) }}
          searchPlaceholder="Tìm theo JD, mã yêu cầu, phòng ban..."
        />
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="min-w-72 px-4 py-3">Bài đăng</TableHead>
                <TableHead className="min-w-40 px-4 py-3">Kênh</TableHead>
                <TableHead className="w-32 px-4 py-3">Trạng thái</TableHead>
                <TableHead className="w-40 px-4 py-3">Kết nối</TableHead>
                <TableHead className="w-40 px-4 py-3 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    Đang tải bài đăng...
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    Chưa có bài đăng. Tạo JD trước, sau đó tạo bài đăng tại đây.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((posting) => {
                  const jd = descriptions.find((d) => d.id === posting.jobDescriptionId)
                  return (
                    <TableRow key={posting.id} className="h-16 hover:bg-muted/30">
                      <TableCell className="px-4">
                        <p className="font-medium">{jd?.title ?? "JD đã bị xóa"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-mono text-primary">{jd?.requisition?.code ?? "—"}</span>
                          {" · "}
                          {jd?.requisition?.department || "Chưa có phòng ban"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="text-sm font-medium">{channelLabel(posting.channel)}</span>
                        <p className="text-xs text-muted-foreground font-mono">{posting.sourceCode}</p>
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusPill
                          label={posting.status === "open" ? "Đang mở" : posting.status === "closed" ? "Đã đóng" : "Nháp"}
                          variant={posting.status === "open" ? "success" : posting.status === "closed" ? "danger" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="px-4">
                        <ConnectorStatus posting={posting} />
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <PostingActions posting={posting} />
                      </TableCell>
                    </TableRow>
                  )
                })
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

      <CreateJobPostingDialog
        key={createPostingJdId ?? "closed"}
        open={Boolean(createPostingJdId)}
        onOpenChange={(open) => !open && setCreatePostingJdId(undefined)}
        initialJobDescriptionId={createPostingJdId}
        jobDescriptions={descriptions}
      />
    </div>
  )
}

function ConnectorStatus({ posting }: { posting: JobPosting }) {
  const isGoogleForm = posting.channel === "google_form"
  if (!isGoogleForm) return <span className="text-sm text-muted-foreground">—</span>

  if (posting.connectorStatus === "ready") {
    return <StatusPill label="Sẵn sàng" variant="success" />
  } else if (posting.connectorStatus === "error") {
    return <StatusPill label="Lỗi kết nối" variant="danger" />
  }
  return <StatusPill label="Chưa cấu hình" variant="warning" />
}

function PostingActions({ posting }: { posting: JobPosting }) {
  const publish = usePublishJobPosting()
  const sync = useSyncJobPosting()
  const { hasPermission } = usePermission()
  const isGoogleForm = posting.channel === "google_form"

  const canPublish = hasPermission("recruitment.posting.manage") && isGoogleForm && posting.status === "draft" && !posting.postingUrl
  const canSync = hasPermission("recruitment.intake.manage") && isGoogleForm && posting.connectorStatus === "ready" && posting.status === "open"

  return (
    <div className="flex items-center justify-end gap-2">
      {posting.postingUrl && (
        <a href={posting.postingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          Mở form
        </a>
      )}
      {canPublish && (
        <Button size="sm" variant="outline" onClick={() => publish.mutate({ id: posting.id, mode: "connector" })} disabled={publish.isPending}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Tạo & Public
        </Button>
      )}
      {canSync && (
        <Button size="sm" variant="ghost" onClick={() => sync.mutate(posting.id)} disabled={sync.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync
        </Button>
      )}
    </div>
  )
}
