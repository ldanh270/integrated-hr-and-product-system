/// <reference types="jest" />
import { jest } from '@jest/globals'
import type {
  IHolidayRepository,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
} from '@/types/attendance.types.ts'
import type { HolidayCalendar, HolidayType } from '@prisma/client'

jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: {
    SERVICE: 'SERVICE',
  },
}))

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    statusCode: number

    layer: string

    code: string

    constructor(message: string, statusCode: number, layer: string, code: string) {
      super(message)
      this.name = 'AppError'
      this.statusCode = statusCode
      this.layer = layer
      this.code = code
    }
  },
}))

import { HolidayService } from '../../services/holiday.service'
import { ErrorLayer } from '@/configs/system/error-code.config.ts'
import { HttpStatusCode } from '@/configs/system/http.config.ts'
import { AppError } from '@/utils/error.util.ts'

const HOLIDAY_SCOPE = {
  ALL: 'ALL',
  POSITION: 'POSITION',
  EMPLOYEES: 'EMPLOYEES',
} as const

type MockedHolidayRepository = {
  listHolidays: jest.MockedFunction<IHolidayRepository['listHolidays']>
  createHoliday: jest.MockedFunction<IHolidayRepository['createHoliday']>
  updateHoliday: jest.MockedFunction<IHolidayRepository['updateHoliday']>
  deleteHoliday: jest.MockedFunction<IHolidayRepository['deleteHoliday']>
  checkIsHoliday: jest.MockedFunction<IHolidayRepository['checkIsHoliday']>
}

