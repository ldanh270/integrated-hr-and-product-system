import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"
import { faker } from "@faker-js/faker"
import {
  REQUISITION_STATUS,
  REQUISITION_PRIORITY,
  POSTING_STATUS,
  RECRUITMENT_CHANNEL,
  RECRUITMENT_APPLICATION_STATUS,
  RECRUITMENT_SOURCE,
  INTERVIEW_FORMAT,
  INTERVIEW_ROUND_STATUS,
  INTERVIEW_RESULT,
  BGC_GROUP,
  BGC_STATUS,
  RECRUITMENT_OFFER_STATUS,
} from "@/configs/entities/recruitment.config.ts"
import { EMPLOYEE_TYPE } from "@/configs/entities/employee.config.ts"

export class RecruitmentSeeder implements ISeeder {
  readonly name = "Recruitment"
  readonly order = 19

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding recruitment module...")

    const employees = context.employees
    const adminId = context.adminId

    if (employees.length === 0 || !adminId) {
      throw new Error("Missing required employees or admin context for recruitment seeding.")
    }

    // Get positions
    const devPos = await prisma.position.findUnique({ where: { code: "developer" } })
    const testerPos = await prisma.position.findUnique({ where: { code: "tester" } })
    const pmPos = await prisma.position.findUnique({ where: { code: "pm" } })
    const hrPos = await prisma.position.findUnique({ where: { code: "hr" } })

    // Find recruiter / hr manager to assign applications
    const hrManager = employees.find((e) => e.username === "hr_manager") || employees[0]
    const technicalInterviewer = employees.find((e) => e.username === "employee") || employees[0]
    const pmInterviewer = employees.find((e) => e.username === "team_leader") || employees[0]

    // 1. Create Job Requisitions
    const requisitionsData = [
      {
        code: "REQ-2026-001",
        title: "Senior NodeJS Developer",
        department: "Engineering",
        positionLevel: "Senior",
        employmentType: EMPLOYEE_TYPE.FULL_TIME,
        salaryMin: 30000000,
        salaryMax: 50000000,
        headcount: 2,
        priority: REQUISITION_PRIORITY.HIGH,
        status: REQUISITION_STATUS.APPROVED,
        reason: "Expansion of core services team",
        targetHireDate: new Date("2026-09-01"),
        requestedById: hrManager.id,
        approvedById: adminId,
        approvedAt: new Date(),
        positionId: devPos?.id,
      },
      {
        code: "REQ-2026-002",
        title: "QA Automation Engineer",
        department: "QA",
        positionLevel: "Middle",
        employmentType: EMPLOYEE_TYPE.FULL_TIME,
        salaryMin: 20000000,
        salaryMax: 35000000,
        headcount: 1,
        priority: REQUISITION_PRIORITY.MEDIUM,
        status: REQUISITION_STATUS.APPROVED,
        reason: "Automation coverage enhancement",
        targetHireDate: new Date("2026-09-15"),
        requestedById: hrManager.id,
        approvedById: adminId,
        approvedAt: new Date(),
        positionId: testerPos?.id,
      },
      {
        code: "REQ-2026-003",
        title: "Technical Project Manager",
        department: "PMO",
        positionLevel: "Lead",
        employmentType: EMPLOYEE_TYPE.FULL_TIME,
        salaryMin: 40000000,
        salaryMax: 65000000,
        headcount: 1,
        priority: REQUISITION_PRIORITY.URGENT,
        status: REQUISITION_STATUS.PENDING_APPROVAL,
        reason: "New client project onboarding",
        targetHireDate: new Date("2026-08-15"),
        requestedById: pmInterviewer.id,
        positionId: pmPos?.id,
      },
      {
        code: "REQ-2026-004",
        title: "HR Generalist",
        department: "HR",
        positionLevel: "Junior",
        employmentType: EMPLOYEE_TYPE.FULL_TIME,
        salaryMin: 12000000,
        salaryMax: 18000000,
        headcount: 1,
        priority: REQUISITION_PRIORITY.LOW,
        status: REQUISITION_STATUS.DRAFT,
        reason: "Team workload balancing",
        requestedById: hrManager.id,
        positionId: hrPos?.id,
      },
      {
        code: "REQ-2026-005",
        title: "Junior Frontend Developer",
        department: "Engineering",
        positionLevel: "Junior",
        employmentType: EMPLOYEE_TYPE.FULL_TIME,
        salaryMin: 15000000,
        salaryMax: 22000000,
        headcount: 2,
        priority: REQUISITION_PRIORITY.MEDIUM,
        status: REQUISITION_STATUS.APPROVED,
        reason: "Support new web portal development",
        targetHireDate: new Date("2026-10-01"),
        requestedById: hrManager.id,
        approvedById: adminId,
        approvedAt: new Date(),
        positionId: devPos?.id,
      },
    ]

