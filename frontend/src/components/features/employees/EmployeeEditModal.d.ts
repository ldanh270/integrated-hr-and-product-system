import type { Employee } from "../../../types/employee.types"

interface Props {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}
export declare function EmployeeEditModal({
  isOpen,
  onClose,
  employee,
}: Props): import("react/jsx-runtime").JSX.Element | null
export {}
