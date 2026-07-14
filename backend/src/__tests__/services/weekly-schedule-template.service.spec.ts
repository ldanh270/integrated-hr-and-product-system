/// <reference types="jest" />
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/utils/employee/is-part-time-work-schedule.util.ts', () => ({
  isPartTimeWorkSchedule: jest.fn(),
}))

jest.mock('@/configs/messages/weekly-schedule.message.ts', () => ({
  WEEKLY_SCHEDULE_MESSAGES: {
    PART_TIME_NOT_APPLICABLE: 'PART_TIME_NOT_APPLICABLE',
  },
}))

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
  },
}))

jest.mock('@/types/shift.types.ts', () => ({}))
jest.mock('@/types/employee.types.ts', () => ({}))
jest.mock('@/types/weekly-schedule-template.types.ts', () => ({}))

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layer: string
    constructor(message: string, statusCode: number, layer: string) {
      super(message)
      this.name = 'AppError'
      this.statusCode = statusCode
      this.layer = layer
    }
  },
}))

jest.mock('@/utils/schedule.util.ts', () => ({
  getCycleWeekIndex: jest.fn(),
  normalizeScheduleDate: jest.fn(),
}))

import { WeeklyScheduleTemplateService } from '../../services/weekly-schedule-template.service'
import { isPartTimeWorkSchedule } from '@/utils/employee/is-part-time-work-schedule.util.ts'
import { WEEKLY_SCHEDULE_MESSAGES } from '@/configs/messages/weekly-schedule.message.ts'
import { HttpStatusCode } from '@/configs/system/http.config.ts'
import { AppError } from '@/utils/error.util.ts'
import { getCycleWeekIndex, normalizeScheduleDate } from '@/utils/schedule.util.ts'

describe('WeeklyScheduleTemplateService.createTemplate', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - creates a template successfully', async () => {
    // Arrange
    const data = { name: 'Template A', cycleWeeks: 2, isActive: true }
    const created = { id: 'template-1', ...data, weeks: [] }
    templateRepo.create.mockResolvedValue(created)

    // Act
    const result = await service.createTemplate(data as any)

    // Assert
    expect(templateRepo.create).toHaveBeenCalledTimes(1)
    expect(templateRepo.create).toHaveBeenCalledWith(data)
    expect(result).toEqual(created)
  })

  it('UTCID02 - propagates repository error when create fails', async () => {
    // Arrange
    const data = { name: 'Template A', cycleWeeks: 2, isActive: true }
    const repoError = new Error('create failed')
    templateRepo.create.mockRejectedValue(repoError)

    // Act
    const action = service.createTemplate(data as any)

    // Assert
    await expect(action).rejects.toThrow('create failed')
    expect(templateRepo.create).toHaveBeenCalledWith(data)
  })

  it('UTCID03 - propagates AppError when repository rejects', async () => {
    // Arrange
    const data = { name: 'Template B', cycleWeeks: 1, isActive: false }
    const repoError = new AppError('repo validation failed', 400, 'repository')
    templateRepo.create.mockRejectedValue(repoError)

    // Act
    const action = service.createTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'repo validation failed',
      statusCode: 400,
      layer: 'repository',
    })
    expect(templateRepo.create).toHaveBeenCalledWith(data)
  })
})

describe('WeeklyScheduleTemplateService.updateTemplate', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - updates a template successfully', async () => {
    // Arrange
    const id = 'template-1'
    const data = { name: 'Updated Template', isActive: true }
    const updated = { id, cycleWeeks: 2, weeks: [], ...data }
    templateRepo.update.mockResolvedValue(updated)

    // Act
    const result = await service.updateTemplate(id, data as any)

    // Assert
    expect(templateRepo.update).toHaveBeenCalledTimes(1)
    expect(templateRepo.update).toHaveBeenCalledWith(id, data)
    expect(result).toEqual(updated)
  })

  it('UTCID02 - propagates repository error when update fails', async () => {
    // Arrange
    const id = 'template-1'
    const data = { name: 'Updated Template' }
    templateRepo.update.mockRejectedValue(new Error('update failed'))

    // Act
    const action = service.updateTemplate(id, data as any)

    // Assert
    await expect(action).rejects.toThrow('update failed')
    expect(templateRepo.update).toHaveBeenCalledWith(id, data)
  })

  it('UTCID03 - propagates AppError when repository update rejects', async () => {
    // Arrange
    const id = 'template-1'
    const data = { isActive: false }
    const repoError = new AppError('not allowed', 400, 'repository')
    templateRepo.update.mockRejectedValue(repoError)

    // Act
    const action = service.updateTemplate(id, data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'not allowed',
      statusCode: 400,
      layer: 'repository',
    })
    expect(templateRepo.update).toHaveBeenCalledWith(id, data)
  })
})

