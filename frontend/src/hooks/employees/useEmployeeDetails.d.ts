export declare const useEmployeeDetails: () => {
  employee: NoInfer<import("../../types/employee.types").Employee> | undefined
  isLoading: boolean
  error: Error | null
  isAdminOrManager: boolean
  isEditModalOpen: boolean
  setIsEditModalOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>
  handleBackToList: () => void
}
