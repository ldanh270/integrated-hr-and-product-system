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

  /**
   * Process business logic for listTemplates.
   *
   * @param filter - The filter parameter
   * @returns Returns the result of type Promise<PayslipTemplateWithComponents[]>
   */
  async listTemplates(filter: { isActive?: boolean }): Promise<PayslipTemplateWithComponents[]> {
    return this.templateRepo.findAll(filter)
  }

  /**
   * Process business logic for createTemplate.
   *
   * @param data - The data parameter
   * @param createdById - The createdById parameter
   * @returns Returns the result of type Promise<PayslipTemplateWithComponents>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Process business logic for updateTemplate.
   *
   * @param id - The id parameter
   * @param data - The data parameter
   * @returns Returns the result of type Promise<PayslipTemplateWithComponents>
   * @throws AppError if a business logic error occurs or data is not found
   */
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

  /**
   * Delete a payslip template from the system.
   *
   * @param id - The id parameter
   * @returns Returns nothing (void)
   */
  async deleteTemplate(id: string): Promise<void> {
    return this.templateRepo.softDelete(id)
  }
}
