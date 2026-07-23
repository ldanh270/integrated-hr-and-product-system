import { routerNavigate } from "@/lib/router-navigator"
import { PageHeader } from "@/components/common"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
  Briefcase,
  CheckCircle,
} from "lucide-react"
import {
  useRequisitionStats,
  useApplicationStats,
  useUpcomingInterviews,
  useOfferStats,
  useBackgroundCheckStats,
} from "@/hooks/recruitment/use-recruitment-queries"
import { ROUTES } from "@/config/routes.config"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import { vi } from "date-fns/locale"

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all rounded-xl" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function InterviewItem({
  candidateName,
  positionTitle,
  scheduledAt,
  roundNumber,
}: {
  candidateName: string
  positionTitle: string
  scheduledAt: string
  roundNumber: number
}) {
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      if (isToday(date)) return "Hôm nay"
      if (isTomorrow(date)) return "Ngày mai"
      return format(date, "EEE, dd/MM", { locale: vi })
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

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {candidateName?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{candidateName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {positionTitle} • Vòng {roundNumber}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{formatDate(scheduledAt)}</p>
        <p className="text-xs text-muted-foreground">{formatTime(scheduledAt)}</p>
      </div>
    </div>
  )
}

function QuickLink({
  title,
  description,
  icon: Icon,
  to,
  count,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  count?: number
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all rounded-xl"
      onClick={() => routerNavigate(to)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-foreground truncate">{title}</p>
            {count !== undefined && count > 0 && (
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                {count}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

export default function RecruitmentDashboard() {
  const { data: reqStats, isLoading: isLoadingReqStats } = useRequisitionStats()
  const { data: appStats, isLoading: isLoadingAppStats } = useApplicationStats()
  const { data: upcomingInterviews, isLoading: isLoadingInterviews } = useUpcomingInterviews(7)
  const { data: offerStats, isLoading: isLoadingOfferStats } = useOfferStats()
  const { data: bgcStats, isLoading: isLoadingBgcStats } = useBackgroundCheckStats()

  const isLoading =
    isLoadingReqStats ||
    isLoadingAppStats ||
    isLoadingInterviews ||
    isLoadingOfferStats ||
    isLoadingBgcStats

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Dashboard Tuyển dụng"
        description="Tổng quan tình hình tuyển dụng"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Yêu cầu tuyển dụng"
              value={reqStats?.total ?? 0}
              description={`${reqStats?.pending ?? 0} đang chờ phê duyệt`}
              icon={FileText}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            />
            <StatCard
              title="Ứng viên"
              value={appStats?.total ?? 0}
              description={`${appStats?.active ?? 0} đang trong quá trình`}
              icon={Users}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.KANBAN)}
            />
            <StatCard
              title="Offer"
              value={offerStats?.total ?? 0}
              description={`${offerStats?.pending ?? 0} đang chờ phản hồi`}
              icon={Briefcase}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.OFFERS)}
            />
            <StatCard
              title="Background Check"
              value={bgcStats?.total ?? 0}
              description={`${bgcStats?.inProgress ?? 0} đang kiểm tra`}
              icon={CheckCircle}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.BACKGROUND_CHECKS)}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Interviews */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Lịch phỏng vấn sắp tới</CardTitle>
              <CardDescription className="text-xs">7 ngày tới</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.INTERVIEWS)}
            >
              Xem tất cả
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingInterviews ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ) : upcomingInterviews && upcomingInterviews.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingInterviews.slice(0, 5).map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    candidateName={interview.candidateName ?? "N/A"}
                    positionTitle={interview.positionTitle ?? "N/A"}
                    scheduledAt={interview.scheduledAt ?? ""}
                    roundNumber={interview.roundNumber}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Không có lịch phỏng vấn nào trong 7 ngày tới
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Pipeline Summary */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Pipeline ứng viên</CardTitle>
              <CardDescription className="text-xs">Theo trạng thái</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.KANBAN)}
            >
              Xem Kanban
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAppStats ? (
              <div className="space-y-2">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            ) : appStats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">Mới</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.byStatus?.new ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/70" />
                    <span className="text-sm">Đang xem xét</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.byStatus?.reviewing ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/50" />
                    <span className="text-sm">Phỏng vấn</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.byStatus?.interviewing ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/80" />
                    <span className="text-sm">Offer</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.byStatus?.offer_sent ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary font-bold" />
                    <span className="text-sm">Đã tuyển</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.byStatus?.hired ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm">Từ chối</span>
                  </div>
                  <span className="text-sm font-semibold">{appStats.rejected ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Thao tác nhanh</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            title="Yêu cầu tuyển dụng"
            description="Tạo và quản lý yêu cầu"
            icon={FileText}
            to={ROUTES.RECRUITMENT.REQUISITIONS}
            count={reqStats?.pending ?? 0}
          />
          <QuickLink
            title="Quản lý ứng viên"
            description="Xem danh sách ứng viên"
            icon={Users}
            to={ROUTES.RECRUITMENT.CANDIDATES}
          />
          <QuickLink
            title="Pipeline Kanban"
            description="Quản lý theo giai đoạn"
            icon={TrendingUp}
            to={ROUTES.RECRUITMENT.KANBAN}
          />
          <QuickLink
            title="Background Check"
            description="Kiểm tra lý lịch"
            icon={CheckCircle}
            to={ROUTES.RECRUITMENT.BACKGROUND_CHECKS}
            count={bgcStats?.pending ?? 0}
          />
        </div>
      </div>
    </div>
  )
}

