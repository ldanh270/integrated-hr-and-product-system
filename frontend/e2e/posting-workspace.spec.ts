import { expect, test } from "@playwright/test"

const posting = { id: "posting-workspace", requisitionId: "req-workspace", channel: "google_form", source: "google_form", sourceCode: "GFORM-WORKSPACE", status: "open", connectorStatus: "ready", postingUrl: null, lastSyncedAt: null, requisition: { code: "REQ-2026-001", title: "Senior NodeJS Developer", department: "Engineering" } }
const stages = [
  { id: "received", postingId: posting.id, name: "Nộp đơn", color: "#3B82F6", position: 0, isDefault: true, isCompleted: false },
  { id: "interview", postingId: posting.id, name: "Phỏng vấn vòng 1", color: "#F59E0B", position: 1, isDefault: false, isCompleted: false },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("auth-storage", JSON.stringify({ state: { user: { id: "admin", roles: ["admin"], permissions: ["recruitment.read", "recruitment.update", "recruitment.jd.read", "recruitment.create", "recruitment.posting.manage", "recruitment.intake.manage"] }, isAuthenticated: true }, version: 0 })))
  await page.route("**/api/recruitment/job-postings/posting-workspace", (route) => route.fulfill({ json: { data: posting, error: null } }))
  await page.route("**/api/recruitment/job-postings/posting-workspace/overview", (route) => route.fulfill({ json: { data: { posting, applicationTotal: 1, stageGroups: [{ pipelineStageId: "received", _count: { _all: 1 } }] }, error: null } }))
  await page.route("**/api/recruitment/job-postings/posting-workspace/stages", (route) => route.fulfill({ json: { data: stages, error: null } }))
  await page.route("**/api/recruitment/applications?*", (route) => route.fulfill({ json: { data: { items: [{ id: "application-1", source: "google_form", status: "new", candidate: { id: "candidate-1", fullName: "Nguyễn An", email: "an@example.com", phone: null, avatarUrl: null }, assignedTo: null, pipelineStage: stages[0], interviewRounds: [] }], total: 1, page: 1, pageSize: 1000 }, error: null } }))
  await page.route("**/api/recruitment/job-postings/posting-workspace/activities*", (route) => route.fulfill({ json: { data: { items: [], total: 0, page: 1, pageSize: 20 }, error: null } }))
  await page.route("**/api/recruitment/job-postings/posting-workspace/responses", (route) => route.fulfill({ json: { data: [], error: null } }))
})

test("opens the posting workspace from the list instead of a detail popup", async ({ page }) => {
  await page.route("**/api/recruitment/job-postings", (route) => route.fulfill({ json: { data: [posting], error: null } }))
  await page.route("**/api/recruitment/requisitions?*", (route) => route.fulfill({ json: { data: { items: [], total: 0 }, error: null } }))

  await page.goto("/recruitment/job-postings")
  await page.getByRole("row", { name: /Senior NodeJS Developer/ }).click()

  await expect(page).toHaveURL(/\/recruitment\/job-postings\/posting-workspace\/overview$/)
  await expect(page.getByRole("heading", { name: "Senior NodeJS Developer" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Chi tiết Bài đăng tuyển dụng" })).toHaveCount(0)
})

test("renders project-style posting workspace and adds a candidate", async ({ page }) => {
  await page.goto("/recruitment/job-postings/posting-workspace/kanban")
  await expect(page.getByText("Kanban Board")).toBeVisible()
  await expect(page.getByText("Nộp đơn")).toBeVisible()
  await expect(page.getByText("Phỏng vấn vòng 1")).toBeVisible()

  await page.getByRole("tab", { name: "Ứng viên" }).click()
  await page.getByRole("button", { name: "Thêm ứng viên" }).click()
  await page.getByLabel("Họ và tên").fill("Trần Bình")
  await page.getByLabel("Email").fill("an@example.com")
  await page.route("**/api/recruitment/job-postings/posting-workspace/candidates", (route) => route.fulfill({ status: 201, json: { data: { id: "application-2" }, error: null } }))
  const request = page.waitForRequest("**/api/recruitment/job-postings/posting-workspace/candidates")
  await page.getByRole("button", { name: "Tạo ứng viên" }).click()
  expect((await request).postDataJSON()).toMatchObject({ fullName: "Trần Bình", email: "an@example.com" })
})
