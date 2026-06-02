import type { Employee, EmployeeListQuery, EmployeeType } from "../../types/employee.types"

export declare const useEmployeeMaster: () => {
  query: EmployeeListQuery
  setQuery: import("react").Dispatch<import("react").SetStateAction<EmployeeListQuery>>
  activeTab: "all" | "full_time" | "part_time" | "contractor" | "intern"
  isCreateModalOpen: boolean
  setIsCreateModalOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>
  editEmployee: Employee | null
  setEditEmployee: import("react").Dispatch<import("react").SetStateAction<Employee | null>>
  activeActionMenu: string | null
  setActiveActionMenu: import("react").Dispatch<import("react").SetStateAction<string | null>>
  data: NoInfer<import("../../types/employee.types").PaginatedEmployees> | undefined
  isLoading: boolean
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTabChange: (tab: "all" | EmployeeType) => void
  handleDelete: (id: string) => Promise<void>
  isAdminOrManager: boolean
  navigate: import("react-router").NavigateFunction
}
