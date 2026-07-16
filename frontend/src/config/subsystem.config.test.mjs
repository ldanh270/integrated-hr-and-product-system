import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { PAYROLL_SUBSYSTEM_PERMISSION, SUBSYSTEMS } from "@/config/subsystem.config"
import { resolveSubsystemDestination } from "@/utils/navigation/resolve-subsystem-destination"

import { describe, expect, test } from "bun:test"

describe("payroll subsystem navigation", () => {
  test("V8: keeps payroll visible but protects every administration page", () => {
    const payrollSubsystem = SUBSYSTEMS.find((subsystem) => subsystem.id === "payroll")
    const personalPayslipItem = payrollSubsystem?.sidebarItems.find(
      (item) => item.path === ROUTES.PAYROLL.MY_PAYSLIPS,
    )

    // No subsystem gate means employees can select "Bảng lương".
    expect(payrollSubsystem?.permissions).toBeUndefined()
    // Every item except the self-service payslip route remains administration-only.
    expect(
      payrollSubsystem?.sidebarItems
        .filter((item) => item.path !== ROUTES.PAYROLL.MY_PAYSLIPS)
        .every((item) => item.permissions?.includes(PAYROLL_SUBSYSTEM_PERMISSION)),
    ).toBe(true)
    // The surviving unguarded item is what makes the employee sidebar contain one row.
    expect(personalPayslipItem?.permissions).toBeUndefined()
  })

  test("V8: routes employees to personal payslips and admins to payroll", () => {
    // Employee stays in the payroll URL namespace, preventing a switch to Personal.
    expect(resolveSubsystemDestination("payroll", ROUTES.PAYROLL.BASE, [])).toBe(
      ROUTES.PAYROLL.MY_PAYSLIPS,
    )
    // payroll.read preserves the normal administration root.
    expect(
      resolveSubsystemDestination("payroll", ROUTES.PAYROLL.BASE, [PAYROLL_SUBSYSTEM_PERMISSION]),
    ).toBe(ROUTES.PAYROLL.BASE)
  })
})

describe("attendance subsystem navigation", () => {
  test("V9: attendance.read opens the all-employee history dashboard", () => {
    const attendanceSubsystem = SUBSYSTEMS.find((subsystem) => subsystem.id === "attendance")
    const historyItem = attendanceSubsystem?.sidebarItems.find(
      (item) => item.name === "Lịch sử chấm công",
    )

    expect(historyItem?.path).toBe(ROUTES.ATTENDANCE.DASHBOARD)
    expect(historyItem?.permissions).toEqual(["attendance.read"])
    expect(historyItem?.roles).toEqual([ROLE.ADMIN])
  })

  test("V10: admins retain a separate personal attendance summary entry", () => {
    const attendanceSubsystem = SUBSYSTEMS.find((subsystem) => subsystem.id === "attendance")
    const personalItem = attendanceSubsystem?.sidebarItems.find(
      (item) => item.name === "Chấm công của tôi",
    )

    expect(personalItem?.path).toBe(ROUTES.ATTENDANCE.SUMMARY)
    expect(personalItem?.permissions).toEqual(["attendance.read"])
    expect(personalItem?.roles).toBeUndefined()
  })

  test("V11: employees enter attendance through their personal summary", () => {
    expect(
      resolveSubsystemDestination(
        "attendance",
        ROUTES.ATTENDANCE.BASE,
        ["attendance.read"],
        [ROLE.EMPLOYEE],
      ),
    ).toBe(ROUTES.ATTENDANCE.SUMMARY)
    expect(
      resolveSubsystemDestination(
        "attendance",
        ROUTES.ATTENDANCE.BASE,
        ["attendance.read"],
        [ROLE.ADMIN],
      ),
    ).toBe(ROUTES.ATTENDANCE.BASE)
  })
})
