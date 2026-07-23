import { prisma } from "@/libs/database"
import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"
import { TERMINAL_APPLICATION_STATUSES } from "@/configs/entities/recruitment.config"
import type {
  ConnectorImportInput,
  ConnectorIntakeRow,
} from "@/types/recruitment-connector.types"

export interface IntakeRowError {
  row: number
  email: string
  code: string
  message: string
}

export class RecruitmentIntakeRepository {
  async importCandidateBatch(
    input: ImportRecruitmentIntakeInput | ConnectorImportInput,
    postingSourceRef?: string | null,
  ) {
    return prisma.$transaction(async (tx) => {
      let created = 0
      let matched = 0
      let candidatesCreated = 0
      let skipped = 0
      const errors: IntakeRowError[] = []
      const isConnectorImport = "connectorErrors" in input

      if (isConnectorImport) {
        for (const connectorError of input.connectorErrors) {
          const imported = await tx.recruitmentConnectorResponse.findUnique({
            where: {
              postingId_externalResponseId: {
                postingId: input.postingId,
                externalResponseId: connectorError.sourceRef,
              },
            },
            select: { id: true },
          })
          if (imported) {
            skipped += 1
            continue
          }
          await tx.recruitmentConnectorResponse.create({
            data: {
              postingId: input.postingId,
              externalResponseId: connectorError.sourceRef,
              errorCode: connectorError.code,
              errorMessage: connectorError.message,
              responseData: connectorError.responseData,
            },
          })
          errors.push(connectorError)
        }
      }

      for (const [index, row] of input.rows.entries()) {
        const email = row.email.trim().toLowerCase()
        const externalResponseId = "externalResponseId" in row
          ? (row as ConnectorIntakeRow).externalResponseId
          : undefined
        if (externalResponseId && input.postingId) {
          const imported = await tx.recruitmentConnectorResponse.findUnique({
            where: {
              postingId_externalResponseId: {
                postingId: input.postingId,
                externalResponseId,
              },
            },
            select: { id: true },
          })
          if (imported) {
            skipped += 1
            continue
          }
        }
        let candidate = await tx.candidate.findUnique({ where: { email } })
        if (candidate) {
          matched += 1
        } else {
          candidate = await tx.candidate.create({
            data: {
              fullName: row.fullName.trim(),
              email,
              phone: row.phone,
              cvUrl: row.cvUrl,
              notes: row.notes,
              source: input.source,
            },
          })
          candidatesCreated += 1
        }

        const duplicate = await tx.recruitmentApplication.findFirst({
          where: {
            requisitionId: input.requisitionId,
            candidateId: candidate.id,
            status: { notIn: [...TERMINAL_APPLICATION_STATUSES] },
          },
          select: { id: true },
        })
        if (duplicate) {
          const duplicateError = {
            row: index + 1,
            email,
            code: "DUPLICATE_APPLICATION",
            message: "Ứng viên đã có lượt ứng tuyển cho yêu cầu này",
          }
          errors.push(duplicateError)
          if (externalResponseId && input.postingId) {
            await tx.recruitmentConnectorResponse.create({
              data: {
                postingId: input.postingId,
                externalResponseId,
                errorCode: duplicateError.code,
                errorMessage: duplicateError.message,
                responseData: (row as ConnectorIntakeRow).responseData,
              },
            })
          }
          continue
        }

        const application = await tx.recruitmentApplication.create({
          data: {
            requisitionId: input.requisitionId,
            candidateId: candidate.id,
            postingId: input.postingId,
            source: input.source,
            sourceRef: postingSourceRef ?? row.sourceRef,
          },
        })
        if (externalResponseId && input.postingId) {
          await tx.recruitmentConnectorResponse.create({
            data: {
              postingId: input.postingId,
              externalResponseId,
              applicationId: application.id,
              responseData: (row as ConnectorIntakeRow).responseData,
            },
          })
        }
        created += 1
      }

      return {
        total: input.rows.length + (isConnectorImport ? input.connectorErrors.length : 0),
        created,
        matched,
        applicationsCreated: created,
        candidatesCreated,
        candidatesMatched: matched,
        skipped,
        failed: errors.length,
        errors,
      }
    })
  }
}

export const recruitmentIntakeRepository = new RecruitmentIntakeRepository()
