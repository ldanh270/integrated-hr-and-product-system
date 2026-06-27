import { Resend } from "resend";
import { ENVIRONMENT } from "../configs/system/server.config";



export class EmailService {
  private resend: Resend;
  private fromEmail = "no-reply@hrp.domain.com"; // Configure this to an actual verified domain

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    if (process.env.NODE_ENV === "test" || !process.env.RESEND_API_KEY) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        text: content,
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
    const text = `Hello ${candidateName},\n\nWe are excited to offer you a position at our company.\n\nPlease review your offer details by opening the link below:\n${offerLink}\n\nBest regards,\nHR Team`;
    return this.sendEmail(candidateEmail, "Job Offer", text);
  }

  async sendInterviewInvitation(candidateEmail: string, candidateName: string, interviewDetails: string) {
    const text = `Hello ${candidateName},\n\nWe would like to invite you to an interview.\n\nDetails: ${interviewDetails}\n\nBest regards,\nHR Team`;
    return this.sendEmail(candidateEmail, "Interview Invitation", text);
  }
}

export const emailService = new EmailService();
