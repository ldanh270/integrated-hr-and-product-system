/// <reference types="jest" />
import { jest } from '@jest/globals';

jest.mock('@/configs/entities/attendance.config.ts', () => ({
  SCHEDULE_INSIGHTS: {
    DEFAULT_LOOKBACK_DAYS: 7,
    MIN_LOOKBACK_DAYS: 1,
    MAX_LOOKBACK_DAYS: 30,
  },
}));

jest.mock('@/utils/schedule.util.ts', () => ({
  normalizeScheduleDate: jest.fn(),
  buildScheduleInsights: jest.fn(),
  buildSuggestedWeeklyTemplates: jest.fn(),
  simulateWeeklyTemplateDraft: jest.fn(),
}));

import { ScheduleInsightsService } from '../../services/schedule-insights.service';
import type { IAttendanceRepository } from '@/types/attendance.types.ts';
import type {
  ISimulateWeeklyTemplateDraft,
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from '@/types/shift.types.ts';
import {
  buildScheduleInsights,
  buildSuggestedWeeklyTemplates,
  normalizeScheduleDate,
  simulateWeeklyTemplateDraft,
} from '@/utils/schedule.util.ts';

const mockBuildScheduleInsights = buildScheduleInsights as jest.MockedFunction<
  typeof buildScheduleInsights
>;
const mockBuildSuggestedWeeklyTemplates =
  buildSuggestedWeeklyTemplates as jest.MockedFunction<typeof buildSuggestedWeeklyTemplates>;
const mockSimulateWeeklyTemplateDraft =
  simulateWeeklyTemplateDraft as jest.MockedFunction<typeof simulateWeeklyTemplateDraft>;
const mockNormalizeScheduleDate = normalizeScheduleDate as jest.MockedFunction<
  typeof normalizeScheduleDate
>;

type FindEmployeeIdsWithActiveTemplateSchedule =
  IShiftScheduleRepository['findEmployeeIdsWithActiveTemplateSchedule'];
type QueryRecords = IAttendanceRepository['queryRecords'];
type ListAllWorkingShifts = IWorkingShiftRepository['listAll'];

type MockScheduleRepo = IShiftScheduleRepository & {
  findEmployeeIdsWithActiveTemplateSchedule: jest.MockedFunction<FindEmployeeIdsWithActiveTemplateSchedule>;
};

type MockAttendanceRepo = IAttendanceRepository & {
  queryRecords: jest.MockedFunction<QueryRecords>;
};

type MockWorkingShiftRepo = IWorkingShiftRepository & {
  listAll: jest.MockedFunction<ListAllWorkingShifts>;
};

const createScheduleRepo = (): MockScheduleRepo =>
  ({
    findEmployeeIdsWithActiveTemplateSchedule: jest.fn(),
  }) as unknown as MockScheduleRepo;

const createAttendanceRepo = (): MockAttendanceRepo =>
  ({
    queryRecords: jest.fn(),
  }) as unknown as MockAttendanceRepo;

const createWorkingShiftRepo = (): MockWorkingShiftRepo =>
  ({
    listAll: jest.fn(),
  }) as unknown as MockWorkingShiftRepo;

describe('ScheduleInsightsService.getInsights', () => {
  let scheduleRepo: MockScheduleRepo;
  let attendanceRepo: MockAttendanceRepo;
  let workingShiftRepo: MockWorkingShiftRepo;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);
  });

  it('UTCID01 - returns insights for employees with attendance records', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const mockRecords = [{ employeeId: 'emp-1' }, { employeeId: 'emp-2' }];
    const mockInsights = { summary: 'insights-result' };

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue(['emp-1', 'emp-2']);
    attendanceRepo.queryRecords.mockResolvedValue(mockRecords as never);
    mockBuildScheduleInsights.mockReturnValue(mockInsights as never);

    // Act
    const result = await service.getInsights(5);

    // Assert
    expect(mockNormalizeScheduleDate).toHaveBeenCalledTimes(2);
    expect(scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule).toHaveBeenCalledWith(normalizedEnd);
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
      employeeIds: ['emp-1', 'emp-2'],
      startDate: '2024-05-05T00:00:00.000Z',
      endDate: '2024-05-10T00:00:00.000Z',
    });
    expect(mockBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 5,
      periodStart: normalizedStart,
      periodEnd: normalizedEnd,
      employeeCount: 2,
      records: mockRecords,
    });
    expect(result).toEqual(mockInsights);
  });

  it('UTCID02 - returns empty insights when no active employees are found', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const emptyInsights = { summary: 'empty-insights' };

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(emptyInsights as never);

    // Act
    const result = await service.getInsights(undefined);

    // Assert
    expect(scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule).toHaveBeenCalledWith(normalizedEnd);
    expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
    expect(mockBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 7,
      periodStart: normalizedStart,
      periodEnd: normalizedEnd,
      employeeCount: 0,
      records: [],
    });
    expect(result).toEqual(emptyInsights);
  });

  it('UTCID03 - rejects when schedule repository fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const repoError = new Error('schedule repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockRejectedValue(repoError);

    // Act
    const act = service.getInsights(3);

    // Assert
    await expect(act).rejects.toThrow('schedule repo failure');
    expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
    expect(mockBuildScheduleInsights).not.toHaveBeenCalled();
  });

  it('UTCID04 - rejects when attendance repository fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const repoError = new Error('attendance repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue(['emp-1']);
    attendanceRepo.queryRecords.mockRejectedValue(repoError);

    // Act
    const act = service.getInsights(3);

    // Assert
    await expect(act).rejects.toThrow('attendance repo failure');
    expect(mockBuildScheduleInsights).not.toHaveBeenCalled();
  });

  it('UTCID05 - clamps lookback days to configured bounds and floors decimal values', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const mockInsights = { summary: 'clamped-insights' };

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(mockInsights as never);

    // Act
    const result = await service.getInsights(99.8);

    // Assert
    expect(mockBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 30,
      periodStart: normalizedStart,
      periodEnd: normalizedEnd,
      employeeCount: 0,
      records: [],
    });
    expect(result).toEqual(mockInsights);
  });
});

