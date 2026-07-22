import { useState } from "react"
import { ContractModal, type ContractModalMode } from "@/components/employee-contract/ContractModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from "@/config/entities/employee-contract.config"
import { useContracts } from "@/hooks/employee-contract/use-contracts"
import { formatCurrency } from "@/lib/utils"
import type { IContract } from "@/types/employee-contract.types"
import { FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const { data: paginatedData, isLoading } = useContracts({
    status: statusFilter !== "all" ? statusFilter : undefined,
  })
  const contracts = paginatedData?.data || []

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ContractModalMode>("create")
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  const handleCreate = () => {
    setSelectedContract(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEdit = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleRenew = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("renew")
    setIsModalOpen(true)
  }

  const handleTerminate = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("terminate")
    setIsModalOpen(true)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN")
  }

  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      c.contractNumber.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term))
    )
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Hợp đồng Lao động
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả hợp đồng lao động của nhân sự trong doanh nghiệp
          </p>
        </div>
        <Button onClick={handleCreate} className="rounded-full gap-2 shadow-sm">
          <Plus size={16} /> Tạo hợp đồng mới
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-border rounded-xl p-4 bg-card">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo số HĐ, tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Trạng thái:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-full w-44">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="active">Đang hiệu lực</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
              <SelectItem value="terminated">Đã chấm dứt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            Đang tải dữ liệu hợp đồng...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <FileText className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Không tìm thấy hợp đồng lao động nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Số HĐ</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Loại HĐ</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Ngày bắt đầu</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Ngày kết thúc</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium text-right">Mức lương</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium">Trạng thái</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase font-medium w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="px-4 py-3 font-mono font-medium">
                    {contract.contractNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {CONTRACT_TYPE_LABELS[contract.contractType]}
                  </TableCell>
                  <TableCell className="px-4 py-3">{formatDate(contract.startDate)}</TableCell>
                  <TableCell className="px-4 py-3">
                    {contract.endDate ? formatDate(contract.endDate) : "Không thời hạn"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium">
                    {formatCurrency(contract.salary)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {contract.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(contract)}
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      {contract.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleTerminate(contract)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                      {(contract.status === "active" || contract.status === "expired") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRenew(contract)}
                        >
                          <RefreshCw size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Contract Modal */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeId={selectedContract?.employeeId || ""}
        mode={modalMode}
        contract={selectedContract}
      />
    </div>
  )
}
