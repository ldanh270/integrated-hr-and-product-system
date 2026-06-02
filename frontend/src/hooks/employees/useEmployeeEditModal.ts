import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "@/config/entities/employee.config"
import { useUpdateEmployee } from "./queries/useEmployeeQuery"
import type { Employee } from "@/types/employee.types"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const editSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
})

type EditFormValues = z.infer<typeof editSchema>

export function useEmployeeEditModal(
  employee: Employee | null,
  isOpen: boolean,
  onClose: () => void,
) {
  const updateMutation = useUpdateEmployee()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (employee && isOpen) {
      reset({
        fullName: employee.fullName,
        phone: employee.phone || undefined,
        position: employee.position || undefined,
        employeeType: employee.employeeType,
        status: employee.status,
      })
    }
  }, [employee, isOpen, reset])

  const onSubmit = async (data: EditFormValues) => {
    if (!employee) return
    try {
      await updateMutation.mutateAsync({ id: employee.id, data })
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isPending: updateMutation.isPending,
  }
}
