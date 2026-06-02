import { attendanceApi } from "@/lib/api/attendance.api"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"

import { useEffect, useState } from "react"

import { toast } from "sonner"

export function useVirtualScanner(): {
  user: User | null
  currentTime: Date
  location: { lat: number; lng: number } | null
  locating: boolean
  isProcessing: boolean
  getLocation: () => void
  handleScan: () => Promise<void>
} {
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Get location
  const getLocation = () => {
    setLocating(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocating(false)
        },
        (error) => {
          console.error(error)
          toast.error("Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí.")
          setLocating(false)
        },
      )
    } else {
      toast.error("Trình duyệt của bạn không hỗ trợ Geolocation.")
      setLocating(false)
    }
  }

  const handleScan = async () => {
    if (!location) {
      toast.error("Vui lòng cho phép lấy vị trí trước khi chấm công.")
      return getLocation()
    }

    setIsProcessing(true)
    try {
      await attendanceApi.scan({ location })
      toast.success("Chấm công thành công!")
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Lỗi khi chấm công")
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    getLocation,
    handleScan,
  }
}