    const createdReqs = []
    for (const req of requisitionsData) {
      const created = await prisma.jobRequisition.upsert({
        where: { code: req.code },
        update: {},
        create: req,
      })
      createdReqs.push(created)
    }
    console.log(`    Seeded ${createdReqs.length} Job Requisitions.`)

    const nodejsReq = createdReqs.find((r) => r.code === "REQ-2026-001")!
    const qaReq = createdReqs.find((r) => r.code === "REQ-2026-002")!
    const frontendReq = createdReqs.find((r) => r.code === "REQ-2026-005")!

    // 2. Create Job Descriptions for Approved Requisitions
    const jdsToCreate = [
      {
        requisitionId: nodejsReq.id,
        title: "Senior NodeJS Developer",
        summary: "We are looking for a Senior NodeJS Developer to design and build scalable microservices.",
        responsibilities: "Write clean TS code; Design high-performance DB queries; Mentor junior devs.",
        requirements: "5+ years backend dev; Extensive experience with Express/Fastify/NestJS; Strong SQL skills.",
        benefits: "Competitive salary; 13th month bonus; Healthcare package.",
        salaryMin: 30000000,
        salaryMax: 50000000,
      },
      {
        requisitionId: qaReq.id,
        title: "QA Automation Engineer",
        summary: "Join us to shape and run our automated testing frameworks using Playwright/Cypress.",
        responsibilities: "Create test automation scripts; Perform API/UI testing; Integrate testing in CI/CD pipeline.",
        requirements: "3+ years automated test development; Experience in Playwright or Cypress; Strong JS/TS base.",
        benefits: "Hybrid working; Free lunch & gym; Annual training budget.",
        salaryMin: 20000000,
        salaryMax: 35000000,
      },
      {
        requisitionId: frontendReq.id,
        title: "Junior Frontend Developer",
        summary: "Looking for an energetic junior dev interested in building premium UI using React 19.",
        responsibilities: "Collaborate on feature design; Build beautiful responsive UI components; Refactor code.",
        requirements: "1+ years experience in React; Good HTML/CSS/JS knowledge; Tailwind CSS experience is a plus.",
        benefits: "Intensive training; High growth opportunities; Fully-equipped workspace.",
        salaryMin: 15000000,
        salaryMax: 22000000,
      },
    ]

    const createdJds = []
    for (const jd of jdsToCreate) {
      const existing = await prisma.jobDescription.findFirst({
        where: { requisitionId: jd.requisitionId },
      })
      if (!existing) {
        const created = await prisma.jobDescription.create({ data: jd })
        createdJds.push(created)
      } else {
        createdJds.push(existing)
      }
    }
    console.log(`    Seeded ${createdJds.length} Job Descriptions.`)

    const nodejsJd = createdJds.find((j) => j.title.includes("NodeJS"))!
    const qaJd = createdJds.find((j) => j.title.includes("QA"))!
    const frontendJd = createdJds.find((j) => j.title.includes("Frontend"))!

    // 3. Create Job Postings
    const postingsToCreate = [
      {
        jobDescriptionId: nodejsJd.id,
        channel: RECRUITMENT_CHANNEL.LINKEDIN,
        source: RECRUITMENT_SOURCE.LINKEDIN,
        sourceCode: "PUB-LN-001",
        status: POSTING_STATUS.OPEN,
        postingUrl: "https://www.linkedin.com/jobs/view/1001",
      },
      {
        jobDescriptionId: nodejsJd.id,
        channel: RECRUITMENT_CHANNEL.COMPANY_WEBSITE,
        source: RECRUITMENT_SOURCE.COMPANY_WEBSITE,
        sourceCode: "PUB-CW-001",
        status: POSTING_STATUS.OPEN,
        postingUrl: "https://company.com/careers/senior-nodejs",
      },
      {
        jobDescriptionId: qaJd.id,
        channel: RECRUITMENT_CHANNEL.FACEBOOK,
        source: RECRUITMENT_SOURCE.FACEBOOK,
        sourceCode: "PUB-FB-002",
        status: POSTING_STATUS.OPEN,
        postingUrl: "https://facebook.com/company/jobs/qa-auto",
      },
      {
        jobDescriptionId: frontendJd.id,
        channel: RECRUITMENT_CHANNEL.LINKEDIN,
        source: RECRUITMENT_SOURCE.LINKEDIN,
        sourceCode: "PUB-LN-003",
        status: POSTING_STATUS.OPEN,
        postingUrl: "https://www.linkedin.com/jobs/view/1003",
      },
    ]

