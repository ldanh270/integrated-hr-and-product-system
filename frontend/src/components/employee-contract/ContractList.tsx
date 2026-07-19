import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from "@/config/entities/employee-contract.config"
import { useEmployeeContracts } from "@/hooks/employee-contract/use-contracts"
import type { IContract } from "@/types/employee-contract.types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

import { FileText, Pencil, RefreshCw, Trash2 } from "lucide-react"

interface ContractListProps {
  employeeId: string
  onEdit?: (contract: IContract) => void
  onTerminate?: (contract: IContract) => void
  onRenew?: (contract: IContract) => void
}

export function ContractList({
  employeeId,
  onEdit,
  onTerminate,
  onRenew,
}: ContractListProps) {
  const { data: contracts, isLoading } = useEmployeeContracts(employeeId)

  const getStatusBadge = (status: IContract["status"]) => {
    const variant =
      status === "active"
        ? "default"
        : status === "draft" || status === "pending_signature"
          ? "secondary"
          : status === "expired" || status === "terminated"
            ? "destructive"
            : "outline"

    return (
      <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>
        {CONTRACT_STATUS_LABELS[status]}
      </Badge>
    )
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("vi-VN")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <FileText className="w-8 h-8 text-muted-foreground" />
        <p className="text-muted-foreground">Chưa có hợp đồng nào</p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Số HĐ
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Loại
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Ngày bắt đầu
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Ngày kết thúc
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">
              Lương
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase w-12">
              {/* Actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="px-4 py-3 font-medium">
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
              <TableCell className="px-4 py-3">{getStatusBadge(contract.status)}</TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {onEdit && contract.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(contract)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onTerminate && contract.status === "active" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onTerminate(contract)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onRenew &&
                    (contract.status === "active" || contract.status === "expired") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRenew(contract)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