describe('HolidayService', () => {
  let holidayRepo: MockedHolidayRepository
  let holidayService: HolidayService

  const mockHoliday = (
    id: string,
    name: string,
    dateStr: string,
    type: HolidayType = 'national',
    createdById: string = 'user-1'
  ): HolidayCalendar => ({
    id,
    name,
    date: new Date(dateStr),
    type,
    createdById,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(() => {
    holidayRepo = {
      listHolidays: jest.fn<IHolidayRepository['listHolidays']>(),
      createHoliday: jest.fn<IHolidayRepository['createHoliday']>(),
      updateHoliday: jest.fn<IHolidayRepository['updateHoliday']>(),
      deleteHoliday: jest.fn<IHolidayRepository['deleteHoliday']>(),
      checkIsHoliday: jest.fn<IHolidayRepository['checkIsHoliday']>(),
    }

    holidayService = new HolidayService(holidayRepo as unknown as IHolidayRepository)
  })

  describe('listHolidays', () => {
    it('UTCID01 - returns holidays for the provided query', async () => {
      const query = { year: 2025 } as IListHolidaysQueryDTO
      const mockResult = [
        mockHoliday('holiday-1', 'New Year', '2025-01-01'),
        mockHoliday('holiday-2', 'Labor Day', '2025-05-01'),
      ]
      holidayRepo.listHolidays.mockResolvedValue(mockResult)

      const result = await holidayService.listHolidays(query)

      expect(holidayRepo.listHolidays).toHaveBeenCalledTimes(1)
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResult)
    })

    it('UTCID02 - propagates a not found style repository error', async () => {
      const query = { year: 1999 } as IListHolidaysQueryDTO
      const repoError = new AppError(
        'Holiday records not found',
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        'HOLIDAYS_NOT_FOUND',
      )
      holidayRepo.listHolidays.mockRejectedValue(repoError)

      const act = holidayService.listHolidays(query)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query)
    })

    it('UTCID03 - propagates an internal repository error', async () => {
      const query = { year: 2025 } as IListHolidaysQueryDTO
      const repoError = new AppError(
        'Database failure',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        'DB_ERROR',
      )
      holidayRepo.listHolidays.mockRejectedValue(repoError)

      const act = holidayService.listHolidays(query)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.listHolidays).toHaveBeenCalledTimes(1)
    })
  })

  describe('createHoliday', () => {
    it('UTCID01 - creates a holiday successfully', async () => {
      const name = 'Company Holiday'
      const date = '2025-12-25'
      const type = 'company'
      const createdById = 'user-1'
      const mockResult = mockHoliday('holiday-1', name, date, type, createdById)

      holidayRepo.createHoliday.mockResolvedValue(mockResult)

      const result = await holidayService.createHoliday(name, date, type, createdById)

      expect(holidayRepo.createHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.createHoliday).toHaveBeenCalledWith(name, date, type, createdById)
      expect(result).toEqual(mockResult)
    })

    it('UTCID02 - propagates repository errors during creation', async () => {
      const name = 'Company Holiday'
      const date = '2025-12-25'
      const type = 'company'
      const createdById = 'user-1'
      const repoError = new AppError(
        'Insert failed',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        'INSERT_FAILED',
      )

      holidayRepo.createHoliday.mockRejectedValue(repoError)

      const act = holidayService.createHoliday(name, date, type, createdById)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.createHoliday).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateHoliday', () => {
    it('UTCID01 - updates a holiday successfully', async () => {
      const id = 'holiday-1'
      const data = { name: 'Updated Holiday Name' } as IUpdateHolidayDTO
      const mockResult = mockHoliday(id, 'Updated Holiday Name', '2025-01-01')
      holidayRepo.updateHoliday.mockResolvedValue(mockResult)

      const result = await holidayService.updateHoliday(id, data)

      expect(holidayRepo.updateHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data)
      expect(result).toEqual(mockResult)
    })

    it('UTCID02 - propagates a not found error from repository', async () => {
      const id = 'missing-holiday'
      const data = { name: 'Missing Holiday' } as IUpdateHolidayDTO
      const repoError = new AppError(
        'Holiday not found',
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        'HOLIDAY_NOT_FOUND',
      )
      holidayRepo.updateHoliday.mockRejectedValue(repoError)

      const act = holidayService.updateHoliday(id, data)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data)
    })

    it('UTCID03 - propagates an internal server error from repository', async () => {
      const id = 'holiday-2'
      const data = { name: 'Broken Update' } as IUpdateHolidayDTO
      const repoError = new AppError(
        'Update failed',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        'UPDATE_FAILED',
      )
      holidayRepo.updateHoliday.mockRejectedValue(repoError)

      const act = holidayService.updateHoliday(id, data)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteHoliday', () => {
    it('UTCID01 - deletes a holiday successfully', async () => {
      const id = 'holiday-1'
      holidayRepo.deleteHoliday.mockResolvedValue(undefined)

      await holidayService.deleteHoliday(id)

      expect(holidayRepo.deleteHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id)
    })

    it('UTCID02 - propagates a not found error when holiday does not exist', async () => {
      const id = 'missing-holiday'
      const repoError = new AppError(
        'Holiday not found',
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        'HOLIDAY_NOT_FOUND',
      )
      holidayRepo.deleteHoliday.mockRejectedValue(repoError)

      const act = holidayService.deleteHoliday(id)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id)
    })

    it('UTCID03 - propagates an internal server error during deletion', async () => {
      const id = 'holiday-3'
      const repoError = new AppError(
        'Delete failed',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        'DELETE_FAILED',
      )
      holidayRepo.deleteHoliday.mockRejectedValue(repoError)

      const act = holidayService.deleteHoliday(id)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledTimes(1)
    })
  })

  describe('isHoliday', () => {
    it('UTCID01 - returns true when the provided date is a holiday', async () => {
      const date = '2025-12-25'
      holidayRepo.checkIsHoliday.mockResolvedValue(true)

      const result = await holidayService.isHoliday(date)

      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date)
      expect(result).toBe(true)
    })

    it('UTCID02 - propagates a bad request style error for invalid date input', async () => {
      const date = 'invalid-date'
      const repoError = new AppError(
        'Invalid date',
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        'INVALID_DATE',
      )
      holidayRepo.checkIsHoliday.mockRejectedValue(repoError)

      const act = holidayService.isHoliday(date)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date)
    })

    it('UTCID03 - propagates an internal server error from repository', async () => {
      const date = new Date('2025-01-01')
      const repoError = new AppError(
        'Query failed',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        'QUERY_FAILED',
      )
      holidayRepo.checkIsHoliday.mockRejectedValue(repoError)

      const act = holidayService.isHoliday(date)

      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledTimes(1)
    })
  })
})
