import { PageCard } from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import { ActivityLogsTable } from "@/components/features/security/ActivityLogsTable"
import { AppPagination } from "@/components/common/app-pagination"
import { Button } from "@/components/ui/button"
import { useLoginHistoryMaster } from "@/hooks/security/use-login-history-master"
import { History, RefreshCw } from "lucide-react"

/**
 * LoginHistory page — Personal view of login/logout activities
 */
export default function LoginHistory() {
  const {
    query,
    setQuery,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    refetch,
  } = useLoginHistoryMaster()

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử đăng nhập</h1>
        <p className="text-muted-foreground">Theo dõi các phiên đăng nhập và bảo mật tài khoản của bạn.</p>
      </div>

      <PageCard>
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Nhật ký hoạt động
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { void refetch() }}
              disabled={isLoading || isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>

          <ActivityLogsTable
            logs={data?.data || []}
            onViewDetail={setViewingLogId}
            hideEmployee={true}
          />

          <div className="p-5 border-t border-border bg-muted/5">
            <AppPagination
              currentPage={query.page || 1}
              totalPages={data?.meta.totalPages || 1}
              onPageChange={(page: number) => { setQuery((prev) => ({ ...prev, page })) }}
            />
          </div>
        </div>
      </PageCard>

      {/* Detail Drawer */}
      <ActivityLogDetailDrawer
        logId={viewingLogId}
        onClose={() => { setViewingLogId(null); }}
        scope="me"
      />
    </div>
  )
}
