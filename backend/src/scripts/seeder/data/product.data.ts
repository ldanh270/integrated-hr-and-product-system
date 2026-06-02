export const TECH_STACKS = [
  ["React 19", "Vite", "Tailwind CSS", "TypeScript"],
  ["Node.js", "Express 5", "Mongoose", "MongoDB", "Bun"],
  ["Playwright E2E", "Vitest", "GitHub Actions", "Docker"],
  ["Python", "FastAPI", "PostgreSQL", "Redis"],
]

export const PROJECT_TEMPLATES = [
  {
    name: "Integrated HR and Product System",
    description: "Monolithic backend coupled with features-sliced design React dashboard app.",
  },
  {
    name: "Customer Portal Mobile App",
    description: "React Native client to allow external customers to track order fulfillment.",
  },
  {
    name: "Automated Payroll Pipeline Scheduler",
    description: "Background processing workers logic designed to execute batch payslips compute.",
  },
]

export const TASK_MOCKS = [
  {
    title: "Implement Auth Middleware Guard",
    description: "Write JWT verification hooks, cookie checks, and route restriction roles rules.",
  },
  {
    title: "Write E2E Login Regression Test",
    description:
      "Configure Playwright to sign in with seeded admin credentials and check profile redirects.",
  },
  {
    title: "Design Payroll Component Schema",
    description:
      "Create Mongoose schema, validate unique indexes, and configure references to components.",
  },
  {
    title: "Build Responsive Layout Wrapper",
    description: "Implement modern glassmorphic sidebar layout conforming to strict design spec.",
  },
  {
    title: "Audit Candidate Collection Duplicates",
    description: "Add compound unique index `{ postingId: 1, email: 1 }` to clear schema drift.",
  },
]
