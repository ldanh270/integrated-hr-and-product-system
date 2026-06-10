import { EMPLOYEE_ROLES, EMPLOYEE_TYPES, ROLE } from "@/config/entities/employee.config"

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
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(50, "Username quá dài")
    .trim()
    .toLowerCase(),
  email: z.string().email("Email không hợp lệ").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)",
    ),
  role: z.enum(EMPLOYEE_ROLES),
  employeeType: z.enum(EMPLOYEE_TYPES),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9+\-\s()]{7,20}$/.test(val), {
      message: "Số điện thoại không hợp lệ (7-20 chữ số)",
    }),
  position: z.string().max(100, "Vị trí quá dài").optional(),
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
      toast.success("Thêm nhân sự mới thành công!")
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

