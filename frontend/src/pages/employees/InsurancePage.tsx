import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { formatCurrency } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"
import { Plus, Search, ShieldCheck, Users } from "lucide-react"

export default function InsurancePage() {
  const { data: paginatedData, isLoading } = useEmployees({ limit: 100 })
  const employees = paginatedData?.data || []
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmployees = employees.filter((e: Employee) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      e.fullName.toLowerCase().includes(term) ||
      e.username.toLowerCase().includes(term) ||
      (e.nationalId && e.nationalId.includes(term))
    )
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Bảo hiểm Xã hội & Y tế
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý mã số bảo hiểm, tỷ lệ đóng BHXH, BHYT, BHTN của nhân sự
          </p>
        </div>
        <Button className="rounded-full gap-2 shadow-sm">
          <Plus size={16} /> Khai báo bảo hiểm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-xl p-5 bg-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Tổng tham gia BHXH
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{employees?.length || 0}</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 bg-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Bảo hiểm Y tế (BHYT)
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{employees?.length || 0}</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 bg-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Bảo hiểm Thất nghiệp
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{employees?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-border rounded-xl p-4 bg-card">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên nhân sự, CMND/CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="rounded-full w-48">
              <SelectValue placeholder="Tất cả diện bảo hiểm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả diện bảo hiểm</SelectItem>
              <SelectItem value="full">BHXH + BHYT + BHTN</SelectItem>
              <SelectItem value="voluntary">Tự nguyện</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Insurance Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            Đang tải dữ liệu bảo hiểm nhân sự...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Không tìm thấy danh sách nhân sự tham gia bảo hiểm</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Mã NV</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Họ và tên</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Số sổ BHXH</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Mã BHYT</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium text-right">Lương đóng BH</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp: Employee) => (
                <TableRow key={emp.id}>
                  <TableCell className="px-4 py-3 font-mono font-medium text-xs">
                    {emp.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium">{emp.fullName}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {emp.nationalId ? `79${emp.nationalId.slice(0, 8)}` : "Chưa đăng ký"}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {emp.nationalId ? `DN4${emp.nationalId.slice(0, 10)}` : "Chưa đăng ký"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium">
                    {formatCurrency(5000000)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                      Đang đóng BHXH
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
