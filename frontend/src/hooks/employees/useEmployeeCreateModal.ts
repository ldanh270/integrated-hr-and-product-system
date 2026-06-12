import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
  ROLE,
} from "@/config/entities/employee.config"
import type { CreateEmployeeDto } from "@/types/employee.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useCreateEmployee } from "./queries/useEmployeeQuery"

const createSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên quá dài")
    .trim(),

  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập quá dài")
    .trim(),

  email: z.string().email("Định dạng email không hợp lệ").trim(),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
    ),

  role: z.enum(EMPLOYEE_ROLES),
  employeeType: z.enum(EMPLOYEE_TYPES),
  status: z.enum(EMPLOYEE_STATUSES).optional(),

  phone: z
    .string()
    .refine(
      (val) => val === "" || /^[0-9+\-\s()]{7,20}$/.test(val),
      "Định dạng số điện thoại không hợp lệ",
    )
    .optional(),

  position: z.string().max(100, "Chức danh quá dài").optional(),

  dateOfBirth: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), { message: "Ngày sinh không hợp lệ" })
    .optional(),

  nationalId: z
    .string()
    .refine(
      (val) => val === "" || (val.length >= 9 && val.length <= 20),
      "CCCD/CMND phải từ 9 đến 20 ký tự",
    )
    .optional(),

  address: z.string().max(500, "Địa chỉ quá dài").optional(),

  startDate: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày bắt đầu làm việc không hợp lệ",
    })
    .optional(),
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
    mode: "onBlur", // Thêm mode onBlur để validate khi user rời khỏi trường nhập
    defaultValues: {
      role: ROLE.EMPLOYEE,
      employeeType: EMPLOYEE_TYPES[0],
      status: EMPLOYEE_STATUSES[0],
    },
  })

  const onSubmit = async (data: CreateFormValues) => {
    try {
      const formattedData: CreateEmployeeDto = {
        ...data,
        phone: data.phone === "" ? undefined : data.phone,
        position: data.position === "" ? undefined : data.position,
        dateOfBirth: data.dateOfBirth === "" ? undefined : data.dateOfBirth,
        nationalId: data.nationalId === "" ? undefined : data.nationalId,
        address: data.address === "" ? undefined : data.address,
        startDate: data.startDate === "" ? undefined : data.startDate,
      }
      await createMutation.mutateAsync(formattedData)
      reset()
      onClose()
    } catch (error: any) {
      console.error(error)
      const errorMsg = error.response?.data?.error?.message || "Có lỗi xảy ra khi thêm nhân sự"
      toast.error(errorMsg)
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
