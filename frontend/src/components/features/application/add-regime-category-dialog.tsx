import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRegimeCategories } from "@/hooks/attendance/use-regime-categories"
import type { IRegimeCategory } from "@/lib/api/regime-category.api"

import { useState } from "react"

import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (category: IRegimeCategory) => void
}

/** Displays the form used to create a custom attendance regime category. */
export function AddRegimeCategoryDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("")
  const [maxLateMinutes, setMaxLateMinutes] = useState<string>("")
  const [maxEarlyMinutes, setMaxEarlyMinutes] = useState<string>("")

  const { createCategory, isCreating } = useRegimeCategories()

  /** Validates dialog inputs and persists the new category. */
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chế độ")
      return
    }
    if (!maxLateMinutes) {
      toast.error("Vui lòng nhập thời gian đi muộn tối đa")
      return
    }
    if (!maxEarlyMinutes) {
      toast.error("Vui lòng nhập thời gian về sớm tối đa")
      return
    }

    try {
      const category = await createCategory({
        name: name.trim(),
        maxLateMinutes: Number(maxLateMinutes),
        maxEarlyMinutes: Number(maxEarlyMinutes),
      })
      toast.success("Thêm mới loại chế độ thành công")
      onOpenChange(false)
      setName("")
      setMaxLateMinutes("")
      setMaxEarlyMinutes("")
      onCreated?.(category)
    } catch {
      toast.error("Thêm mới thất bại, vui lòng thử lại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>THÊM MỚI LOẠI CHẾ ĐỘ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tên chế độ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên chế độ"
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Thời gian đi muộn tối đa
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxLateMinutes}
                  onChange={(e) => setMaxLateMinutes(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 pr-10 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">phút</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Thời gian về sớm tối đa
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxEarlyMinutes}
                  onChange={(e) => setMaxEarlyMinutes(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 pr-10 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">phút</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy bỏ
          </Button>
          <Button type="button" onClick={handleSave} disabled={isCreating}>
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
