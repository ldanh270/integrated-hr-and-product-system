import { expect, test } from "@playwright/test"

const AUTH_STATE = {
  state: {
    user: {
      id: "admin-id",
      email: "admin@example.com",
      fullName: "Admin User",
      roles: ["custom-recruiter"],
      permissions: [
        "recruitment.read",
        "recruitment.update",
        "recruitment.jd.read",
        "recruitment.jd.create",
        "recruitment.posting.manage",
        "recruitment.intake.manage",
      ],
    },
    isAuthenticated: true,
  },
  version: 0,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((state) => {
    window.localStorage.setItem("auth-storage", JSON.stringify(state))
  }, AUTH_STATE)
  await page.route("**/api/**", (route) => route.fulfill({ json: { data: null, error: null } }))
})

test("shows JD then its Google Form posting using permissions instead of a fixed role", async ({ page }) => {
  await page.route("**/api/recruitment/job-descriptions**", (route) => route.fulfill({
    json: {
      data: {
        items: [{
          id: "jd-1",
          requisitionId: "req-1",
          title: "Frontend Engineer",
          requisition: { code: "REQ-2026-001", department: "Engineering" },
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))
  await page.route("**/api/recruitment/job-postings**", (route) => route.fulfill({
    json: {
      data: {
        items: [{
          id: "posting-1",
          jobDescriptionId: "jd-1",
          channel: "google_form",
          source: "google_form",
          sourceCode: "GFORM-FE-0726",
          status: "draft",
          postingUrl: null,
          connectorStatus: "not_configured",
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))

  await page.goto("/recruitment/job-descriptions")

  await expect(page.getByRole("heading", { name: "JD & Đăng tuyển" })).toBeVisible()
  await expect(page.getByText("REQ-2026-001")).toBeVisible()
  await expect(page.getByText("GFORM-FE-0726")).toBeVisible()
  await expect(page.getByText("Chưa cấu hình")).toBeVisible()
  await expect(page.getByRole("button", { name: "Tạo JD" })).toBeVisible()
})

test("creates a Google-only posting with flexible fields and the exact API contract", async ({ page }) => {
  await page.route("**/api/recruitment/job-descriptions**", (route) => route.fulfill({
    json: {
      data: {
        items: [{
          id: "jd-flexible",
          requisitionId: "req-flexible",
          title: "QA Engineer",
          requisition: { code: "REQ-2026-004", department: "Engineering" },
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))
  await page.route("**/api/recruitment/job-postings**", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        json: { data: { id: "posting-flexible", status: "draft" }, error: null },
      })
    }
    return route.fulfill({
      json: { data: { items: [], total: 0, page: 1, pageSize: 20 }, error: null },
    })
  })

  await page.goto("/recruitment/job-descriptions")
  await page.getByRole("button", { name: "Tạo Google Form" }).click()

  await expect(page.getByRole("heading", { name: "Tạo Google Form ứng tuyển" })).toBeVisible()
  await expect(page.getByText("Các trường ứng viên cần điền")).toBeVisible()
  await expect(page.getByLabel("Kênh đăng", { exact: true })).toHaveCount(0)
  await expect(page.getByLabel("Mã nguồn", { exact: true })).toHaveCount(0)
  await expect(page.getByLabel("Đường dẫn bài đăng / form", { exact: true })).toHaveCount(0)

  await page.getByRole("button", { name: "Thêm field" }).click()
  await page.getByLabel("Nhãn hiển thị").last().fill("Số năm kinh nghiệm")
  await page.getByLabel("Mã field").last().fill("years_experience")

  const createRequestPromise = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/api/recruitment/job-postings"),
  )
  await page.getByRole("button", { name: "Lưu cấu hình" }).click()

  expect((await createRequestPromise).postDataJSON()).toEqual({
    jobDescriptionId: "jd-flexible",
    fields: [
      { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
      { key: "email", label: "Email", type: "short_text", required: true },
      { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
      { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
      { key: "notes", label: "Thông tin bổ sung", type: "paragraph", required: false },
      { key: "years_experience", label: "Số năm kinh nghiệm", type: "short_text", required: false },
    ],
  })
  await expect(page.getByRole("heading", { name: "Tạo Google Form ứng tuyển" })).toHaveCount(0)
})

test("shows applicant intake after JD and posting selection stage", async ({ page }) => {
  await page.route("**/api/recruitment/job-descriptions**", (route) => route.fulfill({
    json: { data: { items: [], total: 0, page: 1, pageSize: 20 }, error: null },
  }))
  await page.route("**/api/recruitment/job-postings**", (route) => route.fulfill({
    json: { data: { items: [], total: 0, page: 1, pageSize: 20 }, error: null },
  }))

  await page.goto("/recruitment/applicant-intake")

  await expect(page.getByRole("heading", { name: "Tiếp nhận ứng viên" })).toBeVisible()
  await expect(page.getByText("Import Excel / CSV")).toBeVisible()
  await expect(page.getByText("Dữ liệu xem trước (0 hồ sơ)")).toBeVisible()
})

test("publishes and syncs Google Forms through connector contracts", async ({ page }) => {
  await page.route("**/api/recruitment/job-descriptions**", (route) => route.fulfill({
    json: {
      data: {
        items: [{
          id: "jd-google",
          requisitionId: "req-google",
          title: "Product Designer",
          requisition: { code: "REQ-2026-003", department: "Product" },
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))
  await page.route("**/api/recruitment/job-postings**", (route) => route.fulfill({
    json: {
      data: {
        items: [
          {
            id: "posting-google-draft",
            jobDescriptionId: "jd-google",
            channel: "google_form",
            source: "google_form",
            sourceCode: "GFORM-PD-0726",
            status: "draft",
            postingUrl: null,
            connectorStatus: "ready",
            lastSyncedAt: null,
          },
          {
            id: "posting-google-open",
            jobDescriptionId: "jd-google",
            channel: "google_form",
            source: "google_form",
            sourceCode: "GFORM-PD-OPEN",
            status: "open",
            postingUrl: "https://docs.google.com/forms/d/example/viewform",
            connectorStatus: "ready",
            lastSyncedAt: "2026-07-19T08:30:00.000Z",
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))

  const publishRequest = page.waitForRequest("**/api/recruitment/job-postings/posting-google-draft/publish")
  await page.route("**/api/recruitment/job-postings/posting-google-draft/publish", (route) => route.fulfill({
    json: { data: { id: "posting-google-draft", status: "open" }, error: null },
  }))
  const syncRequest = page.waitForRequest("**/api/recruitment/job-postings/posting-google-open/sync")
  await page.route("**/api/recruitment/job-postings/posting-google-open/sync", (route) => route.fulfill({
    json: {
      data: { total: 2, applicationsCreated: 2, candidatesCreated: 1, candidatesMatched: 1, failed: 0, errors: [], postingId: "posting-google-open", syncedAt: "2026-07-19T09:00:00.000Z" },
      error: null,
    },
  }))

  await page.goto("/recruitment/job-descriptions")

  await expect(page.getByRole("button", { name: "Tạo & public Google Form" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Sync hồ sơ" })).toBeVisible()
  await expect(page.getByText(/Đồng bộ gần nhất:/)).toBeVisible()
  const formLink = page.getByRole("link", { name: "Mở Google Form" })
  await expect(formLink).toHaveAttribute("href", "https://docs.google.com/forms/d/example/viewform")
  await expect(formLink).toHaveAttribute("target", "_blank")

  await page.getByRole("button", { name: "Tạo & public Google Form" }).click()
  expect((await publishRequest).postDataJSON()).toEqual({ mode: "connector" })

  await page.getByRole("button", { name: "Sync hồ sơ" }).click()
  expect((await syncRequest).method()).toBe("POST")
  await expect(page.getByText("Đã đồng bộ 2/2 lượt ứng tuyển từ Google Form")).toBeVisible()
})

test("V1 hides submit action when a draft requisition has no designated approver", async ({ page }) => {
  await page.route("**/api/recruitment/requisitions**", (route) => route.fulfill({
    json: {
      data: {
        items: [{
          id: "req-1",
          code: "REQ-2026-002",
          title: "Backend Engineer",
          department: "Engineering",
          positionLevel: "Middle",
          salaryMin: null,
          salaryMax: null,
          priority: "medium",
          status: "draft",
          approverId: null,
          approver: null,
          targetHireDate: null,
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    },
  }))
  await page.route("**/api/recruitment/requisitions/approvers**", (route) => route.fulfill({
    json: { data: [], error: null },
  }))

  await page.goto("/recruitment/requisitions")

  await expect(page.getByText("REQ-2026-002")).toBeVisible()
  await expect(page.getByText("Chưa chỉ định")).toBeVisible()
  await expect(page.getByRole("button", { name: "Gửi duyệt REQ-2026-002" })).toHaveCount(0)
})
