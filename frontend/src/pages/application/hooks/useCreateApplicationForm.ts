import { APPLICATION_TYPES, LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"
import { applicationBatchApi } from "@/lib/api/application-batch.api"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { schedulesApi } from "@/lib/api/attendance.api"
import { type IApprover, employeeApi } from "@/lib/api/employee.api"
import type { IEmployeeShiftAssignment } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

// ─── Per-item form state ───────────────────────────────────────

export interface ApplicationFormItemState {
  startDate: string
  endDate: string
  reason: string
  note: string
  // leave
  leaveType: string
  leaveRegimeType: "paid" | "unpaid"
  // overtime / late_early / shift_swap
  employeeShiftId: string
  overtimeHours: number
  durationMinutes: number
  isLate: boolean
  // shift_swap
  swapWithEmployeeId: string
  swapWithShiftId: string
  swapWithDate: string
  // work_from_home
  location: string
  // resolved shift data (local, not submitted)
  _myEmployeeShift: IEmployeeShiftAssignment | null
  _partnerEmployeeShift: IEmployeeShiftAssignment | null
}

/** @deprecated — kept for external consumers of the old type */
export type ApplicationFormState = ApplicationFormItemState

// ─── Default empty form item ───────────────────────────────────

const createEmptyItem = (): ApplicationFormItemState => ({
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
  _myEmployeeShift: null,
  _partnerEmployeeShift: null,
})

// ─── Hook ──────────────────────────────────────────────────────

export function useCreateApplicationForm(type: string) {
  const navigate = useNavigate()
  const { isSubmitting: isSingleSubmitting, submitApplication } = useSubmitApplication()

  const [items, setItems] = useState<ApplicationFormItemState[]>([createEmptyItem()])
  const [assignedToId, setAssignedToId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Load static reference data once
  useEffect(() => {
    employeeApi
      .getApprovers()
      .then(setApprovers)
      .catch(() => {})
    employeeApi
      .list({ limit: 1000 })
      .then((res) => { setEmployees(res.data); })
      .catch(() => {})
  }, [])

  // Auto-fetch MY EmployeeShift when startDate changes per item
  useEffect(() => {
    const isShiftType = ([
      APPLICATION_TYPES.SHIFT_SWAP.LABEL,
      APPLICATION_TYPES.OVERTIME.LABEL,
      APPLICATION_TYPES.LATE_EARLY.LABEL,
    ] as string[]).includes(type)
    if (!isShiftType) return

    items.forEach((item, idx) => {
      if (!item.startDate) {
        setItems((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], _myEmployeeShift: null, employeeShiftId: "" }
          return next
        })
        return
      }

      schedulesApi
        .getMyShift(item.startDate)
        .then((shift) => {
          setItems((prev) => {
            const next = [...prev]
            next[idx] = {
              ...next[idx],
              _myEmployeeShift: shift,
              employeeShiftId: shift?.id ?? "",
            }
            return next
          })
        })
        .catch(() => {
          setItems((prev) => {
            const next = [...prev]
            next[idx] = { ...next[idx], _myEmployeeShift: null, employeeShiftId: "" }
            return next
          })
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.startDate).join(","), type])

  // Auto-fetch PARTNER EmployeeShift for shift_swap items
  useEffect(() => {
    if (type !== APPLICATION_TYPES.SHIFT_SWAP.LABEL) return

    items.forEach((item, idx) => {
      if (!item.swapWithEmployeeId || !item.swapWithDate) {
        setItems((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], _partnerEmployeeShift: null, swapWithShiftId: "" }
          return next
        })
        return
      }

      schedulesApi
        .getEmployeeShiftByDate(item.swapWithEmployeeId, item.swapWithDate)
        .then((shift) => {
          setItems((prev) => {
            const next = [...prev]
            next[idx] = {
              ...next[idx],
              _partnerEmployeeShift: shift,
              swapWithShiftId: shift?.id ?? "",
            }
            return next
          })
        })
        .catch(() => {
          setItems((prev) => {
            const next = [...prev]
            next[idx] = { ...next[idx], _partnerEmployeeShift: null, swapWithShiftId: "" }
            return next
          })
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => `${i.swapWithEmployeeId}|${i.swapWithDate}`).join(","), type])

  // ─── Item mutation helpers ───────────────────────────────────

  /** Update a single field in a specific item */
  const setItemField = useCallback(
    <K extends keyof ApplicationFormItemState>(idx: number, key: K, value: ApplicationFormItemState[K]) => {
      setItems((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], [key]: value }
        return next
      })
    },
    [],
  )

  /** Add a new empty form item below existing ones */
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()])
  }, [])

  /** Remove an item by index (minimum 1 item remains) */
  const removeItem = useCallback((idx: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  // ─── Legacy single-form compatibility (first item) ───────────

  /** @deprecated — use items[0] and setItemField(0, ...) directly */
  const form = items[0]

  /** @deprecated — sets field on first item only */
  const set = <K extends keyof ApplicationFormItemState>(k: K, v: ApplicationFormItemState[K]) => {
    setItemField(0, k, v)
  }

  const myEmployeeShift = items[0]._myEmployeeShift
  const partnerEmployeeShift = items[0]._partnerEmployeeShift

  // ─── Build detail payload per item ──────────────────────────

  const buildDetail = (item: ApplicationFormItemState): Record<string, unknown> => {
    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        return {
          leaveType: item.leaveType,
          regimeType: item.leaveRegimeType,
        }

      case APPLICATION_TYPES.OVERTIME.LABEL:
        return { employeeShiftId: item.employeeShiftId.trim() }

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        return {
          employeeShiftId: item.employeeShiftId.trim(),
          durationMinutes: item.durationMinutes,
          isLate: item.isLate,
        }

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL: {
        const detail: Record<string, unknown> = { employeeShiftId: item.employeeShiftId.trim() }
        if (item.swapWithEmployeeId.trim()) detail.swapWithEmployeeId = item.swapWithEmployeeId.trim()
        if (item.swapWithShiftId.trim()) detail.swapWithShiftId = item.swapWithShiftId.trim()
        return detail
      }

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        return item.location.trim() ? { location: item.location.trim() } : {}

      default:
        return {}
    }
  }

  // ─── Submit ─────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (items.some((item) => !item.startDate)) {
      toast.error("Vui lòng nhập ngày bắt đầu cho tất cả các đơn")
      return
    }

    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]

    const hasPastDate = items.some((item) => {
      if (item.startDate < todayStr) return true
      if (item.endDate && item.endDate < todayStr) return true
      if (type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && item.swapWithDate && item.swapWithDate < todayStr) return true
      return false
    })

    if (hasPastDate) {
      toast.error("Không thể tạo đơn cho các ngày trong quá khứ")
      return
    }

    setIsSubmitting(true)
    try {
      if (items.length === 1) {
        // Single item — use existing single application API (backward compat)
        const item = items[0]
        const success = await submitApplication({
          type,
          startDate: item.startDate,
          endDate: item.endDate || item.startDate,
          reason: item.reason || undefined,
          note: item.note || undefined,
          assignedToId: assignedToId && assignedToId !== "none" ? assignedToId : undefined,
          detail: buildDetail(item),
        })
        if (success) navigate(-1)
      } else {
        // Multiple items — use batch API
        const batchItems = items.map((item) => ({
          startDate: item.startDate,
          endDate: item.endDate || item.startDate,
          reason: item.reason || undefined,
          note: item.note || undefined,
          detail: buildDetail(item),
        }))

        await applicationBatchApi.submit({
          type,
          assignedToId: assignedToId && assignedToId !== "none" ? assignedToId : undefined,
          items: batchItems,
        })
        toast.success("Đã gửi đơn thành công")
        navigate(-1)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error.response?.data?.error?.message || "Lỗi khi gửi đơn")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    // Multi-item API
    items,
    addItem,
    removeItem,
    setItemField,
    assignedToId,
    setAssignedToId,
    // Legacy single-form API
    form,
    set,
    myEmployeeShift,
    partnerEmployeeShift,
    // Shared
    approvers,
    employees,
    isSubmitting: isSubmitting || isSingleSubmitting,
    handleSubmit,
  }
}
