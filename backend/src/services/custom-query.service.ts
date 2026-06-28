import { ICustomQueryService, ICustomQueryRepository, CustomQuery, CreateCustomQueryDto, CustomQueryType } from "@/types/custom-query.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"

export class CustomQueryService implements ICustomQueryService {
  constructor(private customQueryRepo: ICustomQueryRepository) {}

  async getQueries(employeeId: string, projectId?: string | null, type?: CustomQueryType): Promise<CustomQuery[]> {
    return this.customQueryRepo.findByEmployee(employeeId, projectId, type)
  }

  async saveQuery(data: CreateCustomQueryDto, employeeId: string): Promise<CustomQuery> {
    if (!data.name || !data.name.trim()) {
      throw new AppError("Tên truy vấn không được trống", HttpStatusCode.BAD_REQUEST, "CustomQueryService")
    }
    if (!data.queryData || !data.queryData.trim()) {
      throw new AppError("Dữ liệu truy vấn không được trống", HttpStatusCode.BAD_REQUEST, "CustomQueryService")
    }
    return this.customQueryRepo.create({
      ...data,
      employeeId,
    })
  }

  async deleteQuery(id: string, employeeId: string): Promise<boolean> {
    const query = await this.customQueryRepo.findById(id)
    if (!query) {
      throw new AppError("Không tìm thấy truy vấn để xóa", HttpStatusCode.NOT_FOUND, "CustomQueryService")
    }
    if (query.employeeId !== employeeId) {
      throw new AppError("Bạn không có quyền xóa truy vấn này", HttpStatusCode.FORBIDDEN, "CustomQueryService")
    }
    return this.customQueryRepo.delete(id)
  }
}
