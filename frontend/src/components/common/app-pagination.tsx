import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AppPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  onItemsPerPageChange?: (limit: number) => void
  pageSizeOptions?: number[]
}

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50],
}: AppPaginationProps) {
  if (totalPages <= 1 && !totalItems) return null

  // Xây dựng mảng hiển thị số trang
  // Logic đơn giản: Hiển thị tối đa 5 trang xung quanh trang hiện tại
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    // Luôn có trang 1
    pages.push(1)

    if (currentPage > 3) {
      pages.push("ellipsis")
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis")
    }

    // Luôn có trang cuối
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const startItemIndex = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItemIndex = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-muted/10 text-sm">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-muted-foreground">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                onItemsPerPageChange(Number(val))
              }}
            >
              <SelectTrigger className="w-17.5 h-8 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {totalItems !== undefined && (
          <div className="text-center sm:text-left">
            Đang xem {totalItems === 0 ? 0 : startItemIndex} - {endItemIndex} trong số{" "}
            <span className="font-medium text-foreground">{totalItems}</span> bản ghi
          </div>
        )}
      </div>

      <div className={totalPages <= 1 ? "hidden sm:block opacity-0 pointer-events-none" : ""}>
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) onPageChange(currentPage - 1)
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                title="Trang trước"
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(page as number)
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) onPageChange(currentPage + 1)
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                title="Trang tiếp theo"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
