/**
 * Generates a Word document presenting AI ideas for the Attendance module.
 * Run: bun scripts/generate-attendance-ai-doc.ts
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  LevelFormat,
  ShadingType,
} from "docx"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

const PAGE_WIDTH = 11906
const MARGIN = 720
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const COLORS = {
  primary: "1E3A5F",
  accent: "2563EB",
  muted: "64748B",
  headerBg: "1E3A5F",
  headerText: "FFFFFF",
  altRow: "F1F5F9",
  lightBlue: "EFF6FF",
  border: "CBD5E1",
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [
      new TextRun({ text, bold: true, size: 32, color: COLORS.primary, font: "Calibri" }),
    ],
  })
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({ text, bold: true, size: 26, color: COLORS.accent, font: "Calibri" }),
    ],
  })
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text, bold: true, size: 22, color: COLORS.primary, font: "Calibri" }),
    ],
  })
}

function body(text: string, opts?: { bold?: boolean; italic?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        bold: opts?.bold,
        italics: opts?.italic,
        color: "1E293B",
      }),
    ],
  })
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 20, font: "Calibri", color: "1E293B" })],
  })
}

function numbered(text: string, level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 20, font: "Calibri", color: "1E293B" })],
  })
}

function quote(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 360 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.accent, space: 12 },
    },
    children: [
      new TextRun({ text, size: 20, font: "Calibri", italics: true, color: COLORS.muted }),
    ],
  })
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [] })
}

function cell(
  text: string,
  opts?: { bold?: boolean; header?: boolean; width?: number; fill?: string },
): TableCell {
  const width = opts?.width ?? 2000
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts?.header
      ? { type: ShadingType.CLEAR, fill: COLORS.headerBg }
      : opts?.fill
        ? { type: ShadingType.CLEAR, fill: opts.fill }
        : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
    },
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            size: 18,
            font: "Calibri",
            bold: opts?.bold || opts?.header,
            color: opts?.header ? COLORS.headerText : "1E293B",
          }),
        ],
      }),
    ],
  })
}

function makeTable(headers: string[], rows: string[][], colWidths: number[]): Table {
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      cell(h, { header: true, bold: true, width: colWidths[i] }),
    ),
  })
  const dataRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map((c, i) =>
          cell(c, {
            width: colWidths[i],
            fill: ri % 2 === 1 ? COLORS.altRow : undefined,
          }),
        ),
      }),
  )
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  })
}

function callout(title: string, text: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      shading: { type: ShadingType.CLEAR, fill: COLORS.lightBlue },
      children: [
        new TextRun({ text: `💡 ${title}`, bold: true, size: 20, font: "Calibri", color: COLORS.accent }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      shading: { type: ShadingType.CLEAR, fill: COLORS.lightBlue },
      children: [new TextRun({ text, size: 19, font: "Calibri", color: "1E293B" })],
    }),
  ]
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [{ id: "Normal", run: { font: "Calibri", size: 20 } }],
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 240 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "○",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 240 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      children: [
        // ── COVER ──
        spacer(),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "INTEGRATED HR & PRODUCT SYSTEM",
              size: 22,
              font: "Calibri",
              color: COLORS.muted,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({
              text: "Đề xuất tích hợp AI",
              size: 48,
              font: "Calibri",
              bold: true,
              color: COLORS.primary,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "vào Module Attendance",
              size: 36,
              font: "Calibri",
              bold: true,
              color: COLORS.accent,
            }),
          ],
        }),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: "Tài liệu trình bày ý tưởng · Kiến trúc · Roadmap triển khai",
              size: 20,
              font: "Calibri",
              color: COLORS.muted,
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 40 },
          children: [
            new TextRun({
              text: `Ngày: ${new Date().toLocaleDateString("vi-VN")}`,
              size: 18,
              font: "Calibri",
              color: COLORS.muted,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Đối tượng: Product / Tech Lead / Stakeholder",
              size: 18,
              font: "Calibri",
              color: COLORS.muted,
            }),
          ],
        }),

        // ── MỤC LỤC ──
        heading1("Mục lục"),
        numbered("Bối cảnh & hiện trạng module Attendance"),
        numbered("Tổng quan ý tưởng AI (3 Tier)"),
        numbered("Tier 1 — Ship nhanh, ROI cao"),
        numbered("Tier 2 — Giải quyết pain point lớn (chi tiết)"),
        numbered("Tier 3 — Nâng cao, chiến lược"),
        numbered("Kiến trúc kỹ thuật đề xuất"),
        numbered("Roadmap triển khai"),
        numbered("Khuyến nghị bắt đầu"),

        // ── 1. BỐI CẢNH ──
        heading1("1. Bối cảnh & hiện trạng"),
        heading2("1.1 Module Attendance đã có gì?"),
        body(
          "Module Attendance trong hệ thống đã được xây dựng khá đầy đủ. Dưới đây là các tính năng chính đang hoạt động:",
        ),
        makeTable(
          ["Tính năng", "Trạng thái", "Ghi chú"],
          [
            ["Check-in / Check-out GPS", "Đã có", "Geofence, Virtual Scanner"],
            ["Lịch sử chấm công + CSV export", "Đã có", "Dashboard & Summary"],
            ["Quản lý ca làm việc (WorkingShift)", "Đã có", "CRUD, grace period, GPS radius"],
            ["Lịch nhân viên Full-time", "Đã có", "Template xoay tuần + cron auto-generate"],
            ["Part-time Availability", "Đã có", "NV khai báo rảnh → Admin gán ca thủ công"],
            ["Đơn từ (nghỉ / OT / WFH / đổi ca)", "Đã có", "Approval queue thống nhất"],
            ["Ngày lễ", "Đã có", "National / Company"],
            ["Liên kết Payroll", "Đã có", "Aggregate công thực tế"],
            ["Real Shift (planned vs actual)", "DB có, UI chưa", "Redirect stub"],
            ["AI / ML", "Chưa có", "Không có pipeline AI nào trong app"],
          ],
          [3200, 2200, 5060],
        ),
        spacer(),
        heading2("1.2 Dữ liệu sẵn có để làm AI"),
        body("Hệ thống đã lưu đủ dữ liệu để AI có ý nghĩa — không cần thu thập thêm từ đầu:"),
        bullet("AttendanceRecord — check-in/out, GPS, phút đi muộn / về sớm / OT"),
        bullet("EmployeeShift + Weekly Template — lịch kế hoạch theo ngày"),
        bullet("PartTimeWeeklyAvailability — khung giờ rảnh/bận của nhân viên part-time"),
        bullet("Application — đơn nghỉ, lý do text, trạng thái duyệt"),
        bullet("Payroll aggregates — công thực tế so với kế hoạch"),

        heading2("1.3 Pain point rõ nhất từ code"),
        bullet("Admin gán ca Part-time thủ công, từng người từng ngày"),
        bullet("Duyệt đơn hàng loạt — không có tóm tắt / xếp ưu tiên"),
        bullet("Không có cảnh báo bất thường chấm công"),
        bullet("Real Shift chưa có UI — planned vs actual chưa khai thác"),

        // ── 2. TỔNG QUAN ──
        heading1("2. Tổng quan ý tưởng AI (3 Tier)"),
        body(
          "Các ý tưởng được xếp theo giá trị kinh doanh và độ khó triển khai. Nguyên tắc chung: AI đề xuất, con người quyết định — không auto-execute các hành động nhạy cảm (duyệt đơn, gán ca).",
        ),
        makeTable(
          ["Tier", "Feature chính", "Effort", "Impact", "LLM?"],
          [
            ["1", "Leave Assistant + Approval Summary + Anomaly", "2–4 tuần", "Cao", "Có (chính)"],
            ["2", "PT Shift Suggester + Weekly Schedule Copilot", "4–6 tuần", "Rất cao", "Phụ (explain)"],
            ["3", "Forecast + Real Shift AI + Payroll Explainer", "6–10 tuần", "Chiến lược", "Có"],
          ],
          [1200, 4200, 1600, 1600, 1860],
        ),
        spacer(),
        ...callout(
          "Nguyên tắc thiết kế",
          "Rule engine / Optimizer trước, LLM sau. LLM chỉ parse text hoặc giải thích — không tự quyết định phân ca hay duyệt đơn. Mọi đề xuất đều qua human-in-the-loop.",
        ),

        // ── 3. TIER 1 ──
        heading1("3. Tier 1 — Ship nhanh, ROI cao"),
        body("Các feature này dễ demo, dùng hàng ngày, effort thấp. Phù hợp làm bước đầu tiên để chứng minh giá trị AI.", {
          italic: true,
        }),

        heading2("3.1 AI Assistant nộp đơn (Leave / OT / WFH)"),
        body("Nhân viên gõ ngôn ngữ tự nhiên, AI parse ra form chuẩn và kiểm tra ràng buộc."),
        quote('"Tôi nghỉ chiều mai vì đi khám, còn 3 ngày phép"'),
        body("→ Hệ thống tự điền:"),
        bullet("type = leave, leaveType = personal"),
        bullet("startDate / endDate"),
        bullet("reason"),
        bullet("Kiểm tra số ngày phép còn lại, trùng lịch ca, overlap đơn khác"),
        spacer(),
        body("Hook sẵn trong code:", { bold: true }),
        bullet("application.service.ts — validation hiện có"),
        bullet("submitApplicationSchema — Zod schema"),
        bullet("UI: chat panel trong CreateApplicationPage"),
        body("Kỹ thuật: Structured output (JSON schema) — không cần RAG. Model trả JSON đúng format, validate bằng Zod."),

        heading2("3.2 Approval Triage cho HR"),
        body("Queue duyệt đơn có thể rất dài. AI giúp HR xử lý nhanh hơn:"),
        bullet("Tóm tắt từng đơn thành 1–2 câu"),
        bullet("Gắn nhãn rủi ro: low / medium / high"),
        bullet("Gợi ý: Approve / Reject / Cần hỏi thêm"),
        spacer(),
        body("Ví dụ rule + LLM:", { bold: true }),
        bullet("Đơn nghỉ 1 ngày, còn phép, không trùng ca → low → gợi ý Approve"),
        bullet("OT 4 giờ liên tiếp 3 ngày → high → gợi ý xem xét kỹ"),
        body("HR vẫn bấm Approve/Reject thủ công — AI chỉ hỗ trợ xếp hàng và tóm tắt."),

        heading2("3.3 Anomaly Detection chấm công"),
        body("Phân tích AttendanceRecord + GPS để phát hiện bất thường:"),
        bullet("Check-in xa geofence nhưng vẫn pass"),
        bullet("Pattern lạ: luôn check-in sát deadline, check-out sớm"),
        bullet("Cùng GPS nhiều người khác thời điểm (có thể proxy)"),
        body("→ Dashboard \"Cảnh báo\" cho HR. Không auto phạt — human-in-the-loop."),

        // ── 4. TIER 2 ──
        heading1("4. Tier 2 — Giải quyết pain point lớn"),
        body(
          "Tier 2 phức tạp hơn vì cần tối ưu hóa đa biến và phân tích dữ liệu lịch sử — không chỉ parse text. Đây là phần có ROI cao nhất nếu công ty có nhiều nhân viên part-time hoặc lịch full-time phức tạp.",
          { italic: true },
        ),
        ...callout(
          "Trạng thái thực tế",
          "Khác với Tier 1 cần build từ đầu, Tier 2 đã có lõi backend. PtShiftSuggestionService (greedy scoring), ScheduleInsightsService (analytics + template suggest + what-if simulator), và route /suggest đều đã tồn tại. Việc còn lại là hoàn thiện UI, thêm coverage config cho admin, và kết nối LLM explainer.",
        ),

        heading2("4.1 Smart Shift Assignment (Part-time) ⭐"),
        body(
          "Đây là fit tốt nhất với codebase hiện tại. Admin đang gán ca PT thủ công qua màn Part-time Availability.",
        ),

        heading3("Luồng hiện tại (không AI)"),
        numbered("Nhân viên PT submit availability (khung giờ rảnh/bận)"),
        numbered("Admin mở drawer, nhập start/end từng ngày thủ công"),
        numbered("Gọi POST /part-time-availability/:id/assign-shifts → validate → lưu EmployeeShift qua replacePartTimeOverrides()"),
        spacer(),
        body("Hạn chế còn lại:", { bold: true }),
        bullet("Admin gán từng người một — không có view cả team trong một màn"),
        bullet("Không biết ai hay đi muộn, ai reliable khi chọn"),
        bullet("Coverage requiredCount mặc định là 1 — chưa có UI để admin config số người cần thiết mỗi ca/ngày"),

        heading3("Smart Shift Assignment làm gì?"),
        body("Không auto-gán. Hệ thống đề xuất phân ca, admin review rồi confirm.", {
          bold: true,
        }),
        spacer(),
        body("Input tuần W:", { bold: true }),
        bullet("PT employees × PartTimeWeeklyAvailability (slots rảnh — đã có trong DB)"),
        bullet("WorkingShift catalog (đã có — isActive filter)"),
        bullet("coverageRequirements[] — admin truyền vào hoặc fallback: 1 người/ca/ngày cho mọi active shift"),
        bullet("Historical signals từ AttendanceRecord 90 ngày — LOOKBACK_DAYS=90 (đã config trong PART_TIME_SHIFT_SUGGEST)"),
        spacer(),
        body("Output:", { bold: true }),
        bullet("Suggested assignments per employee per day (ISuggestPartTimeShiftsResult)"),
        bullet("Coverage score per day/shift"),
        bullet("unassignedGaps[] — ca không đủ người"),
        bullet("LLM explanation (optional, human-readable)"),

        heading3("Hai lớp xử lý — trạng thái implementation"),
        body("Lớp 1: Constraint Solver — đã implement (PtShiftSuggestionService)", { bold: true }),
        spacer(),
        body("Hard constraints đã có trong code:", { bold: true }),
        bullet("shiftFitsAvailabilityDay() — ca phải nằm trong khung rảnh, không busy all day"),
        bullet("startTime < endTime — validate trong PartTimeAvailabilityService.assignShifts()"),
        bullet("replacePartTimeOverrides() — atomic delete+create, loại bỏ duplicate tự nhiên"),
        bullet("Chỉ assign khi status ∈ {submitted, approved} — assertSubmittedForAssign()"),
        bullet("Overnight shift bị block — shiftFitsAvailabilityDay() trả false nếu endTime < startTime"),
        spacer(),
        body("Scoring hiện tại (scorePartTimeReliability — 2 chiều):", { bold: true }),
        makeTable(
          ["Chiều score", "Trọng số thực tế", "Nguồn data"],
          [
            ["Attendance rate (check-in/check-out)", "WEIGHT_ATTENDANCE_RATE = 70%", "AttendanceRecord 90 ngày (queryRecords với employeeIds batch)"],
            ["Late penalty (lateMinutes > 0)", "WEIGHT_LATE_PENALTY = 30%", "lateMinutes từ AttendanceRecord, capped tại LATE_PENALTY_CAP_MINUTES=60"],
            ["Tie-break: ít giờ tuần này hơn", "assignedMinutesByEmployeeId", "EmployeeShift.shift.endTime - startTime trong tuần"],
            ["Employee chưa check-in lần nào", "NEUTRAL_SCORE = 50", "Không penalty, không bonus"],
          ],
          [3000, 2800, 4660],
        ),
        spacer(),
        body("Lưu ý: không có soft constraint 'cân bằng giờ' dạng weighted score — chỉ dùng làm tie-break sau khi score bằng nhau.", { italic: true }),
        spacer(),
        body("Cần thêm để hoàn thiện:", { bold: true }),
        bullet("UI cho admin config coverageRequirements (requiredCount mỗi ca/ngày) — hiện chỉ default = 1"),
        bullet("Coverage bar visualization trên màn admin roster — component part-time-suggestion-matrix.tsx đã có, cần wire thêm coverage data"),
        bullet("LLM explainer — chưa có, optional"),
        spacer(),
        body("Lớp 2: LLM Explainer (chưa implement — optional)", { bold: true }),
        body("Sau khi solver chạy xong, LLM chỉ giải thích kết quả bằng ngôn ngữ tự nhiên:"),
        quote(
          '"Gán Lan 8:00–12:00 T3 vì: rảnh 7:30–13:00, attendance rate 97%, score 82/100. Thiếu 1 người ca chiều T3 — không có PT nào rảnh (unassignedGap), cần admin quyết định."',
        ),
        body("LLM không thay đổi assignment — chỉ narrative. Solver trả kết quả trước, LLM đọc và giải thích sau."),

        heading3("API đã có & còn thiếu"),
        makeTable(
          ["API", "Trạng thái", "Ghi chú"],
          [
            ["POST /part-time-availability/suggest", "✅ Đã có", "PtShiftSuggestionService.suggest(), route đã đăng ký"],
            ["POST /part-time-availability/:id/assign-shifts", "✅ Đã có", "PartTimeAvailabilityService.assignShifts(), không đổi"],
            ["PUT coverageRequirements config", "❌ Chưa có", "Admin cần màn để set requiredCount mỗi shift/ngày"],
          ],
          [3200, 1800, 5460],
        ),
        spacer(),
        body("Body suggest hiện tại: { weekStart, coverageRequirements? }"),
        body("Response: { suggestions: ISuggestPartTimeEmployeeSuggestion[], unassignedGaps[], weekStart }"),

        heading3("Edge cases"),
        makeTable(
          ["Case", "Xử lý hiện tại"],
          [
            ["Không ai rảnh ca cần", "unassignedGaps[] trong response — đã có"],
            ["2 PT cùng score", "Tie-break: ít giờ tuần này hơn — assignedMinutesByEmployeeId"],
            ["Employee chưa từng check-in", "NEUTRAL_SCORE = 50, không penalty — đã có"],
            ["Overnight shift", "Block intentionally — shiftFitsAvailabilityDay() trả false"],
            ["Admin dùng suggestion rồi sửa", "Log suggestionDecision='edited' qua auditService — đã có"],
            ["Admin không dùng suggestion", "Log suggestionDecision='manual' — đã có"],
          ],
          [3600, 6860],
        ),
        spacer(),
        heading3("Effort còn lại (backend core đã có)"),
        makeTable(
          ["Task", "Trạng thái", "Thời gian ước tính"],
          [
            ["PtShiftSuggestionService + scoring", "✅ Done", "—"],
            ["Route POST /suggest + controller", "✅ Done", "—"],
            ["Frontend Apply Suggestion button", "✅ Done", "—"],
            ["Coverage requirements config UI", "❌ Cần build", "3–4 ngày"],
            ["Coverage bar visualization", "⚠️ Cần wire", "2–3 ngày"],
            ["LLM explainer (optional)", "❌ Cần build", "2–3 ngày"],
            ["Tổng còn lại", "", "~1–1.5 tuần"],
          ],
          [3600, 1800, 5060],
        ),

        heading2("4.2 Weekly Schedule Copilot (Full-time)"),
        body(
          "Áp dụng cho nhân viên full-time dùng workScheduleType='full_time' (canonical field — không nhầm với employeeType legacy). Admin hiện tạo template thủ công; backend insights đã có, frontend cần hoàn thiện.",
        ),

        heading3("Ba chế độ — trạng thái implementation"),
        body("Chế độ A: Analytics Dashboard — backend đã có (ScheduleInsightsService)", { bold: true }),
        body("Route GET /schedule/insights trả về:"),
        bullet("lateRateByDay — tỷ lệ đi muộn GROUP BY dayOfWeek (threshold: LATE_RATE_THRESHOLD=0.1)"),
        bullet("absentRateByDay — tỷ lệ vắng GROUP BY dayOfWeek (threshold: ABSENT_RATE_THRESHOLD=0.08)"),
        bullet("hotspots — top 3 ngày/ca vấn đề nhất (HOTSPOT_LIMIT=3)"),
        bullet("lookbackDays config — 7–180 ngày, default 90"),
        body("→ Cần build frontend chart/heatmap để hiển thị. Backend SQL aggregation đã có, zero LLM cost."),
        spacer(),

        body("Chế độ B: Template Suggester — backend đã có (GET /schedule/suggest-templates)", { bold: true }),
        body("Input: lookbackDays, workingShifts catalog, historical attendance patterns."),
        body("Output: tối đa CANDIDATE_LIMIT=2 template candidates + coverage score + gợi ý shift assignments cho từng ngày trong tuần."),
        quote(
          "Template A (score 88): T2-T6 ca 08:00-17:00, coverage ổn. Template B (score 73): T2-T6 + T7 sáng, OT giảm. — LLM explain trade-off (chưa implement).",
        ),
        body("Scoring: TEMPLATE_BASE_SCORE=88, LATE_RISK_PENALTY=25, ABSENCE_RISK_PENALTY=20, coverage range 40–99."),
        spacer(),

        body("Chế độ C: What-if Simulator — backend đã có (POST /schedule/simulate-template)", { bold: true }),
        body("Admin submit template config → simulate N tuần (MIN=1, MAX=8, default=4 tuần):"),
        quote(
          '"Nếu đổi T5 sang ca chiều: coverage T5 +8%, late risk giảm dựa trên historical data."',
        ),
        body("Frontend form để submit template + hiển thị simulation result chưa có."),

        heading3("Lưu ý kỹ thuật quan trọng — WorkScheduleType"),
        body("Filter nhân viên FT phải dùng workScheduleType='full_time', không dùng employeeType='full_time'.", { bold: true }),
        bullet("workScheduleType — canonical field cho PT/FT branching trong toàn bộ schedule/attendance logic"),
        bullet("employeeType — legacy field, có thể khác workScheduleType, không dùng cho schedule decision"),
        bullet("isPartTimeWorkSchedule() util trong codebase đã dùng đúng workScheduleType"),

        heading3("Metrics từ data sẵn có"),
        makeTable(
          ["Metric", "Logic trong ScheduleInsightsService", "Insight"],
          [
            ["Late rate by day", "lateMinutes > 0, GROUP BY dayOfWeek, AVG", "Thứ 2 hay muộn"],
            ["Absent rate by day", "Có shift nhưng status=absent, GROUP BY dayOfWeek", "Thứ 6 vắng nhiều"],
            ["Hotspot days", "Combine late + absent, top HOTSPOT_LIMIT", "Ngày cần chú ý nhất"],
            ["OT pattern", "overtimeMinutes > 0 từ AttendanceRecord", "Ca nào thường OT"],
            ["Coverage gap (template sim)", "EmployeeShift count per day vs required", "T5 thiếu người"],
          ],
          [2800, 4400, 3260],
        ),
        spacer(),

        heading3("Effort còn lại (backend core đã có)"),
        makeTable(
          ["Task", "Trạng thái", "Thời gian ước tính"],
          [
            ["ScheduleInsightsService (insights, suggest, simulate)", "✅ Done", "—"],
            ["Routes /insights, /suggest-templates, /simulate-template", "✅ Done", "—"],
            ["Frontend insights dashboard (chart/heatmap)", "❌ Cần build", "1 tuần"],
            ["Frontend template suggester UI", "❌ Cần build", "1 tuần"],
            ["Frontend what-if simulator form", "❌ Cần build", "3–4 ngày"],
            ["LLM explainer cho template trade-off", "❌ Cần build", "2–3 ngày"],
            ["Tổng còn lại", "", "~2–3 tuần"],
          ],
          [3600, 1800, 5060],
        ),

        heading2("4.3 So sánh 2 feature Tier 2"),
        makeTable(
          ["Tiêu chí", "PT Shift Suggester", "Weekly Schedule Copilot"],
          [
            ["Đối tượng", "workScheduleType=part_time", "workScheduleType=full_time"],
            ["Time horizon", "1 tuần", "2–4 tuần cycle"],
            ["Granularity", "Từng người, từng ngày", "Pattern chung cho nhóm"],
            ["Backend core", "✅ PtShiftSuggestionService đã có", "✅ ScheduleInsightsService đã có"],
            ["Routes đã có", "POST /suggest, POST /:id/assign-shifts", "GET /insights, /suggest-templates, POST /simulate-template"],
            ["Frontend còn thiếu", "Coverage config UI, coverage bar", "Toàn bộ dashboard/form"],
            ["LLM role", "Explain only (optional)", "Explain trade-off (optional)"],
            ["ROI", "Cao nếu nhiều PT", "Cao nếu nhiều FT, template phức tạp"],
          ],
          [2600, 3930, 3930],
        ),
        spacer(),
        ...callout(
          "Tại sao là Tier 2, không phải Tier 1?",
          "Tier 1: 1 input → 1 output (parse text), LLM làm chính, 1 API call. Tier 2: N input × M constraint → matrix output, cần historical data, Optimizer làm chính / LLM phụ, multi-step pipeline. Quan trọng: cả hai feature Tier 2 đã có backend core — effort chính bây giờ là frontend và coverage config UI.",
        ),

        // ── 5. TIER 3 ──
        heading1("5. Tier 3 — Nâng cao, chiến lược"),
        body("Các feature này mang tính dài hạn, phụ thuộc Tier 1–2 đã ổn định.", {
          italic: true,
        }),

        heading2("5.1 Absenteeism Forecast"),
        body(
          "Dự báo ngày/giờ thiếu người từ lịch sử nghỉ + mùa (Tết, cuối tháng). Giúp HR chủ động tìm người thay thế trước khi thiếu hụt xảy ra.",
        ),

        heading2("5.2 Real Shift Intelligence"),
        body(
          "Khi build UI RealShift (model DB đã có, UI hiện redirect stub): so sánh planned vs actual, AI giải thích mismatch.",
        ),
        quote('"Check-out sớm 45 phút — có đơn về sớm đã duyệt."'),

        heading2("5.3 Payroll Attendance Explainer"),
        body(
          "Tóm tắt ngôn ngữ tự nhiên cho HR/employee về công tháng:",
        ),
        quote(
          '"Tháng 6: 22 ngày công, 2 ngày nghỉ phép, 3 lần đi muộn tổng 45 phút."',
        ),
        body("Hook sẵn: payroll.service.ts attendance aggregates."),

        // ── 6. KIẾN TRÚC ──
        heading1("6. Kiến trúc kỹ thuật đề xuất"),
        heading2("6.1 Cấu trúc thư mục"),
        body("Frontend:", { bold: true }),
        bullet("components/features/attendance/ai/ — chat panel, suggestion UI"),
        bullet("hooks/attendance/use-attendance-ai.ts — React Query"),
        spacer(),
        body("Backend:", { bold: true }),
        bullet("services/ai/ — ai-provider.interface.ts, openai/gemini provider"),
        bullet("services/attendance-ai/ — leave-parser, anomaly, shift-suggestion"),
        bullet("routes/attendance-ai.route.ts"),
        bullet("configs/ai/prompts.config.ts — mọi prompt/magic string ở 1 chỗ"),

        heading2("6.2 Nguyên tắc bắt buộc"),
        makeTable(
          ["Nguyên tắc", "Lý do"],
          [
            ["AI đề xuất, không auto-execute", "Duyệt đơn, gán ca vẫn cần human"],
            ["Rule engine trước, LLM sau", "Rẻ, deterministic, dễ audit"],
            ["Structured output (Zod)", "Parse JSON an toàn tại boundary"],
            ["Log mọi prompt/response", "Compliance HR, debug, tune"],
            ["Feature flag AI_ATTENDANCE_ENABLED", "Rollout từng phần, tắt nhanh nếu lỗi"],
          ],
          [4800, 5660],
        ),

        heading2("6.3 Stack đề xuất"),
        bullet("Runtime: Bun + Express (giữ nguyên)"),
        bullet("LLM provider: OpenAI / Gemini — abstraction qua interface"),
        bullet("Optimizer: Pure TypeScript greedy (MVP) → OR-Tools nếu scale"),
        bullet("Validation: Zod structured output"),
        bullet("Frontend: React Query + drawer/panel hiện có"),

        // ── 7. ROADMAP ──
        heading1("7. Roadmap triển khai"),
        makeTable(
          ["Phase", "Feature", "Effort", "Impact"],
          [
            ["1", "Leave chat + Approval summary", "1–2 sprint", "Cao — dùng hàng ngày"],
            ["2", "Anomaly flags dashboard", "1 sprint", "Trung bình — giảm gian lận"],
            ["3", "PT Shift Suggester", "2 sprint", "Rất cao — tiết kiệm admin"],
            ["4", "Schedule Copilot + Forecast", "2 sprint", "Chiến lược"],
          ],
          [1200, 4000, 2200, 3060],
        ),
        spacer(),
        body("Thứ tự phụ thuộc:", { bold: true }),
        body("Phase 1 → Phase 2 → Phase 3 → Phase 4"),
        body(
          "Phase 1–2 dùng LLM nhiều. Phase 3–4 dùng Optimizer làm lõi, LLM chỉ explain. Insights dashboard (Schedule Copilot chế độ A) có thể ship song song Phase 1 — zero LLM cost.",
        ),

        // ── 8. KHUYẾN NGHỊ ──
        heading1("8. Khuyến nghị bắt đầu"),
        heading2("Nếu chỉ chọn 1 feature đầu tiên"),
        body("Option A — Combo Phase 1 (khuyến nghị demo nhanh):", { bold: true }),
        bullet("Leave Assistant — visible cho mọi employee, dễ demo"),
        bullet("Approval Summary — visible cho HR, giảm cognitive load"),
        spacer(),
        body("Option B — Nếu pain point lớn nhất là admin gán ca PT:", { bold: true }),
        bullet("Bắt đầu PT Shift Suggester (Phase 3)"),
        bullet("Effort cao hơn nhưng ROI trực tiếp vào workflow đang mở"),
        spacer(),
        body("Option C — Nếu muốn value ngay, zero LLM cost:", { bold: true }),
        bullet("Ship Insights dashboard (Schedule Copilot chế độ A)"),
        bullet("Data đó feed vào optimizer sau"),

        heading2("Kế hoạch chi tiết nếu chọn PT Shift Suggester"),
        makeTable(
          ["Tuần", "Công việc"],
          [
            ["1–2", "Scoring service từ attendance history"],
            ["2–3", "Greedy optimizer + API"],
            ["3–4", "UI matrix + tích hợp drawer hiện có"],
            ["4+", "LLM explainer (nice-to-have)"],
          ],
          [2000, 8460],
        ),
        spacer(),
        ...callout(
          "Bước tiếp theo",
          "Chọn 1 hướng → viết plan chi tiết (API contract, UI wireframe, prompt template) → prototype. Có thể đánh giá chi phí LLM (token/request) cho từng feature trước khi commit.",
        ),

        // ── FOOTER ──
        spacer(),
        spacer(),
        new Paragraph({
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border, space: 12 },
          },
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: "Tài liệu nội bộ · Integrated HR & Product System · Module Attendance AI Proposal",
              size: 16,
              font: "Calibri",
              color: COLORS.muted,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Nội dung dựa trên phân tích codebase thực tế (services, routes, Prisma schema, frontend utils).",
              size: 16,
              font: "Calibri",
              color: COLORS.muted,
              italics: true,
            }),
          ],
        }),
      ],
    },
  ],
})

async function main() {
  const outDir = join(process.cwd(), "docs")
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, "attendance-ai-proposal.docx")
  const buffer = await Packer.toBuffer(doc)
  writeFileSync(outPath, buffer)
  console.log(`Created: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
