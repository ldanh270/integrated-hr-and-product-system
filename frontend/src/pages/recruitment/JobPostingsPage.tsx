import { useMemo, useState } from "react"
import { ExternalLink, Eye, FileSpreadsheet, Plus, RefreshCw } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateJobPostingDialog } from "@/components/features/recruitment/create-job-posting-dialog"
import { ViewJobPostingDialog } from "@/components/features/recruitment/view-job-posting-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useJobDescriptions, useJobPostings, usePublishJobPosting, useSyncJobPosting } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import type { JobPosting } from "@/types/recruitment.types"

const channelLabel = (value: string) => POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "open", label: "Đang mở" },
  { id: "closed", label: "Đã đóng" },
  { id: "draft", label: "Nháp" },
]

export default function JobPostingsPage() {
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createPostingJdId, setCreatePostingJdId] = useState<string | undefined>(params.get("jdId") ?? undefined)
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null)
  const [viewPostingOpen, setViewPostingOpen] = useState(false)

  const handleViewDetails = (posting: JobPosting) => {
    setSelectedPosting(posting)
    setViewPostingOpen(true)
  }
  const { hasPermission } = usePermission()
  const { data: descriptions = [] } = useJobDescriptions()
  const { data: postings = [], isLoading } = useJobPostings()

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: postings.length }
    for (const p of postings) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  }, [postings])

  const filtered = useMemo(() => {
    return postings.filter((posting) => {
      if (activeTab !== "all" && posting.status !== activeTab) return false

      const jd = descriptions.find((d) => d.id === posting.jobDescriptionId)
      const searchStr = keyword.toLowerCase()
      return (
        jd?.title?.toLowerCase().includes(searchStr) ||
        jd?.requisition?.code?.toLowerCase().includes(searchStr) ||
        jd?.requisition?.department?.toLowerCase().includes(searchStr) ||
        posting.sourceCode?.toLowerCase().includes(searchStr)
      )
    })
  }, [postings, descriptions, keyword, activeTab])

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Đăng tuyển"
        description="Tạo và quản lý bài đăng tuyển dụng trên các kênh (Google Form, LinkedIn, Facebook, v.v.)"
        actions={
          hasPermission("recruitment.posting.manage") && descriptions.length > 0 ? (
            <Button onClick={() => setCreatePostingJdId(createPostingJdId ?? descriptions[0]?.id)} className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài đăng
            </Button>
          ) : undefined
        }
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <nav
          aria-label="Lọc theo trạng thái bài đăng"
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id] || 0
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>

        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => { setKeyword(value); setPage(1) }}
          searchPlaceholder="Tìm theo JD, mã yêu cầu, phòng ban..."
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-72 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Bài đăng</TableHead>
                <TableHead className="min-w-40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kênh</TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="w-40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kết nối</TableHead>
                <TableHead className="w-44 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {keyword || activeTab !== "all" ? "Không tìm thấy dữ liệu phù hợp với bộ lọc" : "Chưa có bài đăng. Tạo JD trước, sau đó tạo bài đăng tại đây."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((posting) => {
                  const jd = descriptions.find((d) => d.id === posting.jobDescriptionId)
                  return (
                    <TableRow
                      key={posting.id}
                      onClick={() => handleViewDetails(posting)}
                      className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
                    >
                      <TableCell className="px-4 py-3">
                        <p className="font-medium text-foreground">{jd?.title ?? "JD đã bị xóa"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono text-primary font-medium">{jd?.requisition?.code ?? "—"}</span>
                          {" · "}
                          {jd?.requisition?.department || "Chưa có phòng ban"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-medium">{channelLabel(posting.channel)}</span>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{posting.sourceCode}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusPill
                          label={posting.status === "open" ? "Đang mở" : posting.status === "closed" ? "Đã đóng" : "Nháp"}
                          variant={posting.status === "open" ? "success" : posting.status === "closed" ? "danger" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <ConnectorStatus posting={posting} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <PostingActions posting={posting} onViewDetails={() => handleViewDetails(posting)} />
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
      <ViewJobPostingDialog
        open={viewPostingOpen}
        onOpenChange={setViewPostingOpen}
        posting={selectedPosting}
        jobDescription={descriptions.find((d) => d.id === selectedPosting?.jobDescriptionId)}
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

function PostingActions({ posting, onViewDetails }: { posting: JobPosting; onViewDetails: () => void }) {
  const publish = usePublishJobPosting()
  const sync = useSyncJobPosting()
  const { hasPermission } = usePermission()
  const isGoogleForm = posting.channel === "google_form"

  const canPublish = hasPermission("recruitment.posting.manage") && isGoogleForm && posting.status === "draft" && !posting.postingUrl
  const canSync = hasPermission("recruitment.intake.manage") && isGoogleForm && posting.connectorStatus === "ready" && posting.status === "open"

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewDetails}
            className="rounded-full h-8 w-8 p-0 hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xem chi tiết bài đăng</TooltipContent>
      </Tooltip>
      {posting.postingUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={posting.postingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 h-8 text-xs font-medium text-primary border border-border rounded-full hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Mở form
            </a>
          </TooltipTrigger>
          <TooltipContent>Xem form ứng tuyển công khai</TooltipContent>
        </Tooltip>
      )}
      {canPublish && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => publish.mutate({ id: posting.id, mode: "connector" })}
          disabled={publish.isPending}
          className="rounded-full h-8 text-xs gap-1.5"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Public
        </Button>
      )}
      {canSync && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => sync.mutate(posting.id)}
              disabled={sync.isPending}
              className="rounded-full h-8 w-8 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đồng bộ dữ liệu ứng viên</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
