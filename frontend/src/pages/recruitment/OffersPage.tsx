import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useOffers,
  useSendOffer,
} from "@/hooks/recruitment/use-recruitment-queries"
import {
  OFFER_STATUS_LABELS,
  OFFER_RESPONSE_LABELS,
  OFFER_RESPONSE,
  CURRENCY,
} from "@/config/entities/recruitment.config"
import type { RecruitmentOffer } from "@/types/recruitment.types"
import { Plus, Send, Eye, DollarSign } from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  pending_review: "warning",
  sent: "info",
  viewed: "info",
  accepted: "success",
  declined: "danger",
  negotiating: "warning",
  expired: "neutral",
  rescinded: "danger",
  withdrawn: "neutral",
}

const responseVariantMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  [OFFER_RESPONSE.ACCEPT]: "success",
  [OFFER_RESPONSE.DECLINE]: "danger",
  [OFFER_RESPONSE.NEGOTIATE]: "warning",
}

const formatCurrency = (amount: number, currency: string = CURRENCY.VND) => {
  if (currency === CURRENCY.VND) {
    return `${amount.toLocaleString("vi-VN")} VNĐ`
  }
  return `${amount.toLocaleString()} ${currency}`
}

export default function OffersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>("")

  const { data, isLoading } = useOffers({ page, pageSize })
  const sendOffer = useSendOffer()

  const offers = data?.data ?? []
  const meta = data?.meta

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi })
    } catch {
      return dateStr
    }
  }

  // Helper to get candidate info
  const getCandidateName = (offer: RecruitmentOffer) => {
    return offer.candidateName ?? offer.candidate?.fullName ?? "N/A"
  }

  const getCandidateEmail = (offer: RecruitmentOffer) => {
    return offer.candidateEmail ?? offer.candidate?.email ?? ""
  }

  return (
    <div className="container flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Quản lý Offer"
        description="Tạo và quản lý offer cho ứng viên"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo offer mới
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Lọc theo trạng thái..."
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border rounded-md"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ứng viên</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Mức lương</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Phản hồi</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Chưa có offer nào
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer: RecruitmentOffer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getCandidateName(offer).charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{getCandidateName(offer)}</p>
                        <p className="text-xs text-muted-foreground">{getCandidateEmail(offer)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{offer.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{offer.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(offer.offeredSalary, offer.currency)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {offer.startDate ? formatDate(offer.startDate) : "-"}
                  </TableCell>
                  <TableCell>
                    {offer.endDate ? formatDate(offer.endDate) : "-"}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      label={OFFER_STATUS_LABELS[offer.status]}
                      variant={statusVariantMap[offer.status]}
                    />
                  </TableCell>
                  <TableCell>
                    {offer.response ? (
                      <StatusPill
                        label={OFFER_RESPONSE_LABELS[offer.response]}
                        variant={responseVariantMap[offer.response]}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa phản hồi</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {offer.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => sendOffer.mutate(offer.id)}
                          title="Gửi offer"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Xem chi tiết">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.total > pageSize && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {offers.length} / {meta.total} kết quả
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={offers.length < pageSize}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
