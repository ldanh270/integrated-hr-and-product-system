import { type IApprovalItem } from "../../lib/api/approval.api"

export type CategoryFilter = "all" | "application" | "password_reset" | "recruitment_proposal"
export declare function useApplicationDashboard(): {
  approvals: IApprovalItem[]
  isLoading: boolean
  searchTerm: string
  setSearchTerm: import("react").Dispatch<import("react").SetStateAction<string>>
  activeCategory: CategoryFilter
  setActiveCategory: import("react").Dispatch<import("react").SetStateAction<CategoryFilter>>
  selectedApproval: IApprovalItem | null
  setSelectedApproval: import("react").Dispatch<
    import("react").SetStateAction<IApprovalItem | null>
  >
  rejectingItem: IApprovalItem | null
  setRejectingItem: import("react").Dispatch<import("react").SetStateAction<IApprovalItem | null>>
  rejectReason: string
  setRejectReason: import("react").Dispatch<import("react").SetStateAction<string>>
  isProcessing: boolean
  newTempPassword: string
  setNewTempPassword: import("react").Dispatch<import("react").SetStateAction<string>>
  approvedEmployeeName: string
  setApprovedEmployeeName: import("react").Dispatch<import("react").SetStateAction<string>>
  user: import("../../store/auth-store").User | null
  handleApprove: (item: IApprovalItem) => Promise<void>
  handleRejectSubmit: (e: React.FormEvent) => Promise<void>
  filteredApprovals: IApprovalItem[]
  pendingCount: number
  appCount: number
  pwCount: number
  recruitmentCount: number
}
