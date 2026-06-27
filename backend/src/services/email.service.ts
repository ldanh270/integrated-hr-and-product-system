import { Resend } from "resend";
import { ENVIRONMENT } from "../configs/system/server.config";

export class EmailService {
  private resend: Resend;
  private fromEmail = "no-reply@hrp.domain.com"; // Configure this to an actual verified domain

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (process.env.NODE_ENV === "test" || !process.env.RESEND_API_KEY) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error("[EmailService] Failed to send email:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("[EmailService] Error sending email:", err);
      return false;
    }
  }

  async sendOfferEmail(candidateEmail: string, candidateName: string, offerLink: string) {
    const html = `
      <h2>Hello ${candidateName},</h2>
      <p>We are excited to offer you a position at our company.</p>
      <p>Please review your offer details by clicking the link below:</p>
      <a href="${offerLink}">View Offer</a>
      <p>Best regards,<br/>HR Team</p>
    `;
    return this.sendEmail(candidateEmail, "Job Offer", html);
  }

  async sendInterviewInvitation(candidateEmail: string, candidateName: string, interviewDetails: string) {
    const html = `
      <h2>Hello ${candidateName},</h2>
      <p>We would like to invite you to an interview.</p>
      <p>Details: ${interviewDetails}</p>
      <p>Best regards,<br/>HR Team</p>
    `;
    return this.sendEmail(candidateEmail, "Interview Invitation", html);
  }
}

export const emailService = new EmailService();
