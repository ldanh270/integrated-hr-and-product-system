import { approveRequisitionSchema, updateJobRequisitionSchema } from "@/schemas/recruitment.schema"

describe("updateJobRequisitionSchema", () => {
  it("rejects workflow status changes from the generic update boundary", () => {
    const result = updateJobRequisitionSchema.safeParse({ status: "approved" })

    expect(result.success).toBe(false)
  })

  it("accepts editable requisition fields without a workflow status", () => {
    const result = updateJobRequisitionSchema.safeParse({
      title: "Senior Backend Engineer",
      salaryMin: 30000000,
      salaryMax: 50000000,
    })

    expect(result.success).toBe(true)
  })
})

describe("approveRequisitionSchema", () => {
  it("requires a reason when rejecting a requisition", () => {
    expect(approveRequisitionSchema.safeParse({ approved: false }).success).toBe(false)
    expect(approveRequisitionSchema.safeParse({ approved: false, comment: "Budget needs review" }).success).toBe(true)
  })
})
