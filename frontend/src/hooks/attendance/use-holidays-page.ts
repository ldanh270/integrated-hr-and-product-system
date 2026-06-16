import { holidaysApi } from "@/lib/api/attendance.api"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"

import { type FormEvent, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const DEFAULT_HOLIDAY_FORM: IHolidayPayload = {
  name: "",
  date: "",
  type: "national",
}

export function toHolidayDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10)
}

export function useHolidaysPage(year: number) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<IHoliday | null>(null)
  const [deletingHoliday, setDeletingHoliday] = useState<IHoliday | null>(null)
  const [form, setForm] = useState<IHolidayPayload>(DEFAULT_HOLIDAY_FORM)
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
    setForm(DEFAULT_HOLIDAY_FORM)
    setIsDialogOpen(true)
  }

  const openEditDialog = (holiday: IHoliday) => {
    setEditingHoliday(holiday)
    setForm({
      name: holiday.name,
      date: toHolidayDateInputValue(holiday.date),
      type: holiday.type,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingHoliday(null)
    setForm(DEFAULT_HOLIDAY_FORM)
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

  return {
    holidays,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingHoliday,
    deletingHoliday,
    setDeletingHoliday,
    form,
    setForm,
    isSaving,
    deleteMutation,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
  }
}