    const createdPostings = []
    for (const post of postingsToCreate) {
      const existing = await prisma.jobPosting.findUnique({
        where: { sourceCode: post.sourceCode },
      })
      if (!existing) {
        const created = await prisma.jobPosting.create({ data: post })
        createdPostings.push(created)
      } else {
        createdPostings.push(existing)
      }
    }
    console.log(`    Seeded ${createdPostings.length} Job Postings.`)

    const nodejsLinkedinPost = createdPostings.find((p) => p.sourceCode === "PUB-LN-001")!
    const qaFacebookPost = createdPostings.find((p) => p.sourceCode === "PUB-FB-002")!
    const frontendLinkedinPost = createdPostings.find((p) => p.sourceCode === "PUB-LN-003")!

    // 4. Create Candidates
    const candidatesData = [
      {
        fullName: "Nguyen Van Linh",
        email: "linh.nguyen@example.com",
        phone: "0901234567",
        dateOfBirth: new Date("1995-04-12"),
        address: "District 1, HCMC",
        source: RECRUITMENT_SOURCE.LINKEDIN,
        linkedinUrl: "https://linkedin.com/in/linhnguyen",
        cvUrl: "https://company-cvs.s3.amazonaws.com/linh-nguyen.pdf",
      },
      {
        fullName: "Tran Thi Mai",
        email: "mai.tran@example.com",
        phone: "0912345678",
        dateOfBirth: new Date("1997-08-25"),
        address: "Son Tra, Da Nang",
        source: RECRUITMENT_SOURCE.FACEBOOK,
        cvUrl: "https://company-cvs.s3.amazonaws.com/mai-tran.pdf",
      },
      {
        fullName: "Le Hoang Nam",
        email: "nam.le@example.com",
        phone: "0923456789",
        dateOfBirth: new Date("1996-01-15"),
        address: "Cau Giay, Hanoi",
        source: RECRUITMENT_SOURCE.REFERRAL,
        linkedinUrl: "https://linkedin.com/in/namle",
        cvUrl: "https://company-cvs.s3.amazonaws.com/nam-le.pdf",
      },
      {
        fullName: "Pham Minh Duc",
        email: "duc.pham@example.com",
        phone: "0934567890",
        dateOfBirth: new Date("1994-11-30"),
        address: "Ngu Hanh Son, Da Nang",
        source: RECRUITMENT_SOURCE.WEBSITE,
        linkedinUrl: "https://linkedin.com/in/ducpham",
        cvUrl: "https://company-cvs.s3.amazonaws.com/duc-pham.pdf",
      },
      {
        fullName: "Hoang Quoc Viet",
        email: "viet.hoang@example.com",
        phone: "0945678901",
        dateOfBirth: new Date("1998-05-18"),
        address: "Binh Thanh, HCMC",
        source: RECRUITMENT_SOURCE.LINKEDIN,
        cvUrl: "https://company-cvs.s3.amazonaws.com/viet-hoang.pdf",
      },
      {
        fullName: "Vu Thi Lan",
        email: "lan.vu@example.com",
        phone: "0956789012",
        dateOfBirth: new Date("1999-10-05"),
        address: "Thanh Xuan, Hanoi",
        source: RECRUITMENT_SOURCE.WEBSITE,
        cvUrl: "https://company-cvs.s3.amazonaws.com/lan-vu.pdf",
      },
    ]

    const createdCandidates = []
    for (const cand of candidatesData) {
      const created = await prisma.candidate.upsert({
        where: { email: cand.email },
        update: {},
        create: cand,
      })
      createdCandidates.push(created)
    }
    console.log(`    Seeded ${createdCandidates.length} Candidates.`)

    // Extract candidates
    const linhCandidate = createdCandidates.find((c) => c.email.includes("linh"))!
    const maiCandidate = createdCandidates.find((c) => c.email.includes("mai"))!
    const namCandidate = createdCandidates.find((c) => c.email.includes("nam"))!
    const ducCandidate = createdCandidates.find((c) => c.email.includes("duc"))!
    const vietCandidate = createdCandidates.find((c) => c.email.includes("viet"))!
    const lanCandidate = createdCandidates.find((c) => c.email.includes("lan"))!

