import { APPLICATION_TYPES, LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { shiftsApi } from "@/lib/api/attendance.api"
import { type IApprover, employeeApi } from "@/lib/api/employee.api"
import type { IWorkingShift } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export interface ApplicationFormState {
  startDate: string
  endDate: string
  reason: string
  note: string
  assignedToId: string
  leaveType: string
  leaveRegimeType: "paid" | "unpaid"
  employeeShiftId: string
  overtimeHours: number
  durationMinutes: number
  isLate: boolean
  swapWithEmployeeId: string
  swapWithShiftId: string
  swapWithDate: string
  location: string

}

export function useCreateApplicationForm(type: string) {
  const navigate = useNavigate()
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    assignedToId: "",
    // leave
    leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    // overtime / late_early / shift_swap
    employeeShiftId: "",
    overtimeHours: 0,
    // late_early specific
    durationMinutes: 30,
    isLate: true,
    // shift_swap
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    swapWithDate: "",
    // work_from_home
    location: "",

  })

  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [shifts, setShifts] = useState<IWorkingShift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    employeeApi
      .getApprovers()
      .then(setApprovers)
      .catch(() => {})
    shiftsApi
      .getAll()
      .then(setShifts)
      .catch(() => {})
    employeeApi
      .list({ limit: 1000 })
      .then((res) => { setEmployees(res.data); })
      .catch(() => {})
  }, [])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async () => {
    if (!form.startDate) {
      toast.error("Vui lòng nhập ngày bắt đầu")
      return
    }

    let detail: Record<string, unknown> = {}

    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim())
          detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break



      case APPLICATION_TYPES.RESIGNATION.LABEL:
        detail = {}
        break
    }

    const success = await submitApplication({
      type,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      assignedToId:
        form.assignedToId && form.assignedToId !== "none" ? form.assignedToId : undefined,
      detail,
    })

    if (success) {
      navigate(-1)
    }
  }

  return {
    form,
    set,
    approvers,
    shifts,
    employees,
    isSubmitting,
    handleSubmit
  }
}
