"use client"

import { ApplicationList } from "@/components/features/application/ApplicationList"
import { BatchApplicationDetail } from "@/components/features/application/BatchApplicationDetail"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplicationBatch } from "@/lib/api/application-batch.api"
import type { IApplication } from "@/lib/api/application.api"
import { useAuthStore } from "@/store/auth-store"

import { useEffect, useState } from "react"

import { Plus } from "lucide-react"
import { useLocation, useSearchParams } from "react-router-dom"

import { CancelDialog } from "./components/CancelDialog"
import { RejectDialog } from "./components/RejectDialog"
import { SubmitApplicationModal } from "./components/SubmitApplicationModal"

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationDashboard() {
  // View State: "list" | "detail"
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedBatch, setSelectedBatch] = useState<IApplicationBatch | null>(null)
  const [dashboardTab, setDashboardTab] = useState<"list" | "leaves">("list")

  const { user } = useAuthStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  let activeTab: "mine" | "manage" | "all" = "all"
  if (location.pathname.includes("/application/manage")) {
    activeTab = "manage"
  } else if (location.pathname.includes("/personal/applications")) {
    activeTab = "mine"
  } else if (location.pathname.includes("/application/all")) {
    activeTab = "all"
  }

  const activeType = searchParams.get("type") || "all"
  const detailId = searchParams.get("detail")

  const myApps = useMyApplications()
  const manageApps = useManageApplications(activeTab === "manage" ? "assigned" : "all")

  // Sync view state with URL param so browser back button works
  useEffect(() => {
    if (!detailId) {
      setTimeout(() => {
        setView("list")
        setSelectedBatch(null)
      }, 0)
    }
  }, [detailId])

  // Sync selectedBatch with the latest fetched applications data
  useEffect(() => {
    if (view === "detail" && selectedBatch) {
      const currentList = activeTab === "mine" ? myApps.applications : manageApps.applications
      const updatedBatch = currentList.find((b) => b.id === selectedBatch.id)

      if (updatedBatch) {
        if (JSON.stringify(updatedBatch) !== JSON.stringify(selectedBatch)) {
          setTimeout(() => setSelectedBatch(updatedBatch), 0)
        }
      } else if (
        !myApps.isLoading &&
        !manageApps.isLoading &&
        !myApps.isRefreshing &&
        !manageApps.isRefreshing
      ) {
        // The batch was removed from the list (e.g. fully approved and we are in "pending" view)
        setTimeout(() => {
          setView("list")
          setSearchParams((prev) => {
            prev.delete("detail")
            return prev
          })
        }, 0)
      }
    }
  }, [
    view,
    selectedBatch?.id,
    activeTab,
    myApps.applications,
    manageApps.applications,
    myApps.isLoading,
    manageApps.isLoading,
    myApps.isRefreshing,
    manageApps.isRefreshing,
    setSearchParams,
  ])

  useEffect(() => {
    if (activeType !== "all") {
      setTimeout(() => {
        setView("list")
        setSelectedBatch(null)
      }, 0)
    }
    myApps.setTypeFilter(activeType)
    manageApps.setTypeFilter(activeType)
  }, [activeTab, activeType, myApps.setTypeFilter, manageApps.setTypeFilter, detailId])

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [createType, setCreateType] = useState<string | undefined>(undefined)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
  }

  const handleApproveFromDetail = async (app: IApplication) => {
    await manageApps.handleApprove(app.id)
  }

  const handleRowClick = (batch: unknown) => {
    const b = batch as IApplicationBatch
    setSelectedBatch(b)
    setView("detail")
    setSearchParams((prev) => {
      prev.set("detail", b.id)
      return prev
    })
  }

  if (view === "detail") {
    return (
      <BatchApplicationDetail
        batch={selectedBatch}
        isLoading={activeTab === "mine" ? myApps.isLoading : manageApps.isLoading}
        mode={activeTab}
        onBack={() => {
          setView("list")
          setSearchParams((prev) => {
            prev.delete("detail")
            return prev
          })
        }}
        onApproveSingle={handleApproveFromDetail}
        onRejectSingle={setRejectTarget}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex h-9 px-4 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
            onClick={() => {
              setCreateType(undefined)
              setShowSubmitModal(true)
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo đơn
          </button>
        </div>
      </div>

      {activeTab === "mine" && (
        <div className="flex border-b border-border">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${dashboardTab === "list" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => { setDashboardTab("list") }}
          >
            Danh sách đơn
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${dashboardTab === "leaves" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => { setDashboardTab("leaves") }}
          >
            Tổng phép
          </button>
        </div>
      )}

      <div className="flex-1 w-full mt-2 min-w-0 bg-background border border-border rounded-xl p-6 shadow-sm">
        {dashboardTab === "list" || activeTab !== "mine" ? (
          <ApplicationList
            mode={activeTab}
            onRowClick={handleRowClick}
            hookState={activeTab === "mine" ? myApps : manageApps}
          />
        ) : (
          <div className="w-full">
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <table className="w-full text-sm text-center">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th
                      colSpan={3}
                      className="py-3 px-4 font-semibold text-muted-foreground border-b border-border"
                    >
                      Tổng phép
                    </th>
                  </tr>
                  <tr>
                    <th className="py-3 px-4 font-semibold text-muted-foreground border-r border-border w-1/3">
                      Số phép
                    </th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground border-r border-border w-1/3">
                      Đã dùng
                    </th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground w-1/3">Còn lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  <tr>
                    <td className="py-4 px-4 font-medium text-foreground border-r border-border">
                      {user?.totalLeaves ?? 12}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground border-r border-border">
                      {user?.usedLeaves ?? 0}
                    </td>
                    <td className="py-4 px-4 font-medium text-primary">
                      {(user?.totalLeaves ?? 12) - (user?.usedLeaves ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
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
