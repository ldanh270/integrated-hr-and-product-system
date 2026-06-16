"use client"

import { PageCard, PageHeader } from "@/components/common"
import { ApplicationsFiltersRow } from "@/components/features/attendance/applications/applications-filters-row"
import { ApplicationsPagination } from "@/components/features/attendance/applications/applications-pagination"
import { ApplicationsStatsRow } from "@/components/features/attendance/applications/applications-stats-row"
import { ApplicationsTable } from "@/components/features/attendance/applications/applications-table"
import { CancelApplicationDialog } from "@/components/features/attendance/applications/cancel-application-dialog"
import { RejectApplicationDialog } from "@/components/features/attendance/applications/reject-application-dialog"
import { SubmitApplicationModal } from "@/components/features/attendance/applications/submit-application-modal"
import ShiftChangeRequestDialog from "@/components/features/attendance/shift-change-request-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { StatusFilter } from "@/hooks/application/useMyApplications"
import { useAuthStore } from "@/store/auth-store"
import type { IApplication } from "@/lib/api/application.api"

import { useState } from "react"

import { FilePlus2, Plus, RefreshCw } from "lucide-react"

type ViewTab = "mine" | "manage"

export default function Applications() {
  const { user } = useAuthStore()
  const isManager = user && ["admin", "hr_manager", "general_manager", "team_leader"].includes(user.role)

  const [activeTab, setActiveTab] = useState<ViewTab>("mine")
  const myApps = useMyApplications()
  const manageApps = useManageApplications()
  const currentHook = activeTab === "mine" ? myApps : manageApps

  const [sheetOpen, setSheetOpen] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)

  const handleTabChange = (value: string) => {
    if (value === "mine" || value === "manage") setActiveTab(value)
  }

  const handleStatusFilter = (value: StatusFilter) => {
    currentHook.setStatusFilter(value)
    currentHook.setPage(1)
  }

  const handleTypeFilter = (value: string) => {
    currentHook.setTypeFilter(value)
    currentHook.setPage(1)
  }

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTargetId) return
    await manageApps.handleReject(rejectTargetId, reason)
    setRejectTargetId(null)
  }

  return (
    <div className="container px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Đơn từ & Yêu cầu"
        description="Quản lý các loại đơn nghỉ phép, tăng ca và đổi ca làm việc."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-full" onClick={() => setShowSubmitModal(true)}>
              <FilePlus2 size={16} /> Tạo đơn mới
            </Button>
            <Button className="gap-2 rounded-full" onClick={() => setSheetOpen(true)}>
              <Plus size={16} /> Đổi ca
            </Button>
          </div>
        }
      />

      <ApplicationsStatsRow stats={currentHook.stats} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="mine">Đơn của tôi</TabsTrigger>
            {isManager && <TabsTrigger value="manage">Quản lý phê duyệt</TabsTrigger>}
          </TabsList>
          <Button variant="ghost" size="sm" onClick={currentHook.refetch} className="gap-2 h-8 text-xs">
            <RefreshCw size={14} className={currentHook.isRefreshing ? "animate-spin" : ""} /> Làm mới
          </Button>
        </div>

        <ApplicationsFiltersRow
          statusFilter={currentHook.statusFilter}
          typeFilter={currentHook.typeFilter}
          onStatusChange={handleStatusFilter}
          onTypeChange={handleTypeFilter}
        />

        <TabsContent value="mine">
          <PageCard className="p-0 overflow-hidden" noBorder={false}>
            <ApplicationsTable
              applications={myApps.applications}
              isLoading={myApps.isLoading}
              mode="mine"
              onCancel={setCancelTarget}
            />
          </PageCard>
          <ApplicationsPagination page={myApps.page} totalPages={myApps.totalPages} onPageChange={myApps.setPage} />
        </TabsContent>

        {isManager && (
          <TabsContent value="manage">
            <PageCard className="p-0 overflow-hidden" noBorder={false}>
              <ApplicationsTable
                applications={manageApps.applications}
                isLoading={manageApps.isLoading}
                mode="manage"
                processingId={manageApps.processingId}
                onApprove={manageApps.handleApprove}
                onReject={setRejectTargetId}
              />
            </PageCard>
            <ApplicationsPagination
              page={manageApps.page}
              totalPages={manageApps.totalPages}
              onPageChange={manageApps.setPage}
            />
          </TabsContent>
        )}
      </Tabs>

      <ShiftChangeRequestDialog open={sheetOpen} onOpenChange={setSheetOpen} />

      {showSubmitModal && (
        <SubmitApplicationModal onClose={() => setShowSubmitModal(false)} onSuccess={myApps.refetch} />
      )}

      {cancelTarget && (
        <CancelApplicationDialog
          app={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          isLoading={myApps.cancellingId === cancelTarget.id}
        />
      )}

      {rejectTargetId && (
        <RejectApplicationDialog
          onCancel={() => setRejectTargetId(null)}
          onConfirm={handleRejectConfirm}
          isLoading={manageApps.processingId === rejectTargetId}
        />
      )}
    </div>
  )
}
