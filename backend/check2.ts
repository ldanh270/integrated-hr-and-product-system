const jwt = require("jsonwebtoken");
import { prisma } from "./src/libs/database.ts";
async function main() {
  const approvers = await prisma.employee.findMany({
    where: {
      role: { in: ['admin', 'general_manager', 'hr_manager', 'team_leader'] },
      status: 'active'
    }
  });
  console.log("DB Approvers:", approvers.length);
}
main();
