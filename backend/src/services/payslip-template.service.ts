import {
  ICreatePayslipTemplateDTO,
  IPayslipTemplateRepository,
  IPayslipTemplateService,
  IUpdatePayslipTemplateDTO,
  PayslipTemplateWithComponents,
} from "@/types/payroll.types.ts"

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
    if (!fullTemplate) throw new Error("Template not found after creation")
    return fullTemplate
  }

  async updateTemplate(
    id: string,
    data: IUpdatePayslipTemplateDTO,
  ): Promise<PayslipTemplateWithComponents> {
    await this.templateRepo.update(id, data)
    const fullTemplate = await this.templateRepo.findById(id)
    if (!fullTemplate) throw new Error("Template not found after update")
    return fullTemplate
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.templateRepo.softDelete(id)
  }
}