describe('WeeklyScheduleTemplateService.deleteTemplate', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - deletes an existing template successfully', async () => {
    // Arrange
    const id = 'template-1'
    templateRepo.findById.mockResolvedValue({ id, weeks: [], isActive: true })
    templateRepo.delete.mockResolvedValue(undefined)

    // Act
    await service.deleteTemplate(id)

    // Assert
    expect(templateRepo.findById).toHaveBeenCalledTimes(1)
    expect(templateRepo.findById).toHaveBeenCalledWith(id)
    expect(templateRepo.delete).toHaveBeenCalledTimes(1)
    expect(templateRepo.delete).toHaveBeenCalledWith(id)
  })

  it('UTCID02 - throws not found when template does not exist', async () => {
    // Arrange
    const id = 'missing-template'
    templateRepo.findById.mockResolvedValue(null)

    // Act
    const action = service.deleteTemplate(id)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'Không tìm thấy template lịch hàng tuần',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: 'service',
    })
    expect(templateRepo.delete).not.toHaveBeenCalled()
  })

  it('UTCID03 - propagates repository delete error after finding template', async () => {
    // Arrange
    const id = 'template-1'
    templateRepo.findById.mockResolvedValue({ id, weeks: [], isActive: true })
    templateRepo.delete.mockRejectedValue(new Error('delete failed'))

    // Act
    const action = service.deleteTemplate(id)

    // Assert
    await expect(action).rejects.toThrow('delete failed')
    expect(templateRepo.findById).toHaveBeenCalledWith(id)
    expect(templateRepo.delete).toHaveBeenCalledWith(id)
  })
})

describe('WeeklyScheduleTemplateService.getTemplate', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - returns a template successfully', async () => {
    // Arrange
    const id = 'template-1'
    const template = { id, cycleWeeks: 2, isActive: true, weeks: [] }
    templateRepo.findById.mockResolvedValue(template)

    // Act
    const result = await service.getTemplate(id)

    // Assert
    expect(templateRepo.findById).toHaveBeenCalledTimes(1)
    expect(templateRepo.findById).toHaveBeenCalledWith(id)
    expect(result).toEqual(template)
  })

  it('UTCID02 - throws not found when requested template is missing', async () => {
    // Arrange
    const id = 'missing-template'
    templateRepo.findById.mockResolvedValue(null)

    // Act
    const action = service.getTemplate(id)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'Không tìm thấy template lịch hàng tuần',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: 'service',
    })
  })

  it('UTCID03 - propagates repository error when findById fails', async () => {
    // Arrange
    const id = 'template-1'
    templateRepo.findById.mockRejectedValue(new Error('find failed'))

    // Act
    const action = service.getTemplate(id)

    // Assert
    await expect(action).rejects.toThrow('find failed')
    expect(templateRepo.findById).toHaveBeenCalledWith(id)
  })
})

describe('WeeklyScheduleTemplateService.listTemplates', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - returns all templates successfully', async () => {
    // Arrange
    const templates = [
      { id: 'template-1', cycleWeeks: 1, isActive: true, weeks: [] },
      { id: 'template-2', cycleWeeks: 2, isActive: false, weeks: [] },
    ]
    templateRepo.listAll.mockResolvedValue(templates)

    // Act
    const result = await service.listTemplates()

    // Assert
    expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
    expect(result).toEqual(templates)
  })

  it('UTCID02 - propagates repository error when listAll fails', async () => {
    // Arrange
    templateRepo.listAll.mockRejectedValue(new Error('list failed'))

    // Act
    const action = service.listTemplates()

    // Assert
    await expect(action).rejects.toThrow('list failed')
    expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
  })

  it('UTCID03 - propagates AppError when listAll rejects with service-like error', async () => {
    // Arrange
    const repoError = new AppError('listing not allowed', 400, 'repository')
    templateRepo.listAll.mockRejectedValue(repoError)

    // Act
    const action = service.listTemplates()

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'listing not allowed',
      statusCode: 400,
      layer: 'repository',
    })
    expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
  })
})

