/// <reference types="jest" />
import { jest } from '@jest/globals';
import { PtShiftSuggestionService } from '../../services/pt-shift-suggestion.service';
import { PART_TIME_SHIFT_SUGGEST } from '@/configs/entities/part-time-availability.config.ts';
import type { IAttendanceRepository } from '@/types/attendance.types.ts';
import type {
  IPartTimeAvailabilityService,
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeShiftsResult,
} from '@/types/part-time-availability.types.ts';
import { buildPartTimeShiftSuggestions } from '@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts';
import { scorePartTimeReliability } from '@/utils/part-time-availability/score-part-time-reliability.util.ts';
import { normalizeWeekStart } from '@/utils/part-time-availability.util.ts';
import { formatScheduleDateKey } from '@/utils/schedule.util.ts';

jest.mock('@/configs/entities/part-time-availability.config.ts', () => ({
  PART_TIME_SHIFT_SUGGEST: {
    NEUTRAL_SCORE: 50,
    LOOKBACK_DAYS: 30,
  },
}));

jest.mock('@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts', () => ({
  buildPartTimeShiftSuggestions: jest.fn(),
}));

jest.mock('@/utils/part-time-availability/score-part-time-reliability.util.ts', () => ({
  scorePartTimeReliability: jest.fn(),
}));

jest.mock('@/utils/part-time-availability.util.ts', () => ({
  normalizeWeekStart: jest.fn(),
}));

jest.mock('@/utils/schedule.util.ts', () => ({
  formatScheduleDateKey: jest.fn(),
}));

type ReliabilityScore = {
  score: number;
  reasons: string[];
};

type AttendanceRecordItem = {
  employeeId: string;
  attendedAt: string;
};

type SuggestionResult = {
  weekStart: string;
  suggestions: Array<Record<string, unknown>>;
};

const mockedNormalizeWeekStart = normalizeWeekStart as jest.MockedFunction<typeof normalizeWeekStart>;
const mockedFormatScheduleDateKey = formatScheduleDateKey as jest.MockedFunction<typeof formatScheduleDateKey>;
const mockedScorePartTimeReliability =
  scorePartTimeReliability as jest.MockedFunction<typeof scorePartTimeReliability>;
const mockedBuildPartTimeShiftSuggestions =
  buildPartTimeShiftSuggestions as jest.MockedFunction<typeof buildPartTimeShiftSuggestions>;

