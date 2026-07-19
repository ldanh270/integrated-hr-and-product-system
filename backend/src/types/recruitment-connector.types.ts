import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"

export type ConnectorIntakeRow = ImportRecruitmentIntakeInput["rows"][number] & {
  externalResponseId: string
  responseData: Record<string, string>
}

export interface ConnectorRowError {
  row: number
  email: string
  code: string
  message: string
  sourceRef: string
  responseData: Record<string, string>
}

export interface ConnectorSyncResult {
  rows: ConnectorIntakeRow[]
  errors: ConnectorRowError[]
  totalFetched: number
}

export interface ConnectorImportInput extends Omit<ImportRecruitmentIntakeInput, "rows"> {
  postingId: string
  rows: ConnectorIntakeRow[]
  connectorErrors: ConnectorRowError[]
}
