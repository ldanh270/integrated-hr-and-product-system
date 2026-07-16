§G
Hoàn tất Attendance Tier 2: PT optimizer + Schedule Copilot, human duyệt trước persist.

§C
C1: Bun; Express 5; React 19; TypeScript strict; Zod boundary.
C2: Chỉ sửa Attendance Tier 2 files; giữ nguyên thay đổi không liên quan.
C3: Route → Controller → Service → Repository; constructor DI.
C4: API dùng ApiResponse<T>; enum/config không hardcode.
C5: Suggest read-only; admin review/edit/confirm qua assign flow.
C6: UI theo docs/frontend-design-spec.md; file <=200 dòng.
C7: Unit + integration + Playwright cho behavior mới.

§I
I.ptSuggest: POST /api/part-time-availabilities/suggest body {weekStart,coverageRequirements?} → {weekStart,suggestions,coverage,unassignedGaps,warnings}.
I.ptAssign: POST /api/part-time-availabilities/:id/assign-shifts giữ contract hiện tại.
I.scheduleInsights: GET /api/schedules/insights.
I.scheduleSuggest: GET /api/schedules/suggest-templates.
I.scheduleSimulate: POST /api/schedules/simulate-template.

§V
V1: Mọi PT suggestion status submitted/legacy approved; slot nằm trong availability; start<end; không overlap ca đã có.
V2: Solver lấp coverage thiếu theo WorkingShift; chọn score cao; hòa score chọn ít giờ tuần hơn; không ai hợp lệ → unassignedGaps.
V3: Employee không attendance history → neutral score; lookback neo theo weekStart, không wall clock.
V4: Suggest không persist EmployeeShift; chỉ confirm mới persist.
V5: UI có team matrix, coverage theo ngày/ca, warning gap/conflict, tick/untick/edit, confirm theo employee.
V6: Existing assign API và weekly schedule flow không regression.
V7: Core solver/scoring/mapping có golden unit tests; critical admin flow có Playwright.
V8: Click Bảng lương: user có payroll.read → payroll admin; user thường → /payroll/my-payslips và sidebar chỉ còn Lương của tôi; mọi payroll admin page vẫn cần payroll.read.

§T
id|status|goal|cites
T1|.|Khóa PT suggest schema + API contract|V1,V2,V4,I.ptSuggest
T2|.|Build deterministic coverage optimizer + historical signals|V1,V2,V3,V4
T3|.|Build team matrix review UI + coverage/gaps|V5,I.ptSuggest,I.ptAssign
T4|.|Hoàn thiện Schedule Copilot gaps + regression|V6,I.scheduleInsights,I.scheduleSuggest,I.scheduleSimulate
T5|.|Thêm unit/integration/Playwright; typecheck/lint/build|V7

§B
id|date|cause|fix
B1|2026-07-16|Zod refined object reused with unsupported unwrap API|direct base shape reuse; no new invariant
B2|2026-07-16|break fields accidentally made required in preview contract|keep preview break fields optional; no new invariant
B3|2026-07-16|Prisma model gained nullable break fields but shift fixture omitted them|fixture mirrors generated model; no new invariant
B4|2026-07-16|Jest worker spawn blocked by sandbox EPERM|verify with --runInBand; external environment
B5|2026-07-16|full suite profile avatar fixture expects static public ID but implementation adds timestamp|unrelated existing drift; no attendance invariant
B6|2026-07-16|boolean aliases did not narrow nullable break fields for TypeScript|narrow local field values directly; no new invariant
B7|2026-07-16|payroll subsystem visible without payroll.read then permission redirect landed on personal schedule|V8
B8|2026-07-16|frontend tsconfig lacked bun:test type declarations|keep Bun config invariant test as mjs; no runtime change
B9|2026-07-16|hiding payroll subsystem blocked desired employee shortcut to personal payslips|V8 routes by payroll.read
B10|2026-07-16|employee payroll shortcut reused personal route so sidebar switched back to all personal items|V8 uses payroll-scoped self-service route
