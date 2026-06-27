import { OFFER_STATUS } from "@/configs/entities/recruitment.config";
import cron from "node-cron";
import { prisma } from "../libs/database";
import { JobApplicationStatus } from "@prisma/client";
import { OnboardingService } from "./onboarding.service";
import { JobApplicationRepository } from "../repositories/job-application.repository";
import { OfferRepository } from "../repositories/offer.repository";
import { BgcOverallStatus } from "@prisma/client";
import { JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";


export class SchedulerService {
  private onboardingService: OnboardingService;

  constructor() {
    this.onboardingService = new OnboardingService(
      new JobApplicationRepository(),
      new OfferRepository()
    );
  }

  public init() {
    // Run every day at 00:00 to check for day-1 onboarding candidates
    cron.schedule("0 0 * * *", async () => {
      console.log("[Scheduler] Running daily checks...");
      await this.checkDayOneOnboarding();
    });
  }

  /**
   * Automatically convert pending_onboarding candidates to hired
   * if today is their start date (from the accepted offer)
   */
  private async checkDayOneOnboarding() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const applications = await prisma.jobApplication.findMany({
        where: {
          status: JOB_APPLICATION_STATUS.PENDING_ONBOARDING,
        },
        include: {
          offers: {
            where: { status: OFFER_STATUS.ACCEPTED },
            orderBy: { version: "desc" },
            take: 1
          }
        }
      });

      let convertedCount = 0;
      for (const app of applications) {
        if (app.offers && app.offers.length > 0) {
          const offer = app.offers[0];
          const startDate = new Date(offer.startDate);
          startDate.setHours(0, 0, 0, 0);

          if (startDate.getTime() <= today.getTime()) {
            await this.onboardingService.convertCandidateToEmployee(app.id, {
              startDate: offer.startDate,
              position: offer.position,
            });
            convertedCount++;
          }
        }
      }
      
      console.log(`[Scheduler] Converted ${convertedCount} candidates to employees.`);
    } catch (err) {
      console.error("[Scheduler] Error in checkDayOneOnboarding:", err);
    }
  }
}
