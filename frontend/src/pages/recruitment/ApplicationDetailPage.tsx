import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowLeft, ExternalLink, Link as LinkIcon, Mail, Phone } from "lucide-react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { applicationApi } from "@/lib/api/recruitment.api"

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get("tab") ?? "overview"
  const [activeTab, setActiveTab] = useState(defaultTab)

  const { data: application, isLoading } = useQuery({
    queryKey: ["recruitment", "application", id],
    queryFn: () => applicationApi.getOne(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
        <span className="text-sm text-muted-foreground">Đang tải...</span>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Không tìm thấy ứng viên</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          Quay lại
        </Button>
      </div>
    )
  }

  const candidatePortfolioUrl = (application.candidate as { portfolioUrl?: string | null }).portfolioUrl

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-card px-6">
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">Chi tiết ứng viên</h1>
            <Badge variant="outline" className="rounded-full bg-secondary/50 font-mono">
              #{application.id.substring(0, 8)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
             <StatusPill label={application.pipelineStage?.name ?? "Nộp CV"} variant="info" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Candidate Info */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-r border-border/40 bg-card/50 p-6 scrollbar-thin">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-3xl font-bold text-primary shadow-sm overflow-hidden">
              {application.candidate.avatarUrl ? (
                <img src={application.candidate.avatarUrl} alt={application.candidate.fullName} className="size-full object-cover" />
              ) : (
                application.candidate.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold">{application.candidate.fullName}</h2>
            <p className="text-sm text-muted-foreground">{application.requisition?.title ?? "—"}</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary/50">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <span className="truncate">{application.candidate.email}</span>
            </div>
            {application.candidate.phone && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex size-8 items-center justify-center rounded-full bg-secondary/50">
                  <Phone className="size-4 text-muted-foreground" />
                </div>
                <span>{application.candidate.phone}</span>
              </div>
            )}
             {candidatePortfolioUrl && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex size-8 items-center justify-center rounded-full bg-secondary/50">
                  <LinkIcon className="size-4 text-muted-foreground" />
                </div>
                <a href={candidatePortfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {candidatePortfolioUrl}
                </a>
              </div>
            )}
          </div>

          <div className="my-6 border-t border-border/40"></div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nguồn ứng tuyển
              </span>
              <p className="mt-1 text-sm font-medium">{application.source}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ngày ứng tuyển
              </span>
              <p className="mt-1 text-sm font-medium">
                {format(new Date(application.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
             <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Người phụ trách
              </span>
              <p className="mt-1 text-sm font-medium">
                {application.assignedTo?.fullName ?? "Chưa phân công"}
              </p>
            </div>
            {application.candidate.cvUrl && (
              <Button variant="outline" className="mt-4 w-full rounded-xl" asChild>
                <a href={application.candidate.cvUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Mở CV
                </a>
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border/40 px-6">
              <TabsList className="h-auto bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger
                  value="interviews"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Phỏng vấn
                </TabsTrigger>
                 <TabsTrigger
                  value="scorecards"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Scorecards
                </TabsTrigger>
                <TabsTrigger
                  value="offers"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Offer
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <TabsContent value="overview" className="m-0 space-y-6">
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                   <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Kinh nghiệm & Kỹ năng</h3>
                   <div className="space-y-4">
                      {/* Placeholder cho thông tin rút từ CV / manual input */}
                      <p className="text-sm text-muted-foreground">Tính năng đang được phát triển...</p>
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="interviews" className="m-0 space-y-6">
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Danh sách vòng phỏng vấn</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Tính năng quản lý phỏng vấn chi tiết đang được phát triển...</p>
                  </div>
              </TabsContent>
              
               <TabsContent value="scorecards" className="m-0 space-y-6">
                   <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Kết quả đánh giá</h3>
                      <p className="text-sm text-muted-foreground">Chưa có kết quả đánh giá nào.</p>
                  </div>
              </TabsContent>

              <TabsContent value="offers" className="m-0 space-y-6">
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Offer</h3>
                      <p className="text-sm text-muted-foreground">Chưa có offer nào được tạo.</p>
                  </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
