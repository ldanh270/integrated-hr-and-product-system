import { config } from "dotenv"
config() // Load .env

// Import prisma that is properly configured with pg-adapter
import { prisma } from "./src/libs/database.ts"

async function main() {
  // Find first employee
  const emp = await prisma.employee.findFirst()
  if (!emp) return console.log("No employees found")

  // Find first working shift
  const shift = await prisma.workingShift.findFirst()
  if (!shift) return console.log("No WorkingShift found in DB. Please create one first.")

  // Target date (today)
  const targetDate = new Date()
  targetDate.setUTCHours(0, 0, 0, 0) // Normalize to midnight UTC

  // Upsert an EmployeeShift for today
  const empShift = await prisma.employeeShift.upsert({
    where: {
      employeeId_assignedDate: {
        employeeId: emp.id,
        assignedDate: targetDate,
      },
    },
    update: {}, // keep existing if it exists
    create: {
      employeeId: emp.id,
      shiftId: shift.id,
      assignedDate: targetDate,
      createdById: emp.id,
    },
  })

  console.log("\n=======================================================")
  console.log("🔥 ĐÃ TẠO CA LÀM VIỆC (EmployeeShift) THÀNH CÔNG 🔥")
  console.log("=======================================================")
  console.log("Employee ID:", emp.id)
  console.log("Working Shift ID:", shift.id)
  console.log("\n👉 DÙNG CÁC GIÁ TRỊ NÀY ĐỂ TEST TRONG POSTMAN:")
  console.log(`MY_SHIFT_ID   = ${empShift.id}`)
  console.log(`MY_SHIFT_DATE = ${targetDate.toISOString().split("T")[0]}`)
  console.log("=======================================================\n")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
