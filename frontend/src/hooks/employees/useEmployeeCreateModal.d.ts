export declare function useEmployeeCreateModal(onClose: () => void): {
  register: import("react-hook-form").UseFormRegister<{
    fullName: string
    username: string
    email: string
    password: string
    role: "admin" | "hr_manager" | "general_manager" | "team_leader" | "employee"
    employeeType: "full_time" | "part_time" | "contractor" | "intern"
    phone?: string | undefined
    position?: string | undefined
  }>
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  errors: import("react-hook-form").FieldErrors<{
    fullName: string
    username: string
    email: string
    password: string
    role: "admin" | "hr_manager" | "general_manager" | "team_leader" | "employee"
    employeeType: "full_time" | "part_time" | "contractor" | "intern"
    phone?: string | undefined
    position?: string | undefined
  }>
  isPending: boolean
  handleClose: () => void
}
