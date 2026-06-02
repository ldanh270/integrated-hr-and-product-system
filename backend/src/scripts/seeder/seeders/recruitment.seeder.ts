import { ROLE } from "@/configs/entities/employee.config.ts"
import Employee from "@/entities/Employee.ts"
import Candidate from "@/entities/recruitment/Candidate.ts"
import InterviewSchedule from "@/entities/recruitment/InterviewSchedule.ts"
import RecruitmentPosting from "@/entities/recruitment/RecruitmentPosting.ts"
import RecruitmentProposal from "@/entities/recruitment/RecruitmentProposal.ts"
import SocialPostLog from "@/entities/recruitment/SocialPostLog.ts"

import { faker } from "@faker-js/faker"

import {
  INTERVIEW_FEEDBACK_TEMPLATES,
  POSTINGS_MOCK,
  RECRUITMENT_PROPOSAL_TEMPLATES,
} from "../data/recruitment.data.ts"
import { seedEmployees } from "./employee.seeder.ts"

export const seedRecruitment = async (
  passedEmployees?: any[],
): Promise<{ postings: any[]; candidates: any[] }> => {
  console.log("🤝 Seeding Recruitment...")

  // 1. Get employees or auto-seed if none exist
  let employees = passedEmployees || (await Employee.find())
  if (employees.length === 0) {
    console.log("⚠️ No employees found in database. Automatically seeding employees first...")
    employees = await seedEmployees()
  }

  const hrManager = employees.find((e) => e.role === ROLE.HR_MANAGER) || employees[0]
  const leaders = employees.filter(
    (e) => e.role === ROLE.TEAM_LEADER || e.role === ROLE.GENERAL_MANAGER,
  )

  // 1.5. Clear existing recruitment database setup
  await RecruitmentProposal.deleteMany({})
  await RecruitmentPosting.deleteMany({})
  await Candidate.deleteMany({})
  await InterviewSchedule.deleteMany({})
  await SocialPostLog.deleteMany({})

  // 2. Seed RecruitmentProposals
  const proposalsToInsert = RECRUITMENT_PROPOSAL_TEMPLATES.map((prop, i) => ({
    ...prop,
    requestedBy: hrManager._id,
    status: i === 0 ? ("approved" as const) : ("pending" as const),
  }))
  const createdProposals = await RecruitmentProposal.insertMany(proposalsToInsert)
  console.log(`✅ Seeded ${createdProposals.length} recruitment proposals`)

  // 3. Seed RecruitmentPostings and Candidates
  const createdPostings: any[] = []
  const createdCandidates: any[] = []

  let candidateCount = 0
  let interviewCount = 0
  let logCount = 0

  for (const postData of POSTINGS_MOCK) {
    const posting = await RecruitmentPosting.create({
      title: postData.title,
      description: postData.description,
      requirements: postData.requirements,
      benefits: postData.benefits,
      status: "open",
      deadline: faker.date.future(),
      createdBy: hrManager._id,
    })
    createdPostings.push(posting)

    // Seed 4 candidates per posting
    for (let j = 0; j < 4; j++) {
      const isInterview = j === 0
      const isHired = j === 1

      let status: "new" | "interview" | "hired" = "new"
      if (isInterview) status = "interview"
      if (isHired) status = "hired"

      const candidate = await Candidate.create({
        postingId: posting._id,
        fullName: faker.person.fullName(),
        email: `candidate-${posting._id}-${j + 1}@example.com`,
        phone: `086${faker.string.numeric(7)}`,
        source: faker.helpers.arrayElement(["website", "linkedin", "referral"]),
        cvUrl: `https://example-cvs.local/${faker.system.commonFileName("pdf")}`,
        status,
        note: faker.lorem.sentence(),
        createdBy: null, // self-apply
      })
      createdCandidates.push(candidate)
      candidateCount++

      // Create interview schedule for candidates in interview status
      if (status === "interview") {
        await InterviewSchedule.create({
          candidateId: candidate._id,
          scheduledAt: faker.date.soon({ days: 10 }),
          format: faker.helpers.arrayElement(["video_call", "in_person"]),
          locationOrLink: faker.internet.url(),
          interviewerId: faker.helpers.arrayElement(leaders)._id,
          status: "scheduled",
          result: "pending",
          score: null,
          feedback: null,
          updatedBy: hrManager._id,
        })
        interviewCount++
      }

      // If hired, create historical interview schedule that passed
      if (status === "hired") {
        await InterviewSchedule.create({
          candidateId: candidate._id,
          scheduledAt: faker.date.past({ years: 1 }),
          format: "video_call",
          locationOrLink: faker.internet.url(),
          interviewerId: faker.helpers.arrayElement(leaders)._id,
          status: "completed",
          result: "pass",
          score: faker.number.int({ min: 80, max: 95 }),
          feedback: faker.helpers.arrayElement(INTERVIEW_FEEDBACK_TEMPLATES),
          updatedBy: hrManager._id,
        })
        interviewCount++
      }
    }

    // Seed social post logs
    await SocialPostLog.create({
      postingId: posting._id,
      platform: "linkedin",
      postUrl: `https://linkedin.com/jobs/view/${posting._id}`,
      postedAt: new Date(),
      postedBy: hrManager._id,
    })
    logCount++
  }

  console.log(
    `✅ Seeded ${createdPostings.length} postings, ${candidateCount} candidates, ${interviewCount} interview schedules, and ${logCount} social logs`,
  )
  return { postings: createdPostings, candidates: createdCandidates }
}
