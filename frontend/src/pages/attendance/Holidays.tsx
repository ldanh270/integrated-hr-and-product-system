import { PageCard, PageHeader } from "@/components/common"
import { HolidayDeleteDialog } from "@/components/features/attendance/holidays/holiday-delete-dialog"
import { HolidayFormDialog } from "@/components/features/attendance/holidays/holiday-form-dialog"
import { HolidaysGrid } from "@/components/features/attendance/holidays/holidays-grid"
import { HolidaysYearToolbar } from "@/components/features/attendance/holidays/holidays-year-toolbar"
import { ROLE } from "@/config/entities/employee.config"
import { useHolidaysPage } from "@/hooks/attendance/use-holidays-page"
import { useAuthStore } from "@/store/auth-store"

import { useState } from "react"

export default function Holidays() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === ROLE.ADMIN || user?.role === ROLE.HR_MANAGER
  const [year, setYear] = useState(new Date().getFullYear())
  const holidaysPage = useHolidaysPage(year)

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Ngày lễ"
        description="Quản lý ngày nghỉ lễ áp dụng cho lịch làm việc nhân viên."
      />

      <PageCard className="space-y-4">
        <HolidaysYearToolbar
          year={year}
          isAdmin={Boolean(isAdmin)}
          onPreviousYear={() => setYear((currentYear) => currentYear - 1)}
          onNextYear={() => setYear((currentYear) => currentYear + 1)}
          onCreate={holidaysPage.openCreateDialog}
        />

        <HolidaysGrid
          year={year}
          holidays={holidaysPage.holidays}
          isLoading={holidaysPage.isLoading}
          isAdmin={Boolean(isAdmin)}
          onEdit={holidaysPage.openEditDialog}
          onDelete={holidaysPage.setDeletingHoliday}
        />
      </PageCard>

      <HolidayFormDialog
        open={holidaysPage.isDialogOpen}
        editingHoliday={holidaysPage.editingHoliday}
        form={holidaysPage.form}
        isSaving={holidaysPage.isSaving}
        onOpenChange={holidaysPage.setIsDialogOpen}
        onClose={holidaysPage.closeDialog}
        onSubmit={holidaysPage.handleSubmit}
        onFormChange={holidaysPage.setForm}
      />

      <HolidayDeleteDialog
        holiday={holidaysPage.deletingHoliday}
        isPending={holidaysPage.deleteMutation.isPending}
        onClose={() => holidaysPage.setDeletingHoliday(null)}
        onConfirm={(holidayId) => holidaysPage.deleteMutation.mutate(holidayId)}
      />
    </div>
  )
}