    // 5. Create Applications
    const applicationsData = [
      {
        requisitionId: nodejsReq.id,
        candidateId: linhCandidate.id,
        jobDescriptionId: nodejsJd.id,
        postingId: nodejsLinkedinPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
        source: RECRUITMENT_SOURCE.LINKEDIN,
        assignedToId: hrManager.id,
      },
      {
        requisitionId: qaReq.id,
        candidateId: maiCandidate.id,
        jobDescriptionId: qaJd.id,
        postingId: qaFacebookPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.HIRED,
        source: RECRUITMENT_SOURCE.FACEBOOK,
        assignedToId: hrManager.id,
        hiredAt: new Date(),
      },
      {
        requisitionId: nodejsReq.id,
        candidateId: namCandidate.id,
        jobDescriptionId: nodejsJd.id,
        postingId: nodejsLinkedinPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
        source: RECRUITMENT_SOURCE.LINKEDIN,
        assignedToId: hrManager.id,
      },
      {
        requisitionId: frontendReq.id,
        candidateId: ducCandidate.id,
        jobDescriptionId: frontendJd.id,
        postingId: frontendLinkedinPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.NEW,
        source: RECRUITMENT_SOURCE.LINKEDIN,
        assignedToId: hrManager.id,
      },
      {
        requisitionId: frontendReq.id,
        candidateId: vietCandidate.id,
        jobDescriptionId: frontendJd.id,
        postingId: frontendLinkedinPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.REJECTED,
        rejectReason: "Lack of commercial React project experience",
        source: RECRUITMENT_SOURCE.LINKEDIN,
        assignedToId: hrManager.id,
      },
      {
        requisitionId: qaReq.id,
        candidateId: lanCandidate.id,
        jobDescriptionId: qaJd.id,
        postingId: qaFacebookPost.id,
        status: RECRUITMENT_APPLICATION_STATUS.REVIEWING,
        source: RECRUITMENT_SOURCE.WEBSITE,
        assignedToId: hrManager.id,
      },
    ]

    const createdApps = []
    for (const app of applicationsData) {
      const existing = await prisma.recruitmentApplication.findFirst({
        where: { requisitionId: app.requisitionId, candidateId: app.candidateId },
      })
      if (!existing) {
        const created = await prisma.recruitmentApplication.create({ data: app })
        createdApps.push(created)
      } else {
        createdApps.push(existing)
      }
    }
    console.log(`    Seeded ${createdApps.length} Recruitment Applications.`)

    const linhApp = createdApps.find((a) => a.candidateId === linhCandidate.id)!
    const maiApp = createdApps.find((a) => a.candidateId === maiCandidate.id)!
    const namApp = createdApps.find((a) => a.candidateId === namCandidate.id)!

    // 6. Create Interview Rounds
    // Linh is interviewing: Round 1 (Completed, Pass), Round 2 (Scheduled)
    const interviewRounds = [
      {
        applicationId: linhApp.id,
        roundNumber: 1,
        title: "Technical Coding Round",
        format: INTERVIEW_FORMAT.VIDEO_CALL,
        scheduledAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
        durationMinutes: 60,
        meetingLink: "https://zoom.us/j/123456789",
        status: INTERVIEW_ROUND_STATUS.COMPLETED,
        result: INTERVIEW_RESULT.PASS,
        interviewerIds: [technicalInterviewer.id],
        feedback: "Strong core JavaScript knowledge, solved algorithmic question easily.",
      },
      {
        applicationId: linhApp.id,
        roundNumber: 2,
        title: "Manager Culture Fit",
        format: INTERVIEW_FORMAT.VIDEO_CALL,
        scheduledAt: new Date(Date.now() + 2 * 86400000), // 2 days from now
        durationMinutes: 45,
        meetingLink: "https://zoom.us/j/987654321",
        status: INTERVIEW_ROUND_STATUS.SCHEDULED,
        result: INTERVIEW_RESULT.PENDING,
        interviewerIds: [pmInterviewer.id],
      },
    ]

    const createdRounds = []
    for (const round of interviewRounds) {
      const existing = await prisma.interviewRound.findFirst({
        where: { applicationId: round.applicationId, roundNumber: round.roundNumber },
      })
      if (!existing) {
        const created = await prisma.interviewRound.create({ data: round })
        createdRounds.push(created)
      } else {
        createdRounds.push(existing)
      }
    }
    console.log(`    Seeded ${createdRounds.length} Interview Rounds.`)

    const codingRound = createdRounds.find((r) => r.roundNumber === 1 && r.applicationId === linhApp.id)!

