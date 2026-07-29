import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar, MapPin, Search, Star, Video } from "lucide-react"

import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InterviewFeedbackPanel } from "@/components/features/recruitment/interview-feedback-panel"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/config/entities/recruitment.config"
import { interviewApi } from "@/lib/api/recruitment.api"
import type { InterviewRound } from "@/types/recruitment.types"

export default function MyInterviewsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInterview, setSelectedInterview] = useState<InterviewRound | null>(null)

  const { data: upcomingInterviews = [], isLoading } = useQuery({
    queryKey: ["recruitment", "upcoming-interviews"],
    queryFn: () => interviewApi.getUpcoming(), // Backend gets up to 7 days or all upcoming depending on implementation
  })

  // Lọc theo search
  const filteredInterviews = upcomingInterviews.filter(
    (interview) =>
      interview.application?.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingInterviews = filteredInterviews.filter((i) => i.status === "scheduled")
  const completedInterviews = filteredInterviews.filter((i) => i.status !== "scheduled")

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch phỏng vấn của tôi</h1>
          <p className="text-sm text-muted-foreground">Xem lịch phỏng vấn và gửi đánh giá ứng viên</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Side: Stats/Summary */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Chờ đánh giá
            </h3>
            <p className="mt-2 text-3xl font-black text-primary">{pendingInterviews.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đã hoàn thành
            </h3>
            <p className="mt-2 text-3xl font-black">{completedInterviews.length}</p>
          </div>
        </div>

        {/* Right Side: List */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ứng viên, tên vòng..."
                className="h-10 rounded-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2 rounded-full sm:w-[300px]">
                <TabsTrigger value="upcoming" className="rounded-full text-xs font-semibold">
                  Sắp tới ({pendingInterviews.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-full text-xs font-semibold">
                  Đã qua ({completedInterviews.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Đang tải lịch...</div>
            ) : (
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="upcoming" className="m-0 space-y-4">
                  {pendingInterviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/50 py-12 text-center">
                      <p className="text-sm text-muted-foreground">Không có lịch phỏng vấn sắp tới.</p>
                    </div>
                  ) : (
                    pendingInterviews.map((interview) => (
                      <InterviewCard
                        key={interview.id}
                        interview={interview}
                        onFeedback={() => setSelectedInterview(interview)}
                      />
                    ))
                  )}
                </TabsContent>
                <TabsContent value="completed" className="m-0 space-y-4">
                  {completedInterviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/50 py-12 text-center">
                      <p className="text-sm text-muted-foreground">Không có phỏng vấn nào đã qua.</p>
                    </div>
                  ) : (
                    completedInterviews.map((interview) => (
                      <InterviewCard
                        key={interview.id}
                        interview={interview}
                        onFeedback={() => setSelectedInterview(interview)}
                        isCompleted
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      <InterviewFeedbackPanel
        interview={selectedInterview}
        open={Boolean(selectedInterview)}
        onOpenChange={(open) => {
          if (!open) setSelectedInterview(null)
        }}
      />
    </div>
  )
}

function InterviewCard({ interview, onFeedback, isCompleted = false }: { interview: InterviewRound; onFeedback: () => void; isCompleted?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl border border-border/50 bg-primary/10 text-lg font-bold text-primary overflow-hidden shrink-0">
          {interview.application?.candidate?.avatarUrl ? (
            <img src={interview.application.candidate.avatarUrl} alt={interview.application.candidate.fullName ?? "Ứng viên"} className="size-full object-cover" />
          ) : (
            interview.application?.candidate?.fullName?.charAt(0).toUpperCase() ?? "U"
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{interview.application?.candidate?.fullName}</h4>
            <Badge variant="outline" className="rounded-full bg-secondary/50 font-medium text-xs">
              Vòng {interview.roundNumber}: {interview.title}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{interview.application?.requisition?.title}</p>
          
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-md bg-secondary/30 px-2 py-1">
              <Calendar className="size-3.5 text-primary" />
              <span className={isCompleted ? "line-through opacity-50" : ""}>
                {interview.scheduledAt ? format(new Date(interview.scheduledAt), "HH:mm, dd/MM/yyyy") : "Chưa xếp lịch"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-secondary/30 px-2 py-1">
              {interview.format === "video_call" ? (
                <Video className="size-3.5 text-blue-500" />
              ) : (
                <MapPin className="size-3.5 text-green-500" />
              )}
              <span>{INTERVIEW_FORMAT_LABELS[interview.format] ?? interview.format}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <StatusPill
          label={
            interview.status === "completed"
              ? INTERVIEW_RESULT_LABELS[interview.result as string] ?? "Đã xong"
              : interview.status === "scheduled"
                ? "Sắp tới"
                : interview.status === "cancelled"
                  ? "Đã hủy"
                  : "Chưa đến"
          }
          variant={
            interview.result === "pass"
              ? "success"
              : interview.result === "fail" || interview.status === "cancelled" || interview.status === "no_show"
                ? "danger"
                : interview.status === "scheduled"
                  ? "info"
                  : "neutral"
          }
        />
        
        {interview.status === "scheduled" ? (
             <Button size="sm" onClick={onFeedback} className="rounded-full shadow-sm hover:shadow-md">
                <Star className="mr-1.5 size-4 fill-white" />
                Đánh giá ngay
             </Button>
        ) : (
            <Button variant="outline" size="sm" onClick={onFeedback} className="rounded-full">
                Xem đánh giá
            </Button>
        )}
      </div>
    </div>
  )
}
