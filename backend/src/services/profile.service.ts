import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import type {
  IProfileRepository,
  IProfileService,
  ProfileDto,
  ProfileEmployeeDocument,
  UpdateProfileDto,
} from "@/types/profile.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { cloudinary, assertCloudinaryConfigured } from "@/configs/cloudinary.config.ts"
import { Readable } from "stream"
import { HashUtil } from "@/utils/hash.util.ts"

/**
 * Maps a Mongoose employee document to a clean ProfileDto
 * Centralizes the field-picking logic so controllers stay thin
 */
function toProfileDto(emp: ProfileEmployeeDocument): ProfileDto {
  return {
    id: emp._id.toString(),
    fullName: emp.fullName,
    username: emp.username,
    email: emp.email,
    phone: emp.phone ?? null,
    dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.toISOString().split("T")[0] : null,
    nationalId: emp.nationalId ?? null,
    address: emp.address ?? null,
    position: emp.position ?? null,
    role: emp.role,
    employeeType: emp.employeeType,
    status: emp.status,
    startDate: emp.startDate ? emp.startDate.toISOString().split("T")[0] : null,
    avatar: {
      url: emp.avatar?.url ?? null,
      id: emp.avatar?.id ?? null,
    },
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  }
}

/**
 * Uploads a Buffer to Cloudinary using a stream (avoids temp files)
 * Returns the secure_url and public_id from Cloudinary response
 */
async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  publicId?: string,
): Promise<{ url: string; id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hrp/avatars",
        resource_type: "image",
        public_id: publicId,
        overwrite: true,
        format: "webp",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"))
        resolve({ url: result.secure_url, id: result.public_id })
      },
    )

    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

/**
 * ProfileService implements business logic for profile read, update, and avatar upload
 * Depends on IProfileRepository abstraction (Dependency Injection)
 */
export class ProfileService implements IProfileService {
  constructor(private repo: IProfileRepository) {}

  /**
   * Retrieves the authenticated user's own profile
   */
  async getMyProfile(empId: string): Promise<ProfileDto> {
    const employee = await this.repo.findById(empId)

    if (!employee) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, "ProfileService")
    }

    return toProfileDto(employee)
  }

  /**
   * Updates editable profile fields for the authenticated user
   */
  async updateMyProfile(empId: string, data: UpdateProfileDto): Promise<ProfileDto> {
    const updated = await this.repo.updateProfile(empId, data)

    if (!updated) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, "ProfileService")
    }

    return toProfileDto(updated)
  }

  /**
   * Uploads a new avatar image to Cloudinary and saves the result to the employee record
   * Old Cloudinary image is deleted if a previous public_id exists
   */
  async uploadAvatar(empId: string, fileBuffer: Buffer, mimeType: string): Promise<ProfileDto> {
    // Check if Cloudinary is configured
    try {
      assertCloudinaryConfigured()
    } catch (err: any) {
      throw new AppError(err.message, HttpStatusCode.BAD_REQUEST, "ProfileService")
    }

    // Fetch current profile to get old avatar id for cleanup
    const current = await this.repo.findById(empId)

    if (!current) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, "ProfileService")
    }

    // Delete old Cloudinary asset if it exists
    if (current.avatar?.id) {
      await cloudinary.uploader.destroy(current.avatar.id).catch(() => {
        // Non-blocking: log but don't fail the upload
        console.warn(`[ProfileService] Could not delete old avatar: ${current.avatar?.id}`)
      })
    }

    // Upload new image
    const publicId = `avatar_${empId}`
    const { url, id } = await uploadToCloudinary(fileBuffer, mimeType, publicId)

    // Persist updated avatar reference
    const updated = await this.repo.updateAvatar(empId, { url, id })

    if (!updated) {
      throw new AppError("Failed to save avatar", HttpStatusCode.INTERNAL_SERVER_ERROR, "ProfileService")
    }

    return toProfileDto(updated)
  }

  /**
   * Updates the password for the authenticated user after verifying the current (old) password
   */
  async changePassword(empId: string, oldPass: string, newPass: string): Promise<void> {
    const employee = await this.repo.findAuthById(empId)

    if (!employee) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, "ProfileService")
    }

    // Verify current password
    const isMatch = await HashUtil.compare(oldPass, employee.passwordHash)
    if (!isMatch) {
      throw new AppError(
        "Mật khẩu hiện tại không chính xác",
        HttpStatusCode.BAD_REQUEST,
        "ProfileService",
        "INVALID_CURRENT_PASSWORD"
      )
    }

    // Hash and save new password
    employee.passwordHash = await HashUtil.hash(newPass)
    await employee.save()
  }
}
