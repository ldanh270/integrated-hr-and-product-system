import Employee from "@/entities/Employee.ts"
import WorkingShift from "@/entities/attendance/WorkingShift.ts"
import ShiftSchedule from "@/entities/attendance/ShiftSchedule.ts"
import HolidayCalendar from "@/entities/attendance/HolidayCalendar.ts"
import EmployeeShift from "@/entities/attendance/EmployeeShift.ts"
import AttendanceRecord from "@/entities/attendance/AttendanceRecord.ts"
import Application from "@/entities/attendance/Application.ts"
import { SHIFTS_DATA, HOLIDAYS_DATA, LEAVE_REASONS, generateAttendanceLocation } from "../data/attendance.data.ts"
import { faker } from "@faker-js/faker"

import { seedEmployees } from "./employee.seeder.ts"

export const seedAttendance = async (passedEmployees?: any[]): Promise<{ shifts: any[] }> => {
  console.log("📅 Seeding Attendance...")

  // 1. Get employees or auto-seed if none exist
  let employees = passedEmployees || (await Employee.find())
  if (employees.length === 0) {
    console.log("⚠️ No employees found in database. Automatically seeding employees first...")
    employees = await seedEmployees()
  }

  // 1.5. Clear existing attendance data
  await WorkingShift.deleteMany({})
  await ShiftSchedule.deleteMany({})
  await HolidayCalendar.deleteMany({})
  await EmployeeShift.deleteMany({})
  await AttendanceRecord.deleteMany({})
  await Application.deleteMany({})

  const creator = employees.find(e => e.role === "admin" || e.role === "hr_manager") || employees[0]
  const hrManager = employees.find(e => e.role === "hr_manager") || creator

  // 2. Seed Holidays
  const holidaysToInsert = HOLIDAYS_DATA.map(h => {
    const d = new Date()
    d.setDate(d.getDate() + h.offsetDays)
    d.setHours(0, 0, 0, 0)
    return {
      name: h.name,
      type: h.type,
      date: d,
      createdBy: creator._id,
    }
  })
  await HolidayCalendar.insertMany(holidaysToInsert)
  console.log(`✅ Seeded ${holidaysToInsert.length} holidays`)

  // 3. Seed WorkingShifts
  const shiftsToInsert = SHIFTS_DATA.map(shift => ({
    ...shift,
    createdBy: creator._id,
  }))
  const createdShifts = await WorkingShift.insertMany(shiftsToInsert)
  console.log(`✅ Seeded ${createdShifts.length} working shifts`)

  // 4. Seed Employee Schedules and Records
  let shiftCount = 0
  let recordCount = 0
  let appCount = 0

  // Pre-process holidays into a map by date string for easy lookup
  const holidayMap = new Map<string, typeof holidaysToInsert[0]>()
  holidaysToInsert.forEach(h => {
    holidayMap.set(h.date.toDateString(), h)
  })

  for (const emp of employees) {
    const shift = faker.helpers.arrayElement(createdShifts)
    
    // Create a schedule for this employee
    const validFrom = new Date()
    validFrom.setDate(validFrom.getDate() - 30) // valid from 30 days ago
    validFrom.setHours(0, 0, 0, 0)

    const schedule = await ShiftSchedule.create({
      employeeId: emp._id,
      weekdays: {
        mon: shift._id,
        tue: shift._id,
        wed: shift._id,
        thu: shift._id,
        fri: shift._id,
        sat: null, // Weekend off
        sun: null, // Weekend off
      },
      validFrom,
      validTo: null,
      createdBy: creator._id,
    })

    // Simulate past 10 days of work
    for (let i = 1; i <= 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const weekdayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
      const weekday = weekdayNames[date.getDay()] as keyof typeof schedule.weekdays
      const assignedShiftId = schedule.weekdays[weekday]
      
      // If employee doesn't have a shift on this day, skip
      if (!assignedShiftId) continue
      
      const holiday = holidayMap.get(date.toDateString())
      
      // If it's a national holiday, skip generating shift entirely (per schema rules)
      if (holiday && holiday.type === "national") {
        continue
      }
      
      // If it's a company holiday, generate a shift with "holiday_pending" status
      if (holiday && holiday.type === "company") {
        await EmployeeShift.create({
          employeeId: emp._id,
          shiftId: assignedShiftId,
          assignedDate: date,
          scheduleId: schedule._id,
          status: "holiday_pending",
          isOverride: false,
          createdBy: creator._id,
        })
        shiftCount++
        continue // No attendance record for pending holidays
      }

      // Normal workday shift
      const employeeShift = await EmployeeShift.create({
        employeeId: emp._id,
        shiftId: assignedShiftId,
        assignedDate: date,
        scheduleId: schedule._id,
        status: "confirmed",
        isOverride: false,
        createdBy: creator._id,
      })
      shiftCount++

      // Parse shift times
      const [startHour, startMin] = shift.startTime.split(":").map(Number)
      const [endHour, endMin] = shift.endTime.split(":").map(Number)

      const fingerprintIn = new Date(date)
      fingerprintIn.setHours(startHour, startMin + faker.number.int({ min: -10, max: 10 }), 0, 0)
      
      const fingerprintOut = new Date(date)
      fingerprintOut.setHours(endHour, endMin + faker.number.int({ min: -5, max: 30 }), 0, 0)

      // Calculate minutes
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const inMinutes = fingerprintIn.getHours() * 60 + fingerprintIn.getMinutes()
      const outMinutes = fingerprintOut.getHours() * 60 + fingerprintOut.getMinutes()

      const lateMinutes = Math.max(0, inMinutes - startMinutes)
      const earlyLeaveMinutes = Math.max(0, endMinutes - outMinutes)
      const overtimeMinutes = Math.max(0, outMinutes - endMinutes)
      const totalWorkMinutes = outMinutes - inMinutes

      // Status
      const status = lateMinutes > shift.gracePeriodMinutes! ? "late" : "on_time"

      // Create attendance record with checkIn and checkOut
      await AttendanceRecord.create({
        employeeId: emp._id,
        employeeShiftId: employeeShift._id,
        shiftId: shift._id,
        date: date,
        checkIn: {
          at: fingerprintIn,
          location: generateAttendanceLocation(),
        },
        checkOut: {
          at: fingerprintOut,
          location: generateAttendanceLocation(),
        },
        status,
        lateMinutes,
        earlyLeaveMinutes,
        overtimeMinutes,
        totalWorkMinutes,
      })
      recordCount++

      // Seed an OT application for one specific past shift
      if (i === 1) {
        await Application.create({
          employeeId: emp._id,
          type: "overtime",
          status: "approved",
          startDate: fingerprintIn,
          endDate: fingerprintOut,
          employeeShiftId: employeeShift._id,
          workingShiftId: shift._id,
          reason: "Urgent project deadline",
          approvedBy: hrManager._id,
          approvedAt: new Date(),
        })
        appCount++
      }
    }

    // Seed a leave application for the future
    const appStartDate = faker.date.soon({ days: 5 })
    appStartDate.setHours(0, 0, 0, 0)
    const appEndDate = new Date(appStartDate)
    appEndDate.setDate(appEndDate.getDate() + faker.number.int({ min: 1, max: 3 }))

    await Application.create({
      employeeId: emp._id,
      type: "leave",
      status: "approved",
      reason: faker.helpers.arrayElement(LEAVE_REASONS),
      startDate: appStartDate,
      endDate: appEndDate,
      workingShiftId: shift._id, // Link to the shift template the employee usually works
      regimeType: "paid",
      approvedBy: hrManager._id,
      approvedAt: new Date(),
    })
    appCount++
  }

  console.log(`✅ Seeded ${employees.length} schedules, ${shiftCount} employee shifts, ${recordCount} attendance records, and ${appCount} applications`)
  return { shifts: createdShifts }
}