describe('PtShiftSuggestionService', () => {
  let availabilityService: jest.Mocked<IPartTimeAvailabilityService>;
  let attendanceRepo: jest.Mocked<IAttendanceRepository>;
  let service: PtShiftSuggestionService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    availabilityService = {
      listForWeek: jest.fn<IPartTimeAvailabilityService['listForWeek']>(),
    } as unknown as jest.Mocked<IPartTimeAvailabilityService>;

    attendanceRepo = {
      queryRecords: jest.fn<IAttendanceRepository['queryRecords']>(),
    } as unknown as jest.Mocked<IAttendanceRepository>;

    service = new PtShiftSuggestionService(availabilityService, attendanceRepo);
  });

  describe('suggest', () => {
    beforeEach(() => {
      // Arrange
      mockedNormalizeWeekStart.mockReturnValue(new Date('2024-01-08T00:00:00.000Z'));
      mockedFormatScheduleDateKey.mockImplementation((value: Date) => {
        const iso = value.toISOString();
        return iso.startsWith('2024-01-08') ? 'formatted-normalized-2024-01-10' : `formatted-${iso}`;
      });
    });

    it('UTCID01 - returns shift suggestions with reliability scores for employees with availability', async () => {
      // Arrange
      const inputWeekStart = '2024-01-10';
      const formattedWeekStart = 'formatted-normalized-2024-01-10';
      // Duplicate availability rows verify that reliability is scored once per employee.
      const availabilities = [
        { employeeId: 'emp-1' },
        { employeeId: 'emp-2' },
        { employeeId: 'emp-1' },
      ] as unknown as IPartTimeWeeklyAvailability[];
      const attendanceRecords = [
        { employeeId: 'emp-1', attendedAt: '2024-01-01T08:00:00.000Z' },
        { employeeId: 'emp-1', attendedAt: '2024-01-02T08:00:00.000Z' },
        { employeeId: 'emp-2', attendedAt: '2024-01-03T08:00:00.000Z' },
      ] as AttendanceRecordItem[];
      const emp1Score: ReliabilityScore = { score: 90, reasons: ['Strong attendance'] };
      const emp2Score: ReliabilityScore = { score: 70, reasons: ['Average attendance'] };
      const builtResult: SuggestionResult = {
        weekStart: formattedWeekStart,
        suggestions: [{ employeeId: 'emp-1', assignedShift: 'MORNING' }],
      };

      availabilityService.listForWeek.mockResolvedValue(availabilities);
      attendanceRepo.queryRecords.mockResolvedValue(
        attendanceRecords as unknown as Awaited<ReturnType<IAttendanceRepository['queryRecords']>>,
      );
      mockedScorePartTimeReliability.mockReturnValueOnce(emp1Score as never).mockReturnValueOnce(emp2Score as never);
      mockedBuildPartTimeShiftSuggestions.mockReturnValue(
        builtResult as unknown as ISuggestPartTimeShiftsResult,
      );

      // Act
      const result = await service.suggest(inputWeekStart);

      // Assert
      expect(mockedNormalizeWeekStart).toHaveBeenCalledTimes(1);
      expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(inputWeekStart);

      expect(mockedFormatScheduleDateKey).toHaveBeenCalledTimes(1);
      expect(mockedFormatScheduleDateKey).toHaveBeenCalledWith(expect.any(Date));

      expect(availabilityService.listForWeek).toHaveBeenCalledTimes(1);
      expect(availabilityService.listForWeek).toHaveBeenCalledWith(formattedWeekStart);

      expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1);
      expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
        employeeIds: ['emp-1', 'emp-2'],
        startDate: expect.any(String),
        endDate: expect.any(String),
      });

      expect(mockedScorePartTimeReliability).toHaveBeenCalledTimes(2);
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(1, [
        { employeeId: 'emp-1', attendedAt: '2024-01-01T08:00:00.000Z' },
        { employeeId: 'emp-1', attendedAt: '2024-01-02T08:00:00.000Z' },
      ]);
      expect(mockedScorePartTimeReliability).toHaveBeenNthCalledWith(2, [
        { employeeId: 'emp-2', attendedAt: '2024-01-03T08:00:00.000Z' },
      ]);

      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledTimes(1);
      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledWith({
        weekStart: formattedWeekStart,
        availabilities,
        scoresByEmployeeId: expect.any(Map),
      });

      const buildArg = mockedBuildPartTimeShiftSuggestions.mock.calls[0]?.[0] as {
        weekStart: string;
        availabilities: IPartTimeWeeklyAvailability[];
        scoresByEmployeeId: Map<string, ReliabilityScore>;
      };

      expect(buildArg.scoresByEmployeeId.get('emp-1')).toEqual(emp1Score);
      expect(buildArg.scoresByEmployeeId.get('emp-2')).toEqual(emp2Score);
      expect(result).toEqual(builtResult);
    });

    it('UTCID02 - propagates error when availability service fails', async () => {
      // Arrange
      const inputWeekStart = '2024-01-10';
      const expectedError = new Error('availability lookup failed');

      availabilityService.listForWeek.mockRejectedValue(expectedError);

      // Act
      const act = service.suggest(inputWeekStart);

      // Assert
      await expect(act).rejects.toThrow('availability lookup failed');
      expect(mockedNormalizeWeekStart).toHaveBeenCalledTimes(1);
      expect(mockedFormatScheduleDateKey).toHaveBeenCalledTimes(1);
      expect(availabilityService.listForWeek).toHaveBeenCalledTimes(1);
      expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled();
      expect(mockedBuildPartTimeShiftSuggestions).not.toHaveBeenCalled();
    });

    it('UTCID03 - propagates error when attendance repository query fails', async () => {
      // Arrange
      const inputWeekStart = '2024-01-10';
      const formattedWeekStart = 'formatted-normalized-2024-01-10';
      const availabilities = [{ employeeId: 'emp-1' }] as unknown as IPartTimeWeeklyAvailability[];
      const expectedError = new Error('attendance query failed');

      availabilityService.listForWeek.mockResolvedValue(availabilities);
      attendanceRepo.queryRecords.mockRejectedValue(expectedError);

      // Act
      const act = service.suggest(inputWeekStart);

      // Assert
      await expect(act).rejects.toThrow('attendance query failed');
      expect(availabilityService.listForWeek).toHaveBeenCalledWith(formattedWeekStart);
      expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1);
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled();
      expect(mockedBuildPartTimeShiftSuggestions).not.toHaveBeenCalled();
    });

    it('UTCID04 - uses neutral reliability and skips attendance query when no availabilities exist', async () => {
      // Arrange
      const inputWeekStart = '2024-01-10';
      const formattedWeekStart = 'formatted-normalized-2024-01-10';
      const availabilities = [] as IPartTimeWeeklyAvailability[];
      const builtResult: SuggestionResult = {
        weekStart: formattedWeekStart,
        suggestions: [],
      };

      availabilityService.listForWeek.mockResolvedValue(availabilities);
      mockedBuildPartTimeShiftSuggestions.mockReturnValue(
        builtResult as unknown as ISuggestPartTimeShiftsResult,
      );

      // Act
      const result = await service.suggest(inputWeekStart);

      // Assert
      expect(availabilityService.listForWeek).toHaveBeenCalledWith(formattedWeekStart);
      expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
      expect(mockedScorePartTimeReliability).not.toHaveBeenCalled();
      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledTimes(1);
      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledWith({
        weekStart: formattedWeekStart,
        availabilities,
        scoresByEmployeeId: expect.any(Map),
      });

      const buildArg = mockedBuildPartTimeShiftSuggestions.mock.calls[0]?.[0] as {
        weekStart: string;
        availabilities: IPartTimeWeeklyAvailability[];
        scoresByEmployeeId: Map<string, ReliabilityScore>;
      };

      expect(buildArg.scoresByEmployeeId).toBeInstanceOf(Map);
      expect(buildArg.scoresByEmployeeId.size).toBe(0);
      expect(result).toEqual(builtResult);
    });

    it('UTCID05 - propagates error when suggestion builder fails after neutral reliability setup', async () => {
      // Arrange
      const inputWeekStart = '2024-01-10';
      const availabilities = [{ employeeId: 'emp-1' }] as unknown as IPartTimeWeeklyAvailability[];
      const attendanceRecords = [] as AttendanceRecordItem[];
      const neutralReliability: ReliabilityScore = {
        score: PART_TIME_SHIFT_SUGGEST.NEUTRAL_SCORE,
        reasons: ['Chưa có lịch sử chấm công — điểm trung lập'],
      };
      const expectedError = new Error('builder failed');

      availabilityService.listForWeek.mockResolvedValue(availabilities);
      attendanceRepo.queryRecords.mockResolvedValue(
        attendanceRecords as unknown as Awaited<ReturnType<IAttendanceRepository['queryRecords']>>,
      );
      mockedScorePartTimeReliability.mockReturnValue(neutralReliability as never);
      mockedBuildPartTimeShiftSuggestions.mockImplementation(() => {
        throw expectedError;
      });

      // Act
      const act = service.suggest(inputWeekStart);

      // Assert
      await expect(act).rejects.toThrow('builder failed');
      expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1);
      expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
        employeeIds: ['emp-1'],
        startDate: expect.any(String),
        endDate: expect.any(String),
      });
      expect(mockedScorePartTimeReliability).toHaveBeenCalledTimes(1);
      expect(mockedScorePartTimeReliability).toHaveBeenCalledWith([]);
      expect(mockedBuildPartTimeShiftSuggestions).toHaveBeenCalledTimes(1);
    });
  });
});