    // 7. Create Scorecards for completed interview round
    const scorecardData = {
      interviewId: codingRound.id,
      evaluatorId: technicalInterviewer.id,
      overallRating: 4,
      strengths: "Excellent coding capability, clean architecture practices, active communicator.",
      weaknesses: "Slightly less familiar with high-scale system designs.",
      recommendation: "Strong hire for the senior role.",
      scores: { coding: 5, communication: 4, problemSolving: 5, architecture: 3 },
      answers: { quest1: "Solved via hash map cleanly.", quest2: "Answered correctly regarding event loops." },
    }

    const existingScorecard = await prisma.scorecard.findUnique({
      where: {
        interviewId_evaluatorId: {
          interviewId: scorecardData.interviewId,
          evaluatorId: scorecardData.evaluatorId,
        },
      },
    })
    if (!existingScorecard) {
      await prisma.scorecard.create({ data: scorecardData })
      console.log("    Seeded 1 Scorecard.")
    }

    // 8. Create Recruitment Offers & Background Checks
    // Nam: Offer Sent (draft / sent)
    // Mai: Hired (accepted + BGC complete)
    const offerForNam = {
      applicationId: namApp.id,
      candidateId: namCandidate.id,
      currentVersion: 1,
      status: RECRUITMENT_OFFER_STATUS.SENT,
      offeredSalary: 38000000,
      currency: "VND",
      startDate: new Date("2026-09-01"),
      jobTitle: "Senior NodeJS Developer",
      department: "Engineering",
      employmentType: EMPLOYEE_TYPE.FULL_TIME,
      createdById: hrManager.id,
      sentAt: new Date(Date.now() - 1 * 86400000),
      notes: "Pending candidate's response.",
    }

    const offerForMai = {
      applicationId: maiApp.id,
      candidateId: maiCandidate.id,
      currentVersion: 2,
      status: RECRUITMENT_OFFER_STATUS.ACCEPTED,
      offeredSalary: 28000000,
      currency: "VND",
      startDate: new Date("2026-08-15"),
      jobTitle: "QA Automation Engineer",
      department: "QA",
      employmentType: EMPLOYEE_TYPE.FULL_TIME,
      createdById: hrManager.id,
      sentAt: new Date(Date.now() - 5 * 86400000),
      respondedAt: new Date(Date.now() - 2 * 86400000),
      responseNote: "Accept offer and excited to start!",
      notes: "Renegotiated from 25M to 28M. Approved by department manager.",
    }

    // Create Nam offer
    let createdNamOffer = await prisma.recruitmentOffer.findFirst({
      where: { applicationId: namApp.id },
    })
    if (!createdNamOffer) {
      createdNamOffer = await prisma.recruitmentOffer.create({ data: offerForNam })
      // Create version 1
      await prisma.offerVersion.create({
        data: {
          offerId: createdNamOffer.id,
          version: 1,
          salary: 38000000,
          currency: "VND",
          startDate: new Date("2026-09-01"),
          changeReason: "Initial version",
          createdById: hrManager.id,
        },
      })
    }

    // Create Mai offer
    let createdMaiOffer = await prisma.recruitmentOffer.findFirst({
      where: { applicationId: maiApp.id },
    })
    if (!createdMaiOffer) {
      createdMaiOffer = await prisma.recruitmentOffer.create({ data: offerForMai })
      // Create versions
      await prisma.offerVersion.createMany({
        data: [
          {
            offerId: createdMaiOffer.id,
            version: 1,
            salary: 25000000,
            currency: "VND",
            startDate: new Date("2026-08-15"),
            changeReason: "Initial offer",
            createdById: hrManager.id,
            createdAt: new Date(Date.now() - 5 * 86400000),
          },
          {
            offerId: createdMaiOffer.id,
            version: 2,
            salary: 28000000,
            currency: "VND",
            startDate: new Date("2026-08-15"),
            changeReason: "Candidate requested salary adjustment",
            createdById: hrManager.id,
            createdAt: new Date(Date.now() - 3 * 86400000),
          },
        ],
      })

      // Add Background check for Mai (passed)
      await prisma.backgroundCheck.create({
        data: {
          offerId: createdMaiOffer.id,
          candidateId: maiCandidate.id,
          group: BGC_GROUP.A,
          status: BGC_STATUS.PASSED,
          idVerified: true,
          addressVerified: true,
          employmentHistoryVerified: true,
        },
      })
    }

    console.log("    Seeded Recruitment Offers, Versions and Background Checks.")

    return {}
  }
}

registry.register(new RecruitmentSeeder())

// Standalone execution
if (import.meta.main) {
  const seeder = new RecruitmentSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const emps = await prisma.employee.findMany({ select: { id: true, position: true, username: true } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.employees = emps
  await seeder.run(ctx)
  await prisma.$disconnect()
}
