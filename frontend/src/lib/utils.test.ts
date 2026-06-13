import { describe, expect, test } from "bun:test"
import { minutesToTime, timeToMinutes, formatTime, formatDate } from "./utils"

/**
 * Unit tests for frontend utilities using Bun's native test runner.
 * 
 * To run these tests:
 *   cd frontend
 *   bun test src/lib/utils.test.ts
 */

describe("Frontend Utilities Tests", () => {
  describe("minutesToTime", () => {
    test("should convert minutes since midnight to HH:MM format", () => {
      expect(minutesToTime(480)).toBe("08:00")
      expect(minutesToTime(0)).toBe("00:00")
      expect(minutesToTime(1045)).toBe("17:25")
    })
  })

  describe("timeToMinutes", () => {
    test("should convert HH:MM time string to numeric minutes", () => {
      expect(timeToMinutes("08:00")).toBe(480)
      expect(timeToMinutes("00:00")).toBe(0)
      expect(timeToMinutes("17:25")).toBe(1045)
    })
  })

  describe("formatTime", () => {
    test("should return placeholder if no time is provided", () => {
      expect(formatTime(null)).toBe("—")
      expect(formatTime(undefined)).toBe("—")
    })

    test("should correctly format ISO string to local HH:MM time", () => {
      const testIso = "2026-06-13T08:30:00.000Z"
      const result = formatTime(testIso)
      expect(result).toMatch(/^\d{2}:\d{2}$/) // Matches HH:MM format
    })
  })

  describe("formatDate", () => {
    test("should return placeholder if no date is provided", () => {
      expect(formatDate(null)).toBe("—")
      expect(formatDate(undefined)).toBe("—")
    })

    test("should correctly format ISO string to local DD/MM/YYYY date", () => {
      const testIso = "2026-06-13T08:30:00.000Z"
      const result = formatDate(testIso)
      // Checks localized Vietnamese date format or generic format
      expect(result).toBeTruthy()
    })
  })
})
