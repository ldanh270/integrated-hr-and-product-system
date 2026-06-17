import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"

export interface PersonalEmployeeLink {
  personalEmployeeId: string | null
  personalEmployee: {
    id: string
    fullName: string
    email: string
  } | null
}

export async function resolvePersonalEmployeeId(accountId: string): Promise<string> {
  const account = await prisma.employee.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { personalEmployeeId: true },
  })

  if (!account?.personalEmployeeId) {
    return accountId
  }

  const linked = await prisma.employee.findFirst({
    where: {
      id: account.personalEmployeeId,
      deletedAt: null,
      status: EMPLOYEE_STATUS.ACTIVE,
    },
    select: { id: true },
  })

  return linked?.id ?? accountId
}

export async function getPersonalEmployeeLink(accountId: string): Promise<PersonalEmployeeLink> {
  const account = await prisma.employee.findFirst({
    where: { id: accountId, deletedAt: null },
    select: {
      personalEmployeeId: true,
      personalEmployee: {
        select: { id: true, fullName: true, email: true, status: true, deletedAt: true },
      },
    },
  })

  if (!account) {
    return { personalEmployeeId: null, personalEmployee: null }
  }

  const linked = account.personalEmployee
  const isLinkedActive =
    linked && linked.deletedAt == null && linked.status === EMPLOYEE_STATUS.ACTIVE

  return {
    personalEmployeeId: isLinkedActive ? account.personalEmployeeId : null,
    personalEmployee: isLinkedActive
      ? { id: linked.id, fullName: linked.fullName, email: linked.email }
      : null,
  }
}
