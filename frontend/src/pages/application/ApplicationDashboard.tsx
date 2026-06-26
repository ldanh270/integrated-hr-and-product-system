"use client"

import { BatchApplicationDetail } from "@/components/features/application/BatchApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplication } from "@/lib/api/application.api"
import type { IApplicationBatch } from "@/lib/api/application-batch.api"

import { useEffect, useState } from "react"

import { ChevronRight, Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { CancelDialog } from "./components/CancelDialog"
import { RejectDialog } from "./components/RejectDialog"
import { SubmitApplicationModal } from "./components/SubmitApplicationModal"

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationDashboard() {
  // View State: "list" | "detail"
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedBatch, setSelectedBatch] = useState<IApplicationBatch | null>(null)

  const [searchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") || "manage") as "mine" | "manage"
  const activeType = searchParams.get("type") || "all"

  const myApps = useMyApplications()
  const manageApps = useManageApplications()

  useEffect(() => {
    setView("list")
    setSelectedBatch(null)
    myApps.setTypeFilter(activeType)
    manageApps.setTypeFilter(activeType)
  }, [activeTab, activeType, myApps.setTypeFilter, manageApps.setTypeFilter])

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [createType, setCreateType] = useState<string | undefined>(undefined)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
    // If we want to support cancelling single apps from dashboard, we can here, but BatchApplicationDetail handles its own batch cancellation.
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
    // Remain in detail view so manager can process other items
  }

  const handleApproveFromDetail = async (app: IApplication) => {
    await manageApps.handleApprove(app.id)
  }

  const handleRowClick = (batch: unknown) => {
    setSelectedBatch(batch as IApplicationBatch)
    setView("detail")
  }

  if (view === "detail") {
    return (
      <BatchApplicationDetail
        batch={selectedBatch}
        isLoading={activeTab === "mine" ? myApps.isLoading : manageApps.isLoading}
        mode={activeTab}
        onBack={() => {
          setView("list")
        }}
        onApproveSingle={handleApproveFromDetail}
        onRejectSingle={setRejectTarget}
      />
    )
  }

  const currentTypeConfig = Object.values(APPLICATION_TYPES).find((t) => t.LABEL === activeType)

  return (
    <div className="flex flex-col gap-6 p-6 w-full mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
              onClick={() => {
                setCreateType(undefined)
                setShowSubmitModal(true)
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center text-[15px]">
            <span className="font-semibold text-foreground">Đơn thư</span>
            <ChevronRight className="mx-2 text-muted-foreground/70" size={16} />
            {searchParams.get("tab") === "manage" ? (
              <span className="text-muted-foreground font-medium">Bạn duyệt</span>
            ) : searchParams.get("tab") === "mine" ? (
              <span className="text-muted-foreground font-medium">Của bạn</span>
            ) : (
              <>
                <span className="text-muted-foreground font-medium">Danh sách đơn thư</span>
                {currentTypeConfig && (
                  <>
                    <ChevronRight className="mx-2 text-muted-foreground/70" size={16} />
                    <span className="text-primary font-medium">
                      {currentTypeConfig.DESCRIPTION}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-4 min-w-0 bg-background border border-border rounded-xl px-6 pb-6 shadow-sm">
        <ApplicationList
          mode={activeTab}
          onRowClick={handleRowClick}
          hookState={activeTab === "mine" ? myApps : manageApps}
        />
      </div>

      {/* Modals */}
      {showSubmitModal && (
        <SubmitApplicationModal
          onClose={() => {
            setShowSubmitModal(false)
          }}
          onSuccess={() => {
            void myApps.refetch()
          }}
          initialType={createType}
        />
      )}
      {cancelTarget && (
        <CancelDialog
          app={cancelTarget}
          onCancel={() => {
            setCancelTarget(null)
          }}
          onConfirm={() => {
            void handleCancelConfirm()
          }}
          isLoading={myApps.cancellingId === cancelTarget.id}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          app={rejectTarget}
          onCancel={() => {
            setRejectTarget(null)
          }}
          onConfirm={(reason) => {
            void handleRejectConfirm(reason)
          }}
          isLoading={manageApps.processingId === rejectTarget.id}
        />
      )}
    </div>
  )
}
