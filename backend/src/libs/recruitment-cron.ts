import cron from "node-cron";
import { prisma } from "./database";
import { OFFER_STATUS, JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";
import { Role } from "@prisma/client";
import { HashUtil } from "../utils/hash.util";

/**
 * Cron job to automatically convert hired candidates into employees
 * on their start date.
 */
export const initRecruitmentCron = () => {
  // Run daily at midnight: '0 0 * * *'
  cron.schedule("0 0 * * *", async () => {
    console.log("[Recruitment Cron] Starting daily candidate to employee conversion process...");
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all offers that are accepted and start date is today or earlier,
      // and their application status is not yet HIRED (to prevent duplicates).
      // Since JobApplication is connected, we can check its status.
      const offersToConvert = await prisma.offer.findMany({
        where: {
          status: OFFER_STATUS.ACCEPTED,
          startDate: {
            lte: today,
          },
          application: {
            status: {
              not: JOB_APPLICATION_STATUS.HIRED,
            },
          },
        },
        include: {
          application: {
            include: {
              candidate: true,
            },
          },
        },
      });

      console.log(`[Recruitment Cron] Found ${offersToConvert.length} candidates to convert.`);

      let successCount = 0;
      let errorCount = 0;

      for (const offer of offersToConvert) {
        const candidate = offer.application.candidate;
        
        if (!candidate) {
          console.error(`[Recruitment Cron] No candidate found for offer ${offer.id}`);
          errorCount++;
          continue;
        }

        try {
          await prisma.$transaction(async (tx) => {
            // 1. Create employee
            // In a real system, you might want a default password generation logic
            const defaultPassword = "password123"; 
            const hashedPassword = await HashUtil.hash(defaultPassword);

            // Generate a unique username, e.g. based on email prefix
            const usernamePrefix = candidate.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
            let username = usernamePrefix;
            let counter = 1;
            
            // Basic conflict check, could be optimized
            while (await tx.employee.findFirst({ where: { username } })) {
              username = `${usernamePrefix}${counter}`;
              counter++;
            }

            await tx.employee.create({
              data: {
                fullName: candidate.fullName,
                email: candidate.email,
                phone: candidate.phone,
                username,
                passwordHash: hashedPassword,
                role: Role.employee,
                position: offer.position,
                startDate: offer.startDate,
                // Add any other mappings if needed
              },
            });

            // 2. Update application status to HIRED
            await tx.jobApplication.update({
              where: { id: offer.applicationId },
              data: { status: JOB_APPLICATION_STATUS.HIRED },
            });
            
            successCount++;
          });
        } catch (error) {
          console.error(`[Recruitment Cron] Failed to convert candidate ${candidate.id}:`, error);
          errorCount++;
        }
      }

      console.log(`[Recruitment Cron] Completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error("[Recruitment Cron] Error during conversion process:", error);
    }
  });
};
