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
import type { IHoliday } from "@/types/attendance.types"

interface HolidayDeleteDialogProps {
  holiday: IHoliday | null
  isPending: boolean
  onClose: () => void
  onConfirm: (holidayId: string) => void
}

export function HolidayDeleteDialog({
  holiday,
  isPending,
  onClose,
  onConfirm,
}: HolidayDeleteDialogProps) {
  return (
    <AlertDialog
      open={Boolean(holiday)}
      onOpenChange={() => {
        onClose()
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
            disabled={isPending}
            onClick={() => {
              if (!holiday) return

              onConfirm(holiday.id)
            }}
          >
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
