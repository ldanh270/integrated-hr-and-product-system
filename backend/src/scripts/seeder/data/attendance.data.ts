import { faker } from "@faker-js/faker"

export const SHIFTS_DATA = [
  {
    name: "Morning Shift",
    startTime: "08:00",
    endTime: "17:00",
    gps: { lat: 10.7769, lng: 106.7009, radiusMeters: 100 },
    gracePeriodMinutes: 15,
    isActive: true,
  },
  {
    name: "Afternoon Shift",
    startTime: "13:00",
    endTime: "22:00",
    gps: { lat: 10.7769, lng: 106.7009, radiusMeters: 150 },
    gracePeriodMinutes: 15,
    isActive: true,
  },
]

export const HOLIDAYS_DATA = [
  { name: "New Year", type: "national" as const, offsetDays: 0 },
  { name: "Company Anniversary", type: "company" as const, offsetDays: 15 },
]

export const LEAVE_REASONS = [
  "Family emergency",
  "Annual physical exam",
  "Personal matters",
  "Moving to new apartment",
  "Wedding ceremony",
  "Short vacation",
]

export const OVERTIME_REASONS = [
  "Deploy new feature batch",
  "Fix production bug hotfix",
  "Database migration support",
  "Quarterly report compilation",
]

export const generateAttendanceLocation = () => {
  // Coords near District 1, HCMC with minor variations
  return {
    lat: 10.7769 + (faker.number.float({ min: -5, max: 5 }) / 10000),
    lng: 106.7009 + (faker.number.float({ min: -5, max: 5 }) / 10000),
  }
}
