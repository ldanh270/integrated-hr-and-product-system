import { useMemo, useRef, useState } from "react"
import { FileSpreadsheet, Upload } from "lucide-react"
import { PageCard, PageHeader } from "@/components/common"
import { parseApplicantCsv, validateApplicantRows } from "@/components/features/recruitment/applicant-import-parser"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { useImportApplicants, useJobDescriptions, useJobPostings } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { ApplicantImportResult } from "@/types/recruitment.types"

const SOURCE_OPTIONS = [
  ["website", "Website"], ["linkedin", "LinkedIn"], ["facebook", "Facebook"],
  ["google_form", "Google Form"], ["company_website", "Website công ty"], ["agency", "Headhunter / Agency"],
  ["referral", "Referral nội bộ"], ["other", "Khác"],
] as const

export default function ApplicantIntakePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [jobDescriptionId, setJobDescriptionId] = useState("")
  const [postingId, setPostingId] = useState("")
  const [source, setSource] = useState("")
  const [rawCsv, setRawCsv] = useState("fullName,email,phone,cvUrl,notes\n")
  const [result, setResult] = useState<ApplicantImportResult>()
  const { data: descriptions = [] } = useJobDescriptions()
  const { data: postings = [] } = useJobPostings(jobDescriptionId || undefined)
  const importApplicants = useImportApplicants()
  const { hasPermission } = usePermission()
  const rows = useMemo(() => parseApplicantCsv(rawCsv), [rawCsv])
  const validationErrors = useMemo(() => validateApplicantRows(rows), [rows])

  const choosePosting = (value: string) => {
    setPostingId(value)
    const posting = postings.find((item) => item.id === value)
    if (posting) setSource(posting.source)
  }
  const readFile = async (file?: File) => {
    if (!file) return
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      setRawCsv(XLSX.utils.sheet_to_csv(firstSheet))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setRawCsv(String(reader.result ?? ""))
    reader.readAsText(file, "UTF-8")
  }
  const submit = () => importApplicants.mutate(
    { jobDescriptionId, postingId: postingId || undefined, source, rows },
    { onSuccess: setResult },
  )

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader title="Tiếp nhận ứng viên" description="Import hồ sơ vào đúng JD và khóa nguồn tuyển ngay khi tạo Application." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PageCard className="min-w-0">
          <CardHeading title="Nguồn hồ sơ" description="Chọn JD trước, sau đó chọn bài đăng để tự nhận diện nguồn." />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2"><Label>JD ứng tuyển</Label><Select value={jobDescriptionId} onValueChange={(value) => { setJobDescriptionId(value); setPostingId(""); setSource("") }}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn JD" /></SelectTrigger><SelectContent>{descriptions.map((jd) => <SelectItem key={jd.id} value={jd.id}>{jd.title} · {jd.requisition?.code}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Điểm đăng tuyển</Label><Select value={postingId} onValueChange={choosePosting}><SelectTrigger className="w-full"><SelectValue placeholder="Không có / nhập thủ công" /></SelectTrigger><SelectContent>{postings.map((posting) => <SelectItem key={posting.id} value={posting.id}>{POSTING_CHANNELS.find((item) => item.value === posting.channel)?.label} · {posting.sourceCode}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2 md:col-span-2"><Label>Nguồn Application</Label><Select value={source} onValueChange={setSource} disabled={Boolean(postingId)}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn nguồn" /></SelectTrigger><SelectContent>{SOURCE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Khi chọn điểm đăng, nguồn được lấy từ kênh và không thể đổi thủ công.</p></div>
          </div>
        </PageCard>
        <PageCard>
          <CardHeading title="Import Excel / CSV" description="Đọc sheet đầu tiên, dòng đầu là tiêu đề cột." />
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(event) => void readFile(event.target.files?.[0])} />
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}><FileSpreadsheet className="mr-2 h-4 w-4" />Chọn file Excel / CSV</Button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Hỗ trợ CSV, XLSX, XLS. Cột bắt buộc: <span className="font-mono">fullName, email</span>. Tùy chọn: <span className="font-mono">phone, cvUrl, notes</span>.</p>
        </PageCard>
      </div>
      <PageCard padding="sm" className="overflow-hidden">
        <div className="p-4"><CardHeading title={`Dữ liệu xem trước (${rows.length} hồ sơ)`} description="Có thể dán trực tiếp dữ liệu CSV vào ô bên dưới." /></div>
        <div className="p-4"><Textarea value={rawCsv} onChange={(event) => setRawCsv(event.target.value)} className="min-h-32 font-mono text-xs" /></div>
        <div className="max-h-80 overflow-auto rounded-lg border border-border"><Table><TableHeader className="sticky top-0 bg-muted"><TableRow><TableHead>Họ tên</TableHead><TableHead>Email</TableHead><TableHead>Điện thoại</TableHead><TableHead>CV</TableHead></TableRow></TableHeader><TableBody>{rows.slice(0, 50).map((row, index) => <TableRow key={`${row.email}-${index}`} className="h-16"><TableCell className="font-medium">{row.fullName}</TableCell><TableCell>{row.email}</TableCell><TableCell>{row.phone || "—"}</TableCell><TableCell className="max-w-52 truncate text-muted-foreground">{row.cvUrl || "—"}</TableCell></TableRow>)}</TableBody></Table></div>
        {validationErrors.length > 0 && <div className="border-t border-border bg-destructive/5 p-4"><p className="text-sm font-medium text-destructive">Cần sửa {validationErrors.length} lỗi trước khi import</p><ul className="mt-2 max-h-28 overflow-auto text-xs text-destructive">{validationErrors.map((error) => <li key={`${error.row}-${error.message}`}>Dòng {error.row}: {error.message}</li>)}</ul></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-muted-foreground">Import sẽ match Candidate theo email, sau đó tạo Application mới gắn đúng JD/Requisition.</p>{hasPermission("recruitment.intake.manage") && <Button onClick={submit} disabled={!jobDescriptionId || !source || rows.length === 0 || validationErrors.length > 0 || importApplicants.isPending}><Upload className="mr-2 h-4 w-4" />{importApplicants.isPending ? "Đang tiếp nhận..." : `Tiếp nhận ${rows.length} hồ sơ`}</Button>}</div>
      </PageCard>
      {result && <PageCard><CardHeading title="Kết quả import" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-5"><Result label="Tổng" value={result.total} /><Result label="Application mới" value={result.applicationsCreated} /><Result label="Candidate mới" value={result.candidatesCreated} /><Result label="Candidate đã match" value={result.candidatesMatched} /><Result label="Lỗi" value={result.failed} /></div>{result.errors.length > 0 && <ul className="mt-4 text-sm text-destructive">{result.errors.map((error) => <li key={`${error.row}-${error.message}`}>Dòng {error.row}: {error.message}</li>)}</ul>}</PageCard>}
    </div>
  )
}

function Result({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div> }

function CardHeading({ title, description }: { title: string; description?: string }) { return <div className="mb-5"><h2 className="text-base font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div> }
