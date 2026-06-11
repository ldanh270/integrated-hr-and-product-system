import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from "@/config/entities/employee.config"
import type { Employee, UpdateEmployeeDto } from "@/types/employee.types"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useUpdateEmployee } from "./queries/useEmployeeQuery"

const editSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
      const formatDateForInput = (date: string | Date | null) => {
        if (!date) return undefined
        if (typeof date === "string") return date.split("T")[0]
        return date.toISOString().split("T")[0]
      }

      reset({
        fullName: employee.fullName,
        phone: employee.phone || undefined,
        position: employee.position || undefined,
        employeeType: employee.employeeType,
        status: employee.status,
        dateOfBirth: formatDateForInput(employee.dateOfBirth),
        nationalId: employee.nationalId || undefined,
        address: employee.address || undefined,
        startDate: formatDateForInput(employee.startDate),
        endDate: formatDateForInput(employee.endDate),
      })
    }
  }, [employee, isOpen, reset])

  const onSubmit = async (data: EditFormValues) => {
    if (!employee) return
    try {
      const formattedData: UpdateEmployeeDto = {
        ...data,
        phone: data.phone === "" ? null : data.phone,
        position: data.position === "" ? null : data.position,
        dateOfBirth: data.dateOfBirth === "" ? null : data.dateOfBirth,
        nationalId: data.nationalId === "" ? null : data.nationalId,
        address: data.address === "" ? null : data.address,
        startDate: data.startDate === "" ? null : data.startDate,
        endDate: data.endDate === "" ? null : data.endDate,
      }
      await updateMutation.mutateAsync({ id: employee.id, data: formattedData })
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
