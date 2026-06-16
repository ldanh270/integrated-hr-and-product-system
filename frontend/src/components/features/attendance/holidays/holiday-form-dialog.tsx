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
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { type FormEvent } from "react"

import { Loader2 } from "lucide-react"

interface HolidayFormDialogProps {
  open: boolean
  editingHoliday: IHoliday | null
  form: IHolidayPayload
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFormChange: (updater: (current: IHolidayPayload) => IHolidayPayload) => void
}

export function HolidayFormDialog({
  open,
  editingHoliday,
  form,
  isSaving,
  onOpenChange,
  onClose,
  onSubmit,
  onFormChange,
}: HolidayFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          onOpenChange(true)
          return
        }

        onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingHoliday ? "Sửa ngày lễ" : "Thêm ngày lễ"}</DialogTitle>
          <DialogDescription>
            Ngày được chọn sẽ hiển thị trong lịch làm việc của nhân viên.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="holiday-name">Tên ngày lễ</Label>
            <Input
              id="holiday-name"
              value={form.name}
              onChange={(event) => {
                onFormChange((current) => ({ ...current, name: event.target.value }))
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
                onFormChange((current) => ({ ...current, date: event.target.value }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Loại ngày nghỉ</Label>
            <Select
              value={form.type}
              onValueChange={(value) => {
                onFormChange((current) => ({ ...current, type: value as IHolidayType }))
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
            <Button type="button" variant="outline" onClick={onClose}>
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
  )
}