describe('ScheduleInsightsService.suggestTemplates', () => {
  let scheduleRepo: MockScheduleRepo;
  let attendanceRepo: MockAttendanceRepo;
  let workingShiftRepo: MockWorkingShiftRepo;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);
  });

  it('UTCID01 - returns suggested templates using insights and mapped shifts', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '08:00',
        endTime: '17:00',
        isActive: true,
        createdAt: 'ignored',
      },
      {
        id: 'shift-2',
        name: 'Night',
        startTime: '20:00',
        endTime: '05:00',
        isActive: false,
        deletedAt: null,
      },
    ];
    const suggestionResult = { templates: [{ id: 'tpl-1' }] };

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockBuildSuggestedWeeklyTemplates.mockReturnValue(suggestionResult as never);

    // Act
    const result = await service.suggestTemplates(10);

    // Assert
    expect(mockBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 10,
      periodStart: normalizedStart,
      periodEnd: normalizedEnd,
      employeeCount: 0,
      records: [],
    });
    expect(workingShiftRepo.listAll).toHaveBeenCalledTimes(1);
    expect(mockBuildSuggestedWeeklyTemplates).toHaveBeenCalledWith({
      insights,
      shifts: [
        {
          id: 'shift-1',
          name: 'Morning',
          startTime: '08:00',
          endTime: '17:00',
          isActive: true,
        },
        {
          id: 'shift-2',
          name: 'Night',
          startTime: '20:00',
          endTime: '05:00',
          isActive: false,
        },
      ],
    });
    expect(result).toEqual(suggestionResult);
  });

  it('UTCID02 - rejects when getInsights flow fails via schedule repository error', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const repoError = new Error('schedule repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockRejectedValue(repoError);

    // Act
    const act = service.suggestTemplates(5);

    // Assert
    await expect(act).rejects.toThrow('schedule repo failure');
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled();
    expect(mockBuildSuggestedWeeklyTemplates).not.toHaveBeenCalled();
  });

  it('UTCID03 - rejects when working shift repository fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const repoError = new Error('working shift repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockRejectedValue(repoError);

    // Act
    const act = service.suggestTemplates(5);

    // Assert
    await expect(act).rejects.toThrow('working shift repo failure');
    expect(mockBuildSuggestedWeeklyTemplates).not.toHaveBeenCalled();
  });

  it('UTCID04 - rejects when suggestion builder fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '08:00',
        endTime: '17:00',
        isActive: true,
      },
    ];
    const builderError = new Error('suggestion build failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockBuildSuggestedWeeklyTemplates.mockImplementation(() => {
      throw builderError;
    });

    // Act
    const act = service.suggestTemplates(5);

    // Assert
    await expect(act).rejects.toThrow('suggestion build failure');
  });
});

