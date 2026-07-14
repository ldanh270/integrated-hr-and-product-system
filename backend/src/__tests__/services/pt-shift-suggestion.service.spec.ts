/// <reference types="jest" />
import { jest } from '@jest/globals'

jest.mock('@/configs/entities/part-time-availability.config.ts', () => ({
  PART_TIME_SHIFT_SUGGEST: {
    NEUTRAL_SCORE: 50,
    LOOKBACK_DAYS: 30,
  },
}))

jest.mock('@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts', () => ({
  buildPartTimeShiftSuggestions: jest.fn(),
}))

jest.mock('@/utils/part-time-availability/score-part-time-reliability.util.ts', () => ({
  scorePartTimeReliability: jest.fn(),
}))

jest.mock('@/utils/part-time-availability.util.ts', () => ({
  normalizeWeekStart: jest.fn(),
}))

jest.mock('@/utils/schedule.util.ts', () => ({
  formatScheduleDateKey: jest.fn(),
}))

import { PtShiftSuggestionService } from '../../services/pt-shift-suggestion.service'
import { PART_TIME_SHIFT_SUGGEST } from '@/configs/entities/part-time-availability.config.ts'
import { buildPartTimeShiftSuggestions } from '@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts'
import { scorePartTimeReliability } from '@/utils/part-time-availability/score-part-time-reliability.util.ts'
import { normalizeWeekStart } from '@/utils/part-time-availability.util.ts'
import { formatScheduleDateKey } from '@/utils/schedule.util.ts'
import type { IAttendanceRepository } from '@/types/attendance.types.ts'
import type {
  IPartTimeAvailabilityService,
  ISuggestPartTimeShiftsResult,
} from '@/types/part-time-availability.types.ts'

type AvailabilityItem = {
  employeeId: string
  date: string
  shiftId: string
  lockedUntil: null
  revokedAt: null
}

type AttendanceRecordItem = {
  employeeId: string
  status: string
}

type ReliabilityScore = {
  score: number
  reasons: string[]
}

type MockedAvailabilityService = {
  listForWeek: jest.MockedFunction<IPartTimeAvailabilityService['listForWeek']>
}

type MockedAttendanceRepo = {
  queryRecords: jest.MockedFunction<IAttendanceRepository['queryRecords']>
}

