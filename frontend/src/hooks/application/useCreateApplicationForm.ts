import { APPLICATION_TYPES, LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { type IApprover, employeeApi } from "@/lib/api/employee.api"
import { SYSTEM_CONFIG } from "@/config/system.config"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export interface ApplicationFormState {
  startDate: string
  endDate: string
  reason: string
  note: string
  leaveType: string
  leaveRegimeType: typeof REGIME_TYPE.PAID | typeof REGIME_TYPE.UNPAID
  employeeShiftId: string
  overtimeHours: number
  durationMinutes: number
  isLate: boolean
  swapWithEmployeeId: string
  swapWithShiftId: string
  swapWithDate: string
  location: string
  documentUrl: string
}

export const getInitialFormState = (): ApplicationFormState => ({
  startDate: "",
  endDate: "",
  reason: "",
  note: "",
  leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
  leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
  employeeShiftId: "",
  overtimeHours: 0,
  durationMinutes: 30,
  isLate: true,
  swapWithEmployeeId: "",
  swapWithShiftId: "",
  swapWithDate: "",
  location: "",
  documentUrl: "",
})

export function useCreateApplicationForm(type: string) {
  const navigate = useNavigate()
  const { isSubmitting, submitApplication, submitBulkApplications } = useSubmitApplication()

  const [assignedToId, setAssignedToId] = useState("")
  const [forms, setForms] = useState<ApplicationFormState[]>([getInitialFormState()])

  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    employeeApi
      .getApprovers()
      .then(setApprovers)
      .catch(() => {})
    employeeApi
      .list({ limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT })
      .then((res) => { setEmployees(res.data); })
      .catch(() => {})
  }, [])

  const addForm = () => setForms((prev) => [...prev, getInitialFormState()])
  
  const removeForm = (index: number) => setForms((prev) => prev.filter((_, i) => i !== index))

  const updateForm = <K extends keyof ApplicationFormState>(index: number, k: K, v: ApplicationFormState[K]) => {
    setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [k]: v } : f)))
  }

  const handleSubmit = async () => {
    if (type !== APPLICATION_TYPES.RESIGNATION.LABEL && (!assignedToId || assignedToId === "none")) {
      toast.error("Vui lòng chọn người duyệt")
      return
    }

    // Validation for all forms
    for (const [index, form] of forms.entries()) {
      if (!form.startDate) {
        toast.error(`Vui lòng nhập ngày bắt đầu (Đơn ${index + 1})`)
        return
      }

      switch (type) {
        case APPLICATION_TYPES.LEAVE.LABEL:
          break;

        case APPLICATION_TYPES.OVERTIME.LABEL:
          if (form.startDate && new Date(form.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.error(`Không thể đăng ký tăng ca cho ngày trong quá khứ (Đơn ${index + 1})`)
            return
          }
          break

        case APPLICATION_TYPES.RESIGNATION.LABEL:
          if (!assignedToId || assignedToId === "none") {
            toast.error("Vui lòng chọn người duyệt")
            return
          }
          if (form.startDate && new Date(form.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.error("Không thể đăng ký thôi việc cho ngày trong quá khứ")
            return
          }
          break

        case APPLICATION_TYPES.LATE_EARLY.LABEL:
          if (form.startDate && new Date(form.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.error(`Không thể đăng ký cho ngày trong quá khứ (Đơn ${index + 1})`)
            return
          }
          if (!form.employeeShiftId) {
            toast.error(`Vui lòng chọn ca làm việc (Đơn ${index + 1})`)
            return
          }
          if (!form.durationMinutes || form.durationMinutes < 1 || form.durationMinutes > 480) {
            toast.error(`Số phút phải từ 1 đến 480 (Đơn ${index + 1})`)
            return
          }
          break

        case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
          if (!form.employeeShiftId) {
            toast.error(`Vui lòng chọn ca của bạn (Đơn ${index + 1})`)
            return
          }
          if (!form.swapWithEmployeeId) {
            toast.error(`Vui lòng chọn nhân sự đổi ca (Đơn ${index + 1})`)
            return
          }
          if (!form.swapWithShiftId) {
            toast.error(`Vui lòng chọn ca của đồng nghiệp (Đơn ${index + 1})`)
            return
          }
          break

        case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
          if (form.startDate && new Date(form.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.error(`Không thể đăng ký làm việc từ xa cho ngày trong quá khứ (Đơn ${index + 1})`)
            return
          }
          if (!form.employeeShiftId) {
            toast.error(`Vui lòng chọn ca làm việc (Đơn ${index + 1})`)
            return
          }
          break
      }
    }

    try {
      const payload: any[] = forms.map((form) => {
        let detail: Record<string, unknown> = {}

        switch (type) {
          case APPLICATION_TYPES.LEAVE.LABEL:
            detail = {
              leaveType: form.leaveType,
              regimeType: form.leaveRegimeType,
              documentUrl: form.documentUrl || undefined,
            }
            break
          case APPLICATION_TYPES.OVERTIME.LABEL:
            detail = {
              employeeShiftId: form.employeeShiftId,
              overtimeMinutes: Math.round(form.overtimeHours * 60),
            }
            break
          case APPLICATION_TYPES.LATE_EARLY.LABEL:
            detail = {
              employeeShiftId: form.employeeShiftId.trim(),
              durationMinutes: form.durationMinutes,
              isLate: form.isLate,
            }
            break
          case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
            detail = {
              employeeShiftId: form.employeeShiftId.trim(),
              swapWithEmployeeId: form.swapWithEmployeeId.trim(),
              swapWithShiftId: form.swapWithShiftId.trim(),
            }
            break
          case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
            detail = {
              employeeShiftId: form.employeeShiftId,
            }
            break
          case APPLICATION_TYPES.RESIGNATION.LABEL:
            detail = {}
            break
        }

        return {
          type,
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          reason: form.reason || undefined,
          note: form.note || undefined,
          assignedToId: assignedToId && assignedToId !== "none" ? assignedToId : undefined,
          detail,
        }
      })

      let success = false
      if (payload.length === 1) {
        success = await submitApplication(payload[0])
      } else {
        success = await submitBulkApplications(payload)
      }

      if (success) {
        navigate(-1)
      }
    } catch (error: any) {
      // isSubmitting handles the toast
    }
  }

  return {
    forms,
    assignedToId,
    setAssignedToId,
    addForm,
    removeForm,
    updateForm,
    approvers,
    employees,
    isSubmitting,
    handleSubmit,
  }
}
