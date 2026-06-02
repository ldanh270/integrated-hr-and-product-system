import { useAuthStore } from "@/store/auth-store"

import { useState } from "react"

export interface ShiftInfo {
  checkInTime: string
  checkOutTime: string
  hoursWorked: string
  totalHours: string
  progressPercentage: number
  status: string
}

export function useDashboard() {
  const user = useAuthStore((state) => state.user)
  const [todayFormatted] = useState(() => {
    const today = new Date()
    const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    const dayName = dayNames[today.getDay()]
    const dd = String(today.getDate()).padStart(2, "0")
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const yyyy = today.getFullYear()
    return `${dayName}, ${dd}/${mm}/${yyyy}`
  })

  // In a real application, this would fetch from an API or use store values.
  const [shiftInfo] = useState<ShiftInfo>({
    checkInTime: "08:33",
    checkOutTime: "12:07",
    hoursWorked: "02:34",
    totalHours: "08:00",
    progressPercentage: 32, // 2h34m / 8h
    status: "Đã ra ca",
  })

  return {
    user,
    todayFormatted,
    shiftInfo,
  }
}