describe('PtShiftSuggestionService', () => {
  let availabilityService: MockedAvailabilityService
  let attendanceRepo: MockedAttendanceRepo
  let service: PtShiftSuggestionService

  const mockedNormalizeWeekStart = jest.mocked(normalizeWeekStart)
  const mockedFormatScheduleDateKey = jest.mocked(formatScheduleDateKey)
  const mockedScorePartTimeReliability = jest.mocked(scorePartTimeReliability)
  const mockedBuildPartTimeShiftSuggestions = jest.mocked(buildPartTimeShiftSuggestions)

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()

    availabilityService = {
      listForWeek: jest.fn() as jest.MockedFunction<IPartTimeAvailabilityService['listForWeek']>,
    }

    attendanceRepo = {
      queryRecords: jest.fn() as jest.MockedFunction<IAttendanceRepository['queryRecords']>,
    }

    service = new PtShiftSuggestionService(
      availabilityService as unknown as IPartTimeAvailabilityService,
      attendanceRepo as unknown as IAttendanceRepository,
    )

    mockedNormalizeWeekStart.mockReturnValue(new Date('2024-05-06T00:00:00.000Z'))
    mockedFormatScheduleDateKey.mockReturnValue('2024-05-06')
  })

  describe('suggest', () => {
    it('UTCID01 - returns shift suggestions with reliability scores for employees with attendance history', async () => {
      // Arrange
      const weekStart = '2024-05-08'
      const availabilities: AvailabilityItem[] = [
        { employeeId: 'emp-1', date: '2024-05-06', shiftId: 'shift-1', lockedUntil: null, revokedAt: null },
        { employeeId: 'emp-2', date: '2024-05-07', shiftId: 'shift-2', lockedUntil: null, revokedAt: null },
        { employeeId: 'emp-1', date: '2024-05-08', shiftId: 'shift-3', lockedUntil: null, revokedAt: null },
      ]
      const attendanceRecords: AttendanceRecordItem[] = [
        { employeeId: 'emp-1', status: 'present' },
        { employeeId: 'emp-1', status: 'late' },
        { employeeId: 'emp-2', status: 'present' },
      ]
      const emp1Score: ReliabilityScore = { score: 90, reasons: ['good history'] }
      const emp2Score: ReliabilityScore = { score: 80, reasons: ['stable history'] }
      const expectedResult: ISuggestPartTimeShiftsResult = {
        weekStart: '2024-05-06',
        suggestions: [{ employeeId: 'emp-1', shiftId: 'shift-1' }],
        meta: { generated: true },
      } as unknown as ISuggestPartTimeShiftsResult

      availabilityService.listForWeek.mockResolvedValue(availabilities as never)
      attendanceRepo.queryRecords.mockResolvedValue(attendanceRecords as never)
      mockedScorePartTimeReliability
        .mockReturnValueOnce(emp1Score as never)
        .mockReturnValueOnce(emp2Score as never)
      mockedBuildPartTimeShiftSuggestions.mockReturnValue(expectedResult)

      // Act
      const result = await service.suggest(weekStart)

      // Assert
      expect(mockedNormalizeWeekStart).toHaveBeenCalledTimes(1)
      expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(weekStart)

      expect(mockedFormatScheduleDateKey).toHaveBeenCalledTimes(1)
      expect(mockedFormatScheduleDateKey).toHaveBeenCalledWith(new Date('2024-05-06T00:00:00.000Z'))

      expect(availabilityService.listForWeek).toHaveBeenCalledTimes(1)
      expect(availabilityService.listForWeek).toHaveBeenCalledWith('2024-05-06')

      expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1)
      expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
        employeeIds: ['emp-1', 'emp-2'],
        startDate: expect.any(String),
        endDate: expect.any(String),
      })

      expect(mockedScorePartTimeReliability).toHaveBeenCalledTimes(2)
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(1, [
        { employeeId: 'emp-1', status: 'present' },
        { employeeId: 'emp-1', status: 'late' },
      ])
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(2, [
        { employeeId: 'emp-2', status: 'present' },
      ])

      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledTimes(1)
      const buildArg = mockedBuildPartTimeShiftSuggestions.mock.calls[0]?.[0]
      expect(buildArg?.weekStart).toBe('2024-05-06')
      expect(buildArg?.availabilities).toEqual(availabilities)
      expect(buildArg?.scoresByEmployeeId).toBeInstanceOf(Map)
      expect(buildArg?.scoresByEmployeeId.get('emp-1')).toEqual(emp1Score)
      expect(buildArg?.scoresByEmployeeId.get('emp-2')).toEqual(emp2Score)

      expect(result).toEqual(expectedResult)
    })

    it('UTCID02 - propagates error when availability service fails', async () => {
      // Arrange
      const weekStart = '2024-05-08'
      const expectedError = new Error('availability failed')

      availabilityService.listForWeek.mockRejectedValue(expectedError)

      // Act
      const act = service.suggest(weekStart)

      // Assert
      await expect(act).rejects.toThrow('availability failed')
      expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(weekStart)
      expect(mockedFormatScheduleDateKey).toHaveBeenCalledWith(new Date('2024-05-06T00:00:00.000Z'))
      expect(availabilityService.listForWeek).toHaveBeenCalledWith('2024-05-06')
      expect(attendanceRepo.queryRecords).not.toHaveBeenCalled()
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled()
      expect(mockedBuildPartTimeShiftSuggestions).not.toHaveBeenCalled()
    })

    it('UTCID03 - propagates error when attendance repository query fails', async () => {
      // Arrange
      const weekStart = '2024-05-08'
      const availabilities: AvailabilityItem[] = [
        { employeeId: 'emp-1', date: '2024-05-06', shiftId: 'shift-1', lockedUntil: null, revokedAt: null },
      ]
      const expectedError = new Error('attendance query failed')

      availabilityService.listForWeek.mockResolvedValue(availabilities as never)
      attendanceRepo.queryRecords.mockRejectedValue(expectedError)

      // Act
      const act = service.suggest(weekStart)

      // Assert
      await expect(act).rejects.toThrow('attendance query failed')
      expect(availabilityService.listForWeek).toHaveBeenCalledWith('2024-05-06')
      expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1)
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled()
      expect(mockedBuildPartTimeShiftSuggestions).not.toHaveBeenCalled()
    })

    it('UTCID04 - propagates error when suggestion builder fails after computing neutral scores for empty availabilities', async () => {
      // Arrange
      const weekStart = '2024-05-08'
      const availabilities: AvailabilityItem[] = []
      const expectedError = new Error('builder failed')

      availabilityService.listForWeek.mockResolvedValue(availabilities as never)
      mockedBuildPartTimeShiftSuggestions.mockImplementation(() => {
        throw expectedError
      })

      // Act
      const act = service.suggest(weekStart)

      // Assert
      await expect(act).rejects.toThrow('builder failed')
      expect(availabilityService.listForWeek).toHaveBeenCalledWith('2024-05-06')
      expect(attendanceRepo.queryRecords).not.toHaveBeenCalled()
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled()
      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledTimes(1)

      const buildArg = mockedBuildPartTimeShiftSuggestions.mock.calls[0]?.[0]
      expect(buildArg?.weekStart).toBe('2024-05-06')
      expect(buildArg?.availabilities).toEqual([])
      expect(buildArg?.scoresByEmployeeId).toBeInstanceOf(Map)
      expect(buildArg?.scoresByEmployeeId.size).toBe(0)
    })

    it('UTCID05 - uses scorer output for employees with and without attendance records', async () => {
      // Arrange
      const weekStart = '2024-05-08'
      const availabilities: AvailabilityItem[] = [
        { employeeId: 'emp-1', date: '2024-05-06', shiftId: 'shift-1', lockedUntil: null, revokedAt: null },
        { employeeId: 'emp-2', date: '2024-05-07', shiftId: 'shift-2', lockedUntil: null, revokedAt: null },
      ]
      const attendanceRecords: AttendanceRecordItem[] = [{ employeeId: 'emp-1', status: 'present' }]
      const emp1Score: ReliabilityScore = { score: 77, reasons: ['has records'] }
      const emp2Score: ReliabilityScore = { score: 50, reasons: ['neutral fallback from scorer'] }
      const expectedResult: ISuggestPartTimeShiftsResult = {
        weekStart: '2024-05-06',
        suggestions: [],
        meta: { generated: true },
      } as unknown as ISuggestPartTimeShiftsResult

      availabilityService.listForWeek.mockResolvedValue(availabilities as never)
      attendanceRepo.queryRecords.mockResolvedValue(attendanceRecords as never)
      mockedScorePartTimeReliability
        .mockReturnValueOnce(emp1Score as never)
        .mockReturnValueOnce(emp2Score as never)
      mockedBuildPartTimeShiftSuggestions.mockReturnValue(expectedResult)

      // Act
      const result = await service.suggest(weekStart)

      // Assert
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(1, [
        { employeeId: 'emp-1', status: 'present' },
      ])
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(2, [])

      const buildArg = mockedBuildPartTimeShiftSuggestions.mock.calls[0]?.[0]
      expect(buildArg?.scoresByEmployeeId.get('emp-1')).toEqual(emp1Score)
      expect(buildArg?.scoresByEmployeeId.get('emp-2')).toEqual(emp2Score)
      expect(buildArg?.scoresByEmployeeId.get('emp-2')).not.toEqual({
        score: PART_TIME_SHIFT_SUGGEST.NEUTRAL_SCORE,
        reasons: ['Chưa có lịch sử chấm công — điểm trung lập'],
      })

      expect(result).toEqual(expectedResult)
    })
  })
})