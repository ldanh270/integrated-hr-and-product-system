import { Resend } from "resend";
import { ENVIRONMENT } from "../configs/system/server.config";



/**
 * Service responsible for handling all email communications.
 * Uses the Resend API to dispatch transactional emails.
 */
export class EmailService {
  private resend: Resend;

  /**
   * The default sender email address.
   * TODO: Configure this to an actual verified domain in production.
   */
  private fromEmail = "no-reply@hrp.domain.com";

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Sends a generic email to a specified recipient.
   * If in the test environment or if RESEND_API_KEY is missing, it will mock the email sending.
   * 
   * @param to The recipient's email address.
   * @param subject The subject line of the email.
   * @param content The plain text body of the email.
   * @returns A boolean indicating whether the email was sent successfully.
   */
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

  /**
   * Sends a job offer email to a candidate containing a link to review their offer.
   * 
   * @param candidateEmail The candidate's email address.
   * @param candidateName The candidate's full name.
   * @param offerLink The URL where the candidate can view and accept their offer.
   * @returns A boolean indicating success or failure.
   */
  async sendOfferEmail(candidateEmail: string, candidateName: string, offerLink: string) {
    const text = `Hello ${candidateName},\n\nWe are excited to offer you a position at our company.\n\nPlease review your offer details by opening the link below:\n${offerLink}\n\nBest regards,\nHR Team`;
    return this.sendEmail(candidateEmail, "Job Offer", text);
  }

  /**
   * Sends an interview invitation email to a candidate with details about the interview.
   * 
   * @param candidateEmail The candidate's email address.
   * @param candidateName The candidate's full name.
   * @param interviewDetails Information regarding the interview schedule, link, or location.
   * @returns A boolean indicating success or failure.
   */
  async sendInterviewInvitation(candidateEmail: string, candidateName: string, interviewDetails: string) {
    const text = `Hello ${candidateName},\n\nWe would like to invite you to an interview.\n\nDetails: ${interviewDetails}\n\nBest regards,\nHR Team`;
    return this.sendEmail(candidateEmail, "Interview Invitation", text);
  }
}

export const emailService = new EmailService();
