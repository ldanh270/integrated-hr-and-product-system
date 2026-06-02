import type { Employee } from "../../types/employee.types"

export declare function useEmployeeEditModal(
  employee: Employee | null,
  isOpen: boolean,
  onClose: () => void,
): {
  register: import("react-hook-form").UseFormRegister<{
    fullName?: string | undefined
    phone?: string | undefined
    position?: string | undefined
    employeeType?: "full_time" | "part_time" | "contractor" | "intern" | undefined
    status?: "active" | "inactive" | "on_leave" | "terminated" | undefined
  }>
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  errors: import("react-hook-form").FieldErrors<{
    fullName?: string | undefined
    phone?: string | undefined
    position?: string | undefined
    employeeType?: "full_time" | "part_time" | "contractor" | "intern" | undefined
    status?: "active" | "inactive" | "on_leave" | "terminated" | undefined
  }>
  isPending: boolean
}
