import { PageCard, PageHeader } from "@/components/common"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HOLIDAY_TYPES, type IHolidayType } from "@/config/entities/attendance.config"
import { ROLE } from "@/config/entities/employee.config"
import { holidaysApi } from "@/lib/api/attendance.api"
import { formatDate } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"

import { type FormEvent, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

function getHolidayTypeLabel(type: IHolidayType) {
  switch (type) {
    case "national":
      return "Ngày lễ quốc gia"
    case "company":
      return "Ngày nghỉ công ty"
    default:
      return "Ngày nghỉ"
  }
}

const DEFAULT_FORM: IHolidayPayload = {
  name: "",
  date: "",
  type: "national",
}

function toDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10)
}

export default function Holidays() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === ROLE.ADMIN || user?.role === ROLE.HR_MANAGER
  const [year, setYear] = useState(new Date().getFullYear())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<IHoliday | null>(null)
  const [deletingHoliday, setDeletingHoliday] = useState<IHoliday | null>(null)
  const [form, setForm] = useState<IHolidayPayload>(DEFAULT_FORM)
  const queryClient = useQueryClient()
  const holidaysQueryKey = ["holidays", year]
  const { data: holidays, isLoading } = useQuery({
    queryKey: holidaysQueryKey,
    queryFn: () => holidaysApi.getAll({ year }),
  })

  const invalidateHolidays = () => {
    void queryClient.invalidateQueries({ queryKey: ["holidays"] })
  }

  const createMutation = useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: () => {
      toast.success("Đã thêm ngày lễ")
      invalidateHolidays()
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IHolidayPayload }) =>
      holidaysApi.update(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật ngày lễ")
      invalidateHolidays()
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: holidaysApi.delete,
    onSuccess: () => {
      toast.success("Đã xóa ngày lễ")
      invalidateHolidays()
      setDeletingHoliday(null)
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = () => {
    setEditingHoliday(null)
    setForm(DEFAULT_FORM)
    setIsDialogOpen(true)
  }

  const openEditDialog = (holiday: IHoliday) => {
    setEditingHoliday(holiday)
    setForm({
      name: holiday.name,
      date: toDateInputValue(holiday.date),
      type: holiday.type,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingHoliday(null)
    setForm(DEFAULT_FORM)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.date) {
      toast.error("Vui lòng nhập đủ tên và ngày lễ")
      return
    }

    if (editingHoliday) {
      updateMutation.mutate({ id: editingHoliday.id, data: form })
      return
    }

    createMutation.mutate(form)
  }

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Ngày lễ"
        description="Quản lý ngày nghỉ lễ áp dụng cho lịch làm việc nhân viên."
      />

      <PageCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Năm {year}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button size="sm" className="h-8 px-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Thêm ngày lễ
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setYear((currentYear) => currentYear - 1)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setYear((currentYear) => currentYear + 1)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : holidays?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{holiday.name}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {formatDate(holiday.date)}
                    </p>
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Sửa ngày lễ"
                        onClick={() => {
                          openEditDialog(holiday)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        aria-label="Xóa ngày lễ"
                        onClick={() => {
                          setDeletingHoliday(holiday)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  {getHolidayTypeLabel(holiday.type)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Chưa có ngày lễ nào trong năm {year}.
          </div>
        )}
      </PageCard>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(isOpen) => {
          if (isOpen) {
            setIsDialogOpen(true)
            return
          }

          closeDialog()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? "Sửa ngày lễ" : "Thêm ngày lễ"}</DialogTitle>
            <DialogDescription>Ngày được chọn sẽ hiển thị trong lịch làm việc của nhân viên.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="holiday-name">Tên ngày lễ</Label>
              <Input
                id="holiday-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }))
                }}
                placeholder="Ví dụ: Giải phóng miền Nam"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday-date">Ngày nghỉ</Label>
              <Input
                id="holiday-date"
                type="date"
                value={form.date}
                onChange={(event) => {
                  setForm((current) => ({ ...current, date: event.target.value }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại ngày nghỉ</Label>
              <Select
                value={form.type}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, type: value as IHolidayType }))
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-full bg-transparent px-6">
                  <SelectValue placeholder="Chọn loại ngày nghỉ" />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getHolidayTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingHoliday)}
        onOpenChange={() => {
          setDeletingHoliday(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ngày lễ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ngày lễ này sẽ không còn hiển thị trong lịch làm việc của nhân viên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deletingHoliday) return

                deleteMutation.mutate(deletingHoliday.id)
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