describe('WeeklyScheduleTemplateService.applyTemplate', () => {
  let templateRepo: any
  let scheduleRepo: any
  let employeeShiftRepo: any
  let employeeRepo: any
  let service: WeeklyScheduleTemplateService

  beforeEach(() => {
    // Arrange
    templateRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    }
    scheduleRepo = {
      assignSchedule: jest.fn(),
    }
    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn(),
    }
    employeeRepo = {
      findById: jest.fn(),
    }
    service = new WeeklyScheduleTemplateService(
      templateRepo,
      scheduleRepo,
      employeeShiftRepo,
      employeeRepo,
    )
    jest.clearAllMocks()
  })

  it('UTCID01 - applies an active template and generates employee shifts successfully', async () => {
    // Arrange
    const validFromDate = new Date('2024-01-01T00:00:00.000Z')
    const validToDate = new Date('2024-01-03T00:00:00.000Z')
    ;(normalizeScheduleDate as jest.Mock)
      .mockReturnValueOnce(validFromDate)
      .mockReturnValueOnce(validToDate)
    ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(false)
    ;(getCycleWeekIndex as jest.Mock).mockReturnValue(0)

    const template = {
      id: 'template-1',
      isActive: true,
      cycleWeeks: 1,
      weeks: [
        {
          weekIndex: 0,
          days: [
            { dayOfWeek: 1, shiftId: 'shift-mon' },
            { dayOfWeek: 2, shiftId: 'shift-tue' },
            { dayOfWeek: 3, shiftId: null },
          ],
        },
      ],
    }

    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1', 'emp-2'],
      validFrom: '2024-01-01',
      validTo: '2024-01-03',
      createdById: 'admin-1',
      generateShifts: true,
    }

    const assigned1 = { id: 'schedule-1', employeeId: 'emp-1' }
    const assigned2 = { id: 'schedule-2', employeeId: 'emp-2' }

    templateRepo.findById.mockResolvedValue(template)
    employeeRepo.findById.mockResolvedValue({ id: 'emp-1', workSchedule: 'FULL_TIME' })
    scheduleRepo.assignSchedule
      .mockResolvedValueOnce(assigned1)
      .mockResolvedValueOnce(assigned2)
    employeeShiftRepo.ensureShiftForEmployeeDate.mockResolvedValue(undefined)

    // Act
    const result = await service.applyTemplate(data as any)

    // Assert
    expect(templateRepo.findById).toHaveBeenCalledWith('template-1')
    expect(normalizeScheduleDate).toHaveBeenNthCalledWith(1, new Date('2024-01-01'))
    expect(normalizeScheduleDate).toHaveBeenNthCalledWith(2, new Date('2024-01-03'))
    expect(employeeRepo.findById).toHaveBeenCalledTimes(2)
    expect(employeeRepo.findById).toHaveBeenNthCalledWith(1, 'emp-1')
    expect(employeeRepo.findById).toHaveBeenNthCalledWith(2, 'emp-2')
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(2)
    expect(scheduleRepo.assignSchedule).toHaveBeenNthCalledWith(1, {
      employeeId: 'emp-1',
      validFrom: validFromDate,
      validTo: validToDate,
      createdById: 'admin-1',
      templateId: 'template-1',
      cycleWeeks: 1,
      days: [
        { weekIndex: 0, dayOfWeek: 1, shiftId: 'shift-mon' },
        { weekIndex: 0, dayOfWeek: 2, shiftId: 'shift-tue' },
      ],
    })
    expect(scheduleRepo.assignSchedule).toHaveBeenNthCalledWith(2, {
      employeeId: 'emp-2',
      validFrom: validFromDate,
      validTo: validToDate,
      createdById: 'admin-1',
      templateId: 'template-1',
      cycleWeeks: 1,
      days: [
        { weekIndex: 0, dayOfWeek: 1, shiftId: 'shift-mon' },
        { weekIndex: 0, dayOfWeek: 2, shiftId: 'shift-tue' },
      ],
    })
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenCalledTimes(4)
    expect(result).toEqual([assigned1, assigned2])
  })

  it('UTCID02 - throws not found when template does not exist', async () => {
    // Arrange
    const data = {
      templateId: 'missing-template',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-01',
      validTo: null,
      createdById: 'admin-1',
      generateShifts: true,
    }
    templateRepo.findById.mockResolvedValue(null)

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'Không tìm thấy template lịch hàng tuần',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: 'service',
    })
    expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
  })

  it('UTCID03 - throws bad request when template is inactive', async () => {
    // Arrange
    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-01',
      validTo: null,
      createdById: 'admin-1',
      generateShifts: true,
    }
    templateRepo.findById.mockResolvedValue({
      id: 'template-1',
      isActive: false,
      cycleWeeks: 1,
      weeks: [],
    })

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'Template đang tắt, không thể áp dụng',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: 'service',
    })
    expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
  })

  it('UTCID04 - throws bad request when validTo is earlier than validFrom', async () => {
    // Arrange
    const validFromDate = new Date('2024-01-05T00:00:00.000Z')
    const validToDate = new Date('2024-01-01T00:00:00.000Z')
    ;(normalizeScheduleDate as jest.Mock)
      .mockReturnValueOnce(validFromDate)
      .mockReturnValueOnce(validToDate)

    templateRepo.findById.mockResolvedValue({
      id: 'template-1',
      isActive: true,
      cycleWeeks: 1,
      weeks: [
        {
          weekIndex: 0,
          days: [{ dayOfWeek: 1, shiftId: 'shift-mon' }],
        },
      ],
    })

    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-05',
      validTo: '2024-01-01',
      createdById: 'admin-1',
      generateShifts: true,
    }

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'validTo phải sau validFrom',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: 'service',
    })
    expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
  })

  it('UTCID05 - throws bad request when template has no shift days to apply', async () => {
    // Arrange
    const validFromDate = new Date('2024-01-01T00:00:00.000Z')
    const validToDate = new Date('2024-01-07T00:00:00.000Z')
    ;(normalizeScheduleDate as jest.Mock)
      .mockReturnValueOnce(validFromDate)
      .mockReturnValueOnce(validToDate)

    templateRepo.findById.mockResolvedValue({
      id: 'template-1',
      isActive: true,
      cycleWeeks: 1,
      weeks: [
        {
          weekIndex: 0,
          days: [
            { dayOfWeek: 1, shiftId: null },
            { dayOfWeek: 2, shiftId: null },
          ],
        },
      ],
    })

    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-01',
      validTo: '2024-01-07',
      createdById: 'admin-1',
      generateShifts: true,
    }

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: 'Template không có ca làm việc nào để áp dụng',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: 'service',
    })
    expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
  })

  it('UTCID06 - throws unprocessable entity when any employee is part time', async () => {
    // Arrange
    const validFromDate = new Date('2024-01-01T00:00:00.000Z')
    const validToDate = new Date('2024-01-07T00:00:00.000Z')
    ;(normalizeScheduleDate as jest.Mock)
      .mockReturnValueOnce(validFromDate)
      .mockReturnValueOnce(validToDate)
    ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(true)

    templateRepo.findById.mockResolvedValue({
      id: 'template-1',
      isActive: true,
      cycleWeeks: 1,
      weeks: [
        {
          weekIndex: 0,
          days: [{ dayOfWeek: 1, shiftId: 'shift-mon' }],
        },
      ],
    })

    employeeRepo.findById.mockResolvedValue({
      id: 'emp-1',
      workSchedule: 'PART_TIME',
    })

    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-01',
      validTo: '2024-01-07',
      createdById: 'admin-1',
      generateShifts: true,
    }

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toMatchObject({
      message: WEEKLY_SCHEDULE_MESSAGES.PART_TIME_NOT_APPLICABLE,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      layer: 'service',
    })
    expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
  })

  it('UTCID07 - propagates repository error when assignSchedule fails', async () => {
    // Arrange
    const validFromDate = new Date('2024-01-01T00:00:00.000Z')
    const validToDate = new Date('2024-01-07T00:00:00.000Z')
    ;(normalizeScheduleDate as jest.Mock)
      .mockReturnValueOnce(validFromDate)
      .mockReturnValueOnce(validToDate)
    ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(false)

    templateRepo.findById.mockResolvedValue({
      id: 'template-1',
      isActive: true,
      cycleWeeks: 1,
      weeks: [
        {
          weekIndex: 0,
          days: [{ dayOfWeek: 1, shiftId: 'shift-mon' }],
        },
      ],
    })
    employeeRepo.findById.mockResolvedValue({ id: 'emp-1', workSchedule: 'FULL_TIME' })
    scheduleRepo.assignSchedule.mockRejectedValue(new Error('assign failed'))

    const data = {
      templateId: 'template-1',
      employeeIds: ['emp-1'],
      validFrom: '2024-01-01',
      validTo: '2024-01-07',
      createdById: 'admin-1',
      generateShifts: false,
    }

    // Act
    const action = service.applyTemplate(data as any)

    // Assert
    await expect(action).rejects.toThrow('assign failed')
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
  })
})