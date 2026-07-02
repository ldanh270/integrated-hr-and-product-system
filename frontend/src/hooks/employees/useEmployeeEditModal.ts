import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
} from "@/config/entities/employee.config"
import type { Employee, UpdateEmployeeDto } from "@/types/employee.types"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useUpdateEmployee } from "./queries/useEmployeeQuery"

const editSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên quá dài")
    .trim()
    .optional(),

  email: z.string().email("Định dạng email không hợp lệ").trim().optional(),

  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập quá dài")
    .trim()
    .optional(),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
    )
    .or(z.literal(""))
    .optional(),

  role: z.enum(EMPLOYEE_ROLES).optional(),

  phone: z
    .string()
    .refine(
      (val) => !val || val === "" || /^[0-9+\-\s()]{7,20}$/.test(val),
      "Định dạng số điện thoại không hợp lệ",
    )
    .optional(),

  position: z.string().max(100, "Chức danh quá dài").optional(),

  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  
  totalLeaves: z.number().int("Tổng phép phải là số nguyên").min(0, "Tổng phép không hợp lệ").optional(),
  usedLeaves: z.number().int("Số phép đã dùng phải là số nguyên").min(0, "Số phép đã dùng không hợp lệ").optional(),

  dateOfBirth: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    })
    .optional(),

  nationalId: z
    .string()
    .refine(
      (val) => !val || val === "" || (val.length >= 9 && val.length <= 20),
      "CCCD/CMND phải từ 9 đến 20 ký tự",
    )
    .optional(),

  address: z.string().max(500, "Địa chỉ quá dài").optional(),

  startDate: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày bắt đầu làm việc không hợp lệ",
    })
    .optional(),

  endDate: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày kết thúc không hợp lệ",
    })
    .optional(),
})

type EditFormValues = z.infer<typeof editSchema>

export function useEmployeeEditModal(
  employee: Employee | null,
  isOpen: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onClose: () => void,
) {
  const updateMutation = useUpdateEmployee()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: "onBlur",
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
        email: employee.email,
        username: employee.username,
        role: employee.role,
        password: "",
        phone: employee.phone || undefined,
        position: employee.position || undefined,
        employeeType: employee.employeeType,
        status: employee.status,
        dateOfBirth: formatDateForInput(employee.dateOfBirth),
        nationalId: employee.nationalId || undefined,
        address: employee.address || undefined,
        startDate: formatDateForInput(employee.startDate),
        endDate: formatDateForInput(employee.endDate),
        totalLeaves: employee.totalLeaves,
        usedLeaves: employee.usedLeaves,
      })
    }
  }, [employee, isOpen, reset])

  const onSubmitEmployee = async (data: EditFormValues) => {
    if (!employee) return
    const formattedData: UpdateEmployeeDto = {
      ...data,
      password: data.password === "" ? undefined : data.password,
      phone: data.phone === "" ? null : data.phone,
      position: data.position === "" ? null : data.position,
      dateOfBirth: data.dateOfBirth === "" ? null : data.dateOfBirth,
      nationalId: data.nationalId === "" ? null : data.nationalId,
      address: data.address === "" ? null : data.address,
      startDate: data.startDate === "" ? null : data.startDate,
      endDate: data.endDate === "" ? null : data.endDate,
      totalLeaves: data.totalLeaves,
      usedLeaves: data.usedLeaves,
    }
    await updateMutation.mutateAsync({ id: employee.id, data: formattedData })
  }

  return {
    register,
    watch,
    handleSubmit,
    onSubmitEmployee,
    errors,
    isPending: updateMutation.isPending,
  }
}
