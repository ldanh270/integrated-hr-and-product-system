import { Resend } from "resend"

/**
 * EmailUtil provides functionality for sending emails using Resend SDK.
 * Adheres to the requirement of being a simple reusable utility.
 */
export class EmailUtil {
  /**
   * Sends a password reset email to the specified user using Resend.
   */
  static async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev"

    const resetUrl = `${clientUrl}/reset-password?token=${token}`

    // Fallback: If Resend API key is missing, log reset link to console for development
    if (!apiKey) {
      console.log("--- EMAIL MOCK (RESEND_API_KEY MISSING) ---")
      console.log(`To: ${to}`)
      console.log(`Subject: Password Reset Request`)
      console.log(`Message: Please reset your password by clicking here: ${resetUrl}`)
      console.log("Note: This link will expire in 15 minutes.")
      console.log("-----------------------------------------")
      return
    }

    try {
      const resend = new Resend(apiKey)

      await resend.emails.send({
        from: `HR Management System <${from}>`,
        to,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your HR Management System account.</p>
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
    } catch (error) {
      console.error("Failed to send email via Resend:", error)
    }
  }
}
