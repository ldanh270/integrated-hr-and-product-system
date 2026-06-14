import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useState } from "react"

import { Bell } from "lucide-react"

interface Notification {
  id: string
  title: string
  desc: string
  time: string
  read: boolean
}

// Mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Đơn nghỉ phép được duyệt",
    desc: "Trưởng phòng đã duyệt đơn nghỉ phép của bạn.",
    time: "5 phút trước",
    read: false,
  },
  {
    id: "2",
    title: "Nhắc nhở chấm công",
    desc: "Bạn chưa chấm công vào lúc 08:00 hôm nay.",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: "3",
    title: "Cập nhật chính sách",
    desc: "Công ty vừa cập nhật chính sách phúc lợi mới.",
    time: "Hôm qua",
    read: true,
  },
]

/**
 * NotificationPanel — Displays notification bell with dropdown list.
 */
export default function NotificationPanel() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayCount = unreadCount > 9 ? "9+" : unreadCount

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                    <span className="text-[8px] font-bold text-primary-foreground opacity-0">
                      {displayCount}
                    </span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Thông báo</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent align="end" className="w-80 rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-semibold text-foreground">Thông báo</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="max-h-75 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id)
                  }}
                  className={`flex cursor-pointer flex-col gap-1 border-b border-border/50 px-4 py-3 transition-colors hover:bg-secondary/50 last:border-0 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-medium line-clamp-1 ${!n.read ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{n.desc}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-1">{n.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Không có thông báo nào.
            </div>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
          >
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
