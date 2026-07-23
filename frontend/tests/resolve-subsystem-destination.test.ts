import { ROUTES } from "@/config/routes.config"
import { resolveSubsystemDestination } from "@/utils/navigation/resolve-subsystem-destination"

import { describe, expect, it } from "bun:test"

describe("V8 subsystem navigation", () => {
  it("routes a part-time employee with attendance access to self-service attendance", () => {
    expect(
      resolveSubsystemDestination(
        "attendance",
        ROUTES.ATTENDANCE.BASE,
        ["attendance.read"],
        ["employee"],
      ),
    ).toBe(ROUTES.ATTENDANCE.SUMMARY)
  })

  it("falls back to an accessible attendance page when read permission is stale", () => {
    expect(
      resolveSubsystemDestination("attendance", ROUTES.ATTENDANCE.BASE, [], ["employee"]),
    ).toBe(ROUTES.ATTENDANCE.HOLIDAYS)
  })

  it("keeps personal payslips accessible without payroll administration permission", () => {
    expect(resolveSubsystemDestination("payroll", ROUTES.PAYROLL.BASE, [], ["employee"])).toBe(
      ROUTES.PAYROLL.MY_PAYSLIPS,
    )
  })
})
