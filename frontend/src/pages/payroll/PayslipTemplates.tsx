import { useState } from "react"
import { Search, MoreHorizontal, Plus } from "lucide-react"

import { CreatePayslipTemplateForm } from "@/components/payroll/CreatePayslipTemplateForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePayslipTemplates } from "@/hooks/payroll/use-payslip-templates"

export default function PayslipTemplates() {
  const [view, setView] = useState<"list" | "create">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const { data: templates, isLoading } = usePayslipTemplates()

  if (view === "create") {
    return <CreatePayslipTemplateForm onSuccess={() => setView("list")} onCancel={() => setView("list")} />
  }

  // Simple client-side filtering for demonstration
  const filteredTemplates = templates?.filter((template) => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#FBFBFA]">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[#EAEAEA]">
        <h1 className="text-xl font-semibold tracking-tight text-[#111111]">
          Mẫu bảng lương
        </h1>
        <Button 
          className="rounded-full bg-[#111111] text-white hover:bg-[#333333] shadow-none"
          onClick={() => setView("create")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới mẫu bảng lương
        </Button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-none">
          <div className="p-6 border-b border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm mã mẫu, tên mẫu"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full border-[#EAEAEA] shadow-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="rounded-full hover:bg-[#F7F6F3]"
                onClick={() => setSearchTerm("")}
              >
                Thiết lập lại
              </Button>
              <Button 
                variant="default" 
                className="rounded-full bg-[#111111] text-white hover:bg-[#333333] shadow-none"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#FBFBFA]">
                <TableRow className="border-b border-[#EAEAEA] hover:bg-transparent">
                  <TableHead className="w-12 text-center font-semibold text-[#111111]">#</TableHead>
                  <TableHead className="font-semibold text-[#111111]">Tên bảng lương mẫu</TableHead>
                  <TableHead className="font-semibold text-[#111111]">Ngày tạo</TableHead>
                  <TableHead className="font-semibold text-[#111111]">Người tạo</TableHead>
                  <TableHead className="font-semibold text-[#111111]">Mô tả</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground border-dashed">
                      Không tìm thấy mẫu bảng lương nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template, index) => (
                    <TableRow key={template.id} className="border-b border-[#EAEAEA] hover:bg-[#F7F6F3] transition-colors">
                      <TableCell className="text-center text-[#111111]">{index + 1}</TableCell>
                      <TableCell className="text-[#111111] font-medium">{template.name}</TableCell>
                      <TableCell className="text-[#787774]">
                        {template.createdAt ? new Date(template.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </TableCell>
                      <TableCell className="text-[#787774]">
                        {/* Mock user for visual matching with mockup */}
                        <div className="flex flex-col">
                          <span>Nguyễn Anh Khoa</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#787774] max-w-[200px] truncate">
                        {template.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#EAEAEA]">
                              <MoreHorizontal className="h-4 w-4 text-[#111111]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-[#EAEAEA] shadow-sm">
                            <DropdownMenuItem className="cursor-pointer">Xem chi tiết</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">Chỉnh sửa</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">Xoá</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Mockup */}
          <div className="p-4 border-t border-[#EAEAEA] flex items-center justify-end gap-4 text-sm text-[#787774] bg-[#FBFBFA]">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <Select defaultValue="50">
                <SelectTrigger className="w-[70px] h-8 rounded-md border-[#EAEAEA] shadow-none bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>
              Hiển thị từ 1 - {filteredTemplates.length} trên tổng {filteredTemplates.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" className="h-8 w-8 rounded-md bg-[#3b82f6] text-white hover:bg-blue-600 shadow-none">
                1
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
