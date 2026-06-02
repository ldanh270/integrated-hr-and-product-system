import { faker } from "@faker-js/faker"

export const RECRUITMENT_PROPOSAL_TEMPLATES = [
  {
    position: "Senior Node.js Developer",
    headcount: 3,
    reason: "Expansion of backend engineering team for core project integration",
  },
  {
    position: "React UI/UX Designer",
    headcount: 1,
    reason: "Figma design translation and frontend component development pipeline acceleration",
  },
  {
    position: "QA Automation Engineer",
    headcount: 2,
    reason: "Writing Playwright end-to-end regression suites and Vitest units integration",
  },
]

export const POSTINGS_MOCK = [
  {
    title: "Senior Software Engineer (Node.js/TypeScript)",
    description: "Looking for an expert backend engineer to lead the SWP391 HRM system deployment.",
    requirements:
      "3+ years Node.js, experience with Mongoose, clean architecture, and SOLID design patterns.",
    benefits: "Competitive salary, private health insurance, flex-hours, premium workspace access.",
  },
  {
    title: "Product Designer (Figma / React)",
    description:
      "Translate beautiful high-fidelity Figma components into premium styled React views.",
    requirements: "Strong UI design principles, Tailwind CSS expertise, and React 19 knowledge.",
    benefits: "Remote flexibility, top-tier hardware, continuous learning training stipend.",
  },
]

export const INTERVIEW_FEEDBACK_TEMPLATES = [
  "Excellent technical knowledge of design patterns. Strong coding capabilities.",
  "Decent understanding of TypeScript. Code could use cleaner SOLID adherence. Recommending second round.",
  "Struggled with concurrency and MongoDB scaling scenarios. Weak technical fit.",
]
