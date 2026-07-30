export const CONTRACT_TYPES = ["trial", "definite", "indefinite", "service"] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  trial: "Thử việc",
  definite: "Có thời hạn",
  indefinite: "Không thời hạn",
  service: "Hợp đồng dịch vụ",
}

export const CONTRACT_STATUS = {
  DRAFT: "draft",
  PENDING_SIGNATURE: "pending_signature",
  ACTIVE: "active",
  EXPIRED: "expired",
  TERMINATED: "terminated",
  RENEWED: "renewed",
} as const
export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS]

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Bản nháp",
  pending_signature: "Chờ ký",
  active: "Đang hiệu lực",
  expired: "Hết hạn",
  terminated: "Đã chấm dứt",
  renewed: "Đã gia hạn",
}

export const CONTRACT_STATUS_COLORS: Record<
  ContractStatus,
  "default" | "secondary" | "outline" | "destructive" | "success"
> = {
  draft: "secondary",
  pending_signature: "default",
  active: "success",
  expired: "destructive",
  terminated: "destructive",
  renewed: "outline",
}

export const CONTRACT_QUERY_KEYS = {
  LIST: ["contracts"] as const,
  DETAIL: ["contract-detail"] as const,
  EXPIRING: ["contracts-expiring"] as const,
  EMPLOYEE: (id: string) => ["employee-contracts", id] as const,
} as const
