import { Button } from "@/components/ui/button"

import { ArrowLeft, ArrowRight } from "lucide-react"

interface ApplicationsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ApplicationsPagination({ page, totalPages, onPageChange }: ApplicationsPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-full gap-2"
      >
        <ArrowLeft size={14} /> Trước
      </Button>
      <span className="text-sm font-medium text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full gap-2"
      >
        Sau <ArrowRight size={14} />
      </Button>
    </div>
  )
}