describe('ScheduleInsightsService.simulateTemplate', () => {
  let scheduleRepo: MockScheduleRepo;
  let attendanceRepo: MockAttendanceRepo;
  let workingShiftRepo: MockWorkingShiftRepo;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();

    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);
  });

  it('UTCID01 - returns simulation result using insights and shift name map', async () => {
    // Arrange
    const draft = {
      lookbackDays: 14,
      cycleWeeks: 1,
      weeks: [],
      assignments: [
        { dayOfWeek: 1, shiftId: 'shift-1' },
        { dayOfWeek: 2, shiftId: 'shift-2' },
      ],
    } as unknown as ISimulateWeeklyTemplateDraft;
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '08:00',
        endTime: '17:00',
        isActive: true,
      },
      {
        id: 'shift-2',
        name: 'Evening',
        startTime: '13:00',
        endTime: '22:00',
        isActive: true,
      },
    ];
    const simulationResult = { score: 92 };

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockSimulateWeeklyTemplateDraft.mockReturnValue(simulationResult as never);

    // Act
    const result = await service.simulateTemplate(draft);

    // Assert
    expect(mockBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 14,
      periodStart: normalizedStart,
      periodEnd: normalizedEnd,
      employeeCount: 0,
      records: [],
    });
    expect(workingShiftRepo.listAll).toHaveBeenCalledTimes(1);
    expect(mockSimulateWeeklyTemplateDraft).toHaveBeenCalledTimes(1);

    const simulateArg = mockSimulateWeeklyTemplateDraft.mock.calls[0][0];
    expect(simulateArg.draft).toEqual(draft);
    expect(simulateArg.insights).toEqual(insights);
    expect(simulateArg.shiftNamesById).toBeInstanceOf(Map);
    expect((simulateArg.shiftNamesById as Map<string, string>).get('shift-1')).toBe('Morning');
    expect((simulateArg.shiftNamesById as Map<string, string>).get('shift-2')).toBe('Evening');
    expect(result).toEqual(simulationResult);
  });

  it('UTCID02 - rejects when getInsights flow fails via attendance repository error', async () => {
    // Arrange
    const draft = {
      lookbackDays: 14,
      cycleWeeks: 1,
      weeks: [],
      assignments: [],
    } as unknown as ISimulateWeeklyTemplateDraft;
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const repoError = new Error('attendance repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue(['emp-1']);
    attendanceRepo.queryRecords.mockRejectedValue(repoError);

    // Act
    const act = service.simulateTemplate(draft);

    // Assert
    await expect(act).rejects.toThrow('attendance repo failure');
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled();
    expect(mockSimulateWeeklyTemplateDraft).not.toHaveBeenCalled();
  });

  it('UTCID03 - rejects when working shift repository fails', async () => {
    // Arrange
    const draft = {
      lookbackDays: 14,
      cycleWeeks: 1,
      weeks: [],
      assignments: [],
    } as unknown as ISimulateWeeklyTemplateDraft;
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const repoError = new Error('working shift repo failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockRejectedValue(repoError);

    // Act
    const act = service.simulateTemplate(draft);

    // Assert
    await expect(act).rejects.toThrow('working shift repo failure');
    expect(mockSimulateWeeklyTemplateDraft).not.toHaveBeenCalled();
  });

  it('UTCID04 - rejects when simulation builder fails', async () => {
    // Arrange
    const draft = {
      lookbackDays: 14,
      cycleWeeks: 1,
      weeks: [],
      assignments: [{ dayOfWeek: 1, shiftId: 'shift-1' }],
    } as unknown as ISimulateWeeklyTemplateDraft;
    const normalizedEnd = new Date('2024-05-10T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-10T00:00:00.000Z');
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '08:00',
        endTime: '17:00',
        isActive: true,
      },
    ];
    const builderError = new Error('simulation build failure');

    mockNormalizeScheduleDate.mockReturnValueOnce(normalizedEnd).mockReturnValueOnce(normalizedStart);
    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockBuildScheduleInsights.mockReturnValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockSimulateWeeklyTemplateDraft.mockImplementation(() => {
      throw builderError;
    });

    // Act
    const act = service.simulateTemplate(draft);

    // Assert
    await expect(act).rejects.toThrow('simulation build failure');
  });
});