import { v2 as cloudinary } from "cloudinary"

/**
 * Cloudinary configuration
 * Reads credentials from environment variables.
 * Prints a warning if missing at startup, but does not crash the server.
 */
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

const isConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  })
} else {
  console.warn(
    "⚠️  WARNING: Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not set in .env. Avatar upload will fail.",
  )
}

/**
 * Asserts that Cloudinary is fully configured. Throws an AppError if not.
 */
export function assertCloudinaryConfigured() {
  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
    )
  }
}

export { cloudinary }
