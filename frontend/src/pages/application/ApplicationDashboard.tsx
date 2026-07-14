"use client"

import { ApplicationDetail } from "@/components/features/application/ApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import { useAllApplications } from "@/hooks/application/useAllApplications"
import type { IApplication } from "@/lib/api/application.api"

import { startTransition, useEffect, useState } from "react"

import { Plus } from "lucide-react"
import { useLocation, useSearchParams, useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/routes.config"

import { CancelDialog } from "@/components/features/application/CancelDialog"
import { RejectDialog } from "@/components/features/application/RejectDialog"
import { SubmitApplicationModal } from "@/components/features/application/SubmitApplicationModal"

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationDashboard() {
  // View State: "list" | "detail"
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)
  const [mineSubTab, setMineSubTab] = useState<"list" | "leaves">("list")

  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  let activeTab: "mine" | "manage" | "all" = "mine"
  if (location.pathname.startsWith(ROUTES.APPLICATION.MANAGE)) activeTab = "manage"
  else if (location.pathname.startsWith(ROUTES.APPLICATION.ALL)) activeTab = "all"
  
  const activeType = searchParams.get("type") || "all"

  const myApps = useMyApplications()
  const manageApps = useManageApplications()
  const allApps = useAllApplications()

  const { setTypeFilter: setMyTypeFilter } = myApps
  const { setTypeFilter: setManageTypeFilter } = manageApps
  const { setTypeFilter: setAllTypeFilter } = allApps

  useEffect(() => {
    startTransition(() => {
      setView("list")
      setSelectedApp(null)
    })
    setMyTypeFilter(activeType)
    setManageTypeFilter(activeType)
    setAllTypeFilter(activeType)
  }, [activeTab, activeType, setManageTypeFilter, setMyTypeFilter, setAllTypeFilter])

  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const [createType, setCreateType] = useState<string | undefined>(undefined)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)
  const [swapConfirmTarget, setSwapConfirmTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
    if (view === "detail" && selectedApp?.id === cancelTarget.id) setView("list")
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
    if (view === "detail" && selectedApp?.id === rejectTarget.id) {
      setView("list")
    }
  }

  const handleApproveFromDetail = async (app: IApplication) => {
    await manageApps.handleApprove(app.id)
    setView("list")
  }

  const handleSwapConfirmFromDetail = async (app: IApplication) => {
    await manageApps.handleSwapConfirm(app.id)
    setView("list")
  }

  const handleSwapRejectConfirm = async (reason: string) => {
    if (!swapConfirmTarget) return
    await manageApps.handleSwapReject(swapConfirmTarget.id, reason)
    setSwapConfirmTarget(null)
    if (view === "detail" && selectedApp?.id === swapConfirmTarget.id) setView("list")
  }

  const handleRowClick = (app: IApplication) => {
    setSelectedApp(app)
    setView("detail")
  }

  if (view === "detail") {
    return (
      <>
        <ApplicationDetail
          application={selectedApp}
          isLoading={activeTab === "mine" ? myApps.isLoading : activeTab === "manage" ? manageApps.isLoading : allApps.isLoading}
          mode={activeTab}
          onBack={() => {
            setView("list")
            navigate(ROUTES.APPLICATION.BASE)
          }}
          onApprove={handleApproveFromDetail}
          onReject={setRejectTarget}
          onSwapConfirm={handleSwapConfirmFromDetail}
          onSwapReject={setSwapConfirmTarget}
        />
        {/* Detail View Modals */}
        {rejectTarget && (
          <RejectDialog
            app={rejectTarget}
            onCancel={() => {
              setRejectTarget(null)
            }}
            onConfirm={(reason: string) => {
              void handleRejectConfirm(reason)
            }}
            isLoading={manageApps.processingId === rejectTarget.id}
          />
        )}
        {swapConfirmTarget && (
          <RejectDialog
            app={swapConfirmTarget}
            onCancel={() => {
              setSwapConfirmTarget(null)
            }}
            onConfirm={(reason: string) => {
              void handleSwapRejectConfirm(reason)
            }}
            isLoading={manageApps.processingId === swapConfirmTarget.id}
            title="Không duyệt đổi ca"
            description="Bạn có chắc chắn muốn không duyệt đổi ca này không?"
            optionalReason={true}
          />
        )}
      </>
    )
  }


  return (
    <div className="flex flex-col gap-6 p-6 w-full mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
              onClick={() => {
                setCreateType(undefined)
                setShowSubmitModal(true)
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tạo đơn
            </button>
          </div>
        </div>

        {activeTab === "mine" && (
          <div className="flex items-center gap-6 border-b border-border mt-2">
            <button
              onClick={() => { setMineSubTab("list"); }}
              className={`relative flex items-center py-3 font-medium text-[14px] transition-colors ${
                mineSubTab === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Danh sách đơn
              {mineSubTab === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => { setMineSubTab("leaves"); }}
              className={`relative flex items-center py-3 font-medium text-[14px] transition-colors ${
                mineSubTab === "leaves" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tổng phép
              {mineSubTab === "leaves" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
          </div>
        )}
      </div>

      {mineSubTab === "list" || activeTab === "manage" || activeTab === "all" ? (
        <div className="flex-1 w-full mt-4 min-w-0 bg-background border border-border rounded-xl p-6 shadow-sm">
          <ApplicationList
            mode={activeTab}
            onRowClick={handleRowClick}
            hookState={activeTab === "mine" ? myApps : activeTab === "manage" ? manageApps : allApps}
          />
        </div>
      ) : (
        <div className="flex-1 w-full mt-4 min-w-0 bg-background border border-border rounded-xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse border border-border">
              <thead>
                <tr>
                  <th
                    colSpan={3}
                    className="px-4 py-3 bg-muted/50 border border-border text-center font-semibold text-foreground"
                  >
                    Tổng phép
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-3 bg-muted/50 border border-border text-center font-semibold text-foreground w-1/3">
                    Số phép
                  </th>
                  <th className="px-4 py-3 bg-muted/50 border border-border text-center font-semibold text-foreground w-1/3">
                    Đã dùng
                  </th>
                  <th className="px-4 py-3 bg-muted/50 border border-border text-center font-semibold text-foreground w-1/3">
                    Còn lại
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-border text-center text-foreground font-medium">
                    7
                  </td>
                  <td className="px-4 py-4 border border-border text-center text-foreground font-medium">
                    0
                  </td>
                  <td className="px-4 py-4 border border-border text-center text-foreground font-medium">
                    7
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSubmitModal && (
        <SubmitApplicationModal
          onClose={() => {
            setShowSubmitModal(false)
          }}
          onSuccess={() => {
            void myApps.refetch()
            void manageApps.refetch()
            void allApps.refetch()
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
          onConfirm={(reason: string) => {
            void handleRejectConfirm(reason)
          }}
          isLoading={manageApps.processingId === rejectTarget.id}
        />
      )}
      {swapConfirmTarget && (
        <RejectDialog
          app={swapConfirmTarget}
          onCancel={() => {
            setSwapConfirmTarget(null)
          }}
          onConfirm={(reason: string) => {
            void handleSwapRejectConfirm(reason)
          }}
          isLoading={manageApps.processingId === swapConfirmTarget.id}
          title="Không duyệt đổi ca"
          description="Bạn có chắc chắn muốn không duyệt đổi ca này không?"
          optionalReason={true}
        />
      )}
    </div>
  )
}
