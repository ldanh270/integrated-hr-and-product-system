import { Resend } from "resend"
import { ENV_ENVIRONMENT, ENVIRONMENT } from "@/configs/system/server.config.ts"


/**
 * EmailUtil provides functionality for sending emails using Resend SDK.
 * Adheres to the requirement of being a simple reusable utility.
 */
export class EmailUtil {
  /**
   * Sends a password reset email to the specified user using Resend.
   * Returns the Resend response for debugging purposes.
   */
  static async sendResetPasswordEmail(to: string, token: string): Promise<any> {
    const apiKey = process.env.RESEND_API_KEY
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev"

    const resetUrl = `${clientUrl}/reset-password?token=${token}`

    if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
      console.log(`[DEBUG] Email to: ${to}`)
      console.log(`[DEBUG] Generated Token: ${token}`)
      console.log(`[DEBUG] Reset URL: ${resetUrl}`)
    }

    // Fallback: If Resend API key is missing, log reset link to console for development
    if (!apiKey) {
      const mockResult = {
        mocked: true,
        to,
        token,
        resetUrl,
        message: "RESEND_API_KEY missing, email was mocked to console.",
      }
      console.log("--- EMAIL MOCK (RESEND_API_KEY MISSING) ---")
      console.log(JSON.stringify(mockResult, null, 2))
      console.log("-----------------------------------------")
      return mockResult
    }

    try {
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from: `HRP Management System <${from}>`,
        to,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your HRP Management System account.</p>
            <p>Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in <strong>15 minutes</strong>.</p>
            <p style="color: #777; font-size: 14px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Alternatively, copy and paste this link into your browser:</p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          </div>
        `,
      })

      if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
        console.log("Resend response:", JSON.stringify(result, null, 2))
      }

      return result
    } catch (error) {
      console.error("Failed to send email via Resend:", error)
      throw error // Re-throw to be caught in Service layer
    }
  }
}
