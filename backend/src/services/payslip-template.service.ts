import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ICreatePayslipTemplateDTO,
  IPayslipTemplateRepository,
  IPayslipTemplateService,
  IUpdatePayslipTemplateDTO,
  PayslipTemplateWithComponents,
} from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class PayslipTemplateService implements IPayslipTemplateService {
  constructor(private templateRepo: IPayslipTemplateRepository) {}

  async listTemplates(filter: { isActive?: boolean }): Promise<PayslipTemplateWithComponents[]> {
    return this.templateRepo.findAll(filter)
  }

  async createTemplate(
    data: ICreatePayslipTemplateDTO,
    createdById: string,
  ): Promise<PayslipTemplateWithComponents> {
    const template = await this.templateRepo.create(data, createdById)
    const fullTemplate = await this.templateRepo.findById(template.id)
    if (!fullTemplate)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.TEMPLATE_NOT_FOUND_CREATE,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return fullTemplate
  }

  async updateTemplate(
    id: string,
    data: IUpdatePayslipTemplateDTO,
  ): Promise<PayslipTemplateWithComponents> {
    await this.templateRepo.update(id, data)
    const fullTemplate = await this.templateRepo.findById(id)
    if (!fullTemplate)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.TEMPLATE_NOT_FOUND_UPDATE,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return fullTemplate
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.templateRepo.softDelete(id)
  }
}
