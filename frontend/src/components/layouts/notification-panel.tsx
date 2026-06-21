import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import apiClient from "@/lib/api-client"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)
dayjs.locale("vi")

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

/**
 * NotificationPanel — Displays notification bell with dropdown list.
 */
export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications")
      return res.data.data || []
    },
    // Refetch when popover opens, or let React Query handle it with default staleTime
    refetchInterval: 60000, // optionally poll every minute
  })

  // Mark one as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previous = queryClient.getQueryData<Notification[]>(["notifications"])
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ["notifications"],
          previous.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
      return { previous }
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all")
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previous = queryClient.getQueryData<Notification[]>(["notifications"])
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ["notifications"],
          previous.map((n) => ({ ...n, isRead: true }))
        )
      }
      return { previous }
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const displayCount = unreadCount > 9 ? "9+" : unreadCount

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
              onClick={() => { markAllAsReadMutation.mutate() }}
              className="text-xs font-medium text-primary hover:underline"
              disabled={markAllAsReadMutation.isPending}
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
                    if (!n.isRead) markAsReadMutation.mutate(n.id)
                  }}
                  className={`flex cursor-pointer flex-col gap-1 border-b border-border/50 px-4 py-3 transition-colors hover:bg-secondary/50 last:border-0 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-medium line-clamp-1 ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-1">
                    {dayjs(n.createdAt).fromNow()}
                  </span>
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
