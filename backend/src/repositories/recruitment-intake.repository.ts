import { prisma } from "@/libs/database"
import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"
import type {
  ConnectorImportInput,
  ConnectorIntakeRow,
} from "@/types/recruitment-connector.types"
import type { Prisma } from "@prisma/client"

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
      const defaultStage = await tx.recruitmentPipelineStage.findFirst({
        where: { postingId: input.postingId, isDefault: true },
        orderBy: { position: "asc" },
        select: { id: true },
      })

      if (!defaultStage) {
        throw new Error("Bài đăng chưa có giai đoạn mặc định")
      }

      if (isConnectorImport) {
        for (const connectorError of input.connectorErrors) {
          const imported = await tx.recruitmentConnectorResponse.findUnique({
            where: {
              postingId_externalResponseId: {
                postingId: input.postingId,
                externalResponseId: connectorError.sourceRef,
              },
            },
            select: { id: true, applicationId: true },
          })
          if (imported) {
            if (imported.applicationId) {
              skipped += 1
              continue
            }
            await tx.recruitmentConnectorResponse.delete({ where: { id: imported.id } })
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

      for (const row of input.rows) {
        const email = row.email.trim().toLowerCase()
        const externalResponseId = "externalResponseId" in row
          ? (row as ConnectorIntakeRow).externalResponseId
          : undefined
        if (externalResponseId) {
          const imported = await tx.recruitmentConnectorResponse.findUnique({
            where: {
              postingId_externalResponseId: {
                postingId: input.postingId,
                externalResponseId,
              },
            },
            select: { id: true, applicationId: true },
          })
          if (imported) {
            if (imported.applicationId) {
              skipped += 1
              continue
            }
            await tx.recruitmentConnectorResponse.delete({ where: { id: imported.id } })
          }
        }
        const candidate = await tx.candidate.create({
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

        const application = await tx.recruitmentApplication.create({
          data: {
            requisitionId: input.requisitionId,
            candidateId: candidate.id,
            postingId: input.postingId,
            source: input.source,
            sourceRef: postingSourceRef ?? row.sourceRef,
            pipelineStageId: defaultStage.id,
          },
        })
        if ("responseData" in row) {
          await Promise.all(
            Object.entries((row as ConnectorIntakeRow).responseData as Record<string, string>)
              .filter(([key, value]) => Boolean(key) && value.trim().length > 0)
              .map(([metaKey, value]) => tx.candidateMeta.upsert({
                where: { candidateId_metaKey: { candidateId: candidate.id, metaKey } },
                create: { candidateId: candidate.id, metaKey, value: value as Prisma.InputJsonValue },
                update: { value: value as Prisma.InputJsonValue },
              })),
          )
        }
        if (externalResponseId) {
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
