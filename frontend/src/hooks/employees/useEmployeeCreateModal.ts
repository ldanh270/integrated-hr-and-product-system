import { EMPLOYEE_ROLES, EMPLOYEE_TYPES, ROLE } from "@/config/entities/employee.config"
import { useCreateEmployee } from "@/hooks/useEmployees"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const createSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(EMPLOYEE_ROLES),
  employeeType: z.enum(EMPLOYEE_TYPES),
  phone: z.string().optional(),
  position: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function useEmployeeCreateModal(onClose: () => void) {
  const createMutation = useCreateEmployee()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      role: ROLE.EMPLOYEE,
      employeeType: EMPLOYEE_TYPES[0],
    },
  })

  const onSubmit = async (data: CreateFormValues) => {
    try {
      await createMutation.mutateAsync(data)
      reset()
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isPending: createMutation.isPending,
    handleClose,
  }
}
