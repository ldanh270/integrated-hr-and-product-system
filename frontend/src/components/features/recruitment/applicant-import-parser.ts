import type { ApplicantImportRow } from "@/types/recruitment.types"

const COLUMN_ALIASES: Record<string, keyof ApplicantImportRow> = {
  fullname: "fullName", "họ tên": "fullName", "ho ten": "fullName", name: "fullName",
  email: "email", phone: "phone", "số điện thoại": "phone", "so dien thoai": "phone",
  cvurl: "cvUrl", cv: "cvUrl", notes: "notes", "ghi chú": "notes", "ghi chu": "notes",
}

function splitCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === "," && !quoted) { values.push(current.trim()); current = "" }
    else current += char
  }
  values.push(current.trim())
  return values
}

export function parseApplicantCsv(value: string): ApplicantImportRow[] {
  const lines = value.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((header) => COLUMN_ALIASES[header.trim().toLowerCase()])
  return lines.slice(1).map((line) => {
    const row: Partial<ApplicantImportRow> = {}
    splitCsvLine(line).forEach((cell, index) => { const key = headers[index]; if (key) row[key] = cell })
    return row
  }) as ApplicantImportRow[]
}

export function validateApplicantRows(rows: ApplicantImportRow[]): Array<{ row: number; message: string }> {
  const errors: Array<{ row: number; message: string }> = []
  rows.forEach((row, index) => {
    if (!row.fullName?.trim()) errors.push({ row: index + 2, message: "Thiếu họ tên" })
    if (!row.email?.trim()) errors.push({ row: index + 2, message: "Thiếu email" })
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push({ row: index + 2, message: "Email không hợp lệ" })
  })
  return errors
}
