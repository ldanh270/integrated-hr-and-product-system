import { attendanceApi } from "@/lib/api/attendance.api"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"

import { useEffect, useState } from "react"

import { toast } from "sonner"


function persistLocation(location: { lat: number; lng: number }) {
  sessionStorage.setItem(
    SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE,
    JSON.stringify({ ...location, timestamp: Date.now() })
  )
}

function readCachedLocation(): { lat: number; lng: number } | null {
  const cached = sessionStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
  if (!cached) return null

  try {
    const parsed = JSON.parse(cached)
    // Check if cache is older than 30 minutes
    if (Date.now() - (parsed.timestamp || 0) > 30 * 60 * 1000) {
      sessionStorage.removeItem(SYSTEM_CONFIG.STORAGE_KEYS.LOCATION_CACHE)
      return null
    }
    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}


function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: { message?: string } } } }
  return err.response?.data?.error?.message ?? fallback
}

export function useVirtualScanner(): {
  user: User | null
  currentTime: Date
  location: { lat: number; lng: number } | null
  locating: boolean
  isProcessing: boolean
  handleScan: () => Promise<void>
} {
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cached = readCachedLocation()
    if (cached) setLocation(cached)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        persistLocation(coords)
        setLocating(false)
      },
      (err) => {
        console.warn("GPS mount error:", err.message)
        if (err.code === 1) {
          toast.warning("Vui lòng cho phép truy cập vị trí để chấm công")
        }
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const handleScan = async () => {
    let finalLocation = location

    if (!finalLocation) {
      if (!navigator.geolocation) {
        toast.error("Trình duyệt không hỗ trợ GPS")
        return
      }

      setIsProcessing(true)
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        finalLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(finalLocation)
        persistLocation(finalLocation)
      } catch {
        toast.error("Không lấy được vị trí GPS. Vui lòng thử lại.")
        setIsProcessing(false)
        return
      }
    } else {
      setLocation(finalLocation)
    }

    setIsProcessing(true)

    try {
      await attendanceApi.scan({ location: finalLocation })
      toast.success("Chấm công thành công!")
    } catch (error) {
      console.error("Scan error:", error)
      toast.error(getApiErrorMessage(error, "Lỗi khi chấm công"))
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
    handleScan,
  }
}
