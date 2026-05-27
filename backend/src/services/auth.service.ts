import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import ActivityLog from "@/entities/ActivityLog.ts"
import Employee from "@/entities/Employee.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

export class AuthService {
  async login(data: any, ipAddress?: string) {
    const { email, password } = data

    if (!email || !password) {
      throw new AppError("Email and password are required", HttpStatusCode.BAD_REQUEST, "Authentication")
    }

    const employee = await Employee.findOne({ email }).select("+passwordHash")

    if (!employee) {
      // Log failed attempt for non-existent email if needed, but here we just throw generic error for security
      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // 1. Status Check
    if (employee.status !== "active") {
      throw new AppError("Account is disabled or inactive", HttpStatusCode.FORBIDDEN, "Authentication")
    }

    // 2. Lock Check
    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      throw new AppError(
        `Account is temporarily locked. Try again after ${employee.lockedUntil.toLocaleTimeString()}`,
        HttpStatusCode.FORBIDDEN,
        "Authentication",
      )
    }

    // 3. Password Verification
    const isPasswordMatch = await HashUtil.compare(password, employee.passwordHash)

    if (!isPasswordMatch) {
      employee.failedLoginCount = (employee.failedLoginCount || 0) + 1

      if (employee.failedLoginCount >= 5) {
        employee.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 mins
      }

      await employee.save()

      // Log failed-login
      await ActivityLog.create({
        empId: employee._id,
        actionType: "failed-login",
        ipAddress,
        timestamp: new Date(),
      })

      throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED, "Authentication")
    }

    // 4. On Success
    employee.failedLoginCount = 0
    employee.lockedUntil = undefined
    employee.lastLoginAt = new Date()
    await employee.save()

    // Log login
    await ActivityLog.create({
      empId: employee._id,
      actionType: "login",
      ipAddress,
      timestamp: new Date(),
    })

    const token = JwtUtil.generateToken({
      empId: employee._id,
      email: employee.email,
      role: employee.role,
    })

    return {
      token,
      employee: {
        id: employee._id,
        email: employee.email,
        fullName: employee.fullName,
        role: employee.role,
      },
    }
  }

  async logout(empId: string, ipAddress?: string) {
    // Log logout activity
    await ActivityLog.create({
      empId,
      actionType: "logout",
      ipAddress,
      timestamp: new Date(),
    })

    return { message: "Logged out successfully" }
  }
}
