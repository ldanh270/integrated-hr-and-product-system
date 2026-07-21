import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { StatusPill } from "@/components/common/status-pill"
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
import { useUpcomingInterviews } from "@/hooks/recruitment/use-recruitment-queries"
import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_RESULT,
} from "@/config/entities/recruitment.config"
import type { InterviewRound } from "@/types/recruitment.types"
import {
  Plus,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

const resultIconMap: Record<string, React.ReactNode> = {
  [INTERVIEW_RESULT.PASS]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [INTERVIEW_RESULT.FAIL]: <XCircle className="h-4 w-4 text-red-500" />,
  [INTERVIEW_RESULT.PENDING]: <Minus className="h-4 w-4 text-yellow-500" />,
}

const resultVariantMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  [INTERVIEW_RESULT.PASS]: "success",
  [INTERVIEW_RESULT.FAIL]: "danger",
  [INTERVIEW_RESULT.PENDING]: "warning",
  [INTERVIEW_RESULT.NO_SHOW]: "danger",
}

interface InterviewCardProps {
  interview: InterviewRound
}

function InterviewCard({ interview }: InterviewCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, dd/MM", { locale: vi })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "HH:mm")
    } catch {
      return ""
    }
  }

  const isOnline = interview.format === "video_call"

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            Vòng {interview.roundNumber}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {INTERVIEW_TYPE_LABELS[interview.interviewType]}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {interview.result && resultIconMap[interview.result]}
          {interview.result && (
            <span className="text-xs text-muted-foreground">
              {INTERVIEW_RESULT_LABELS[interview.result]}
            </span>
          )}
        </div>
      </div>

      <p className="font-medium text-sm mb-2">{interview.candidateName}</p>
      <p className="text-xs text-muted-foreground mb-3">{interview.positionTitle}</p>

      <div className="space-y-1 text-xs text-muted-foreground">
        {interview.scheduledAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(interview.scheduledAt)}</span>
            <Clock className="h-3 w-3 ml-2" />
            <span>{formatTime(interview.scheduledAt)}</span>
            {interview.durationMinutes && (
              <span className="ml-1">({interview.durationMinutes} phút)</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Video className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          <span>
            {isOnline
              ? interview.meetingLink
                ? "Online"
                : "Chưa có link"
              : interview.location || "Chưa có địa điểm"}
          </span>
        </div>
        {interview.interviewers && interview.interviewers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>{interview.interviewers.length} người phỏng vấn</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function InterviewsPage() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  const { data: upcomingData, isLoading } = useUpcomingInterviews(14)

  const interviews = upcomingData ?? []

  return (
    <div className="container flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Lịch phỏng vấn"
        description="Quản lý lịch phỏng vấn và đánh giá ứng viên"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch phỏng vấn
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Đang tải..."
            : `${interviews.length} lịch phỏng vấn trong 14 ngày tới`}
        </p>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            Bảng
          </Button>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            Thẻ
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Đang tải dữ liệu...
        </Card>
      ) : interviews.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Chưa có lịch phỏng vấn nào trong 14 ngày tới
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Vòng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hình thức</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview: InterviewRound) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{interview.candidateName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.positionTitle}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Vòng {interview.roundNumber}</Badge>
                  </TableCell>
                  <TableCell>
                    {INTERVIEW_TYPE_LABELS[interview.interviewType]}
                  </TableCell>
                  <TableCell>
                    {interview.scheduledAt
                      ? (() => {
                          try {
                            return (
                              <div className="text-sm">
                                <p>{format(parseISO(interview.scheduledAt), "dd/MM/yyyy", { locale: vi })}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(interview.scheduledAt), "HH:mm", { locale: vi })}
                                  {interview.durationMinutes && ` (${interview.durationMinutes} phút)`}
                                </p>
                              </div>
                            )
                          } catch {
                            return interview.scheduledAt
                          }
                        })()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {interview.format === "video_call" ? (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {INTERVIEW_FORMAT_LABELS[interview.format]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {interview.result ? (
                      <StatusPill
                        label={INTERVIEW_RESULT_LABELS[interview.result]}
                        variant={resultVariantMap[interview.result]}
                      />
                    ) : (
                      <StatusPill label="Chờ" variant="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">Xem chi tiết</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
