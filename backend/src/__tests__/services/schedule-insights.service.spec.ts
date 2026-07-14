/// <reference types="jest" />
import { jest } from '@jest/globals';
import { ScheduleInsightsService } from '../../services/schedule-insights.service';
import type { IAttendanceRepository } from '@/types/attendance.types.ts';
import type {
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from '@/types/shift.types.ts';

jest.mock('@/configs/entities/attendance.config.ts', () => ({
  SCHEDULE_INSIGHTS: {
    DEFAULT_LOOKBACK_DAYS: 14,
    MIN_LOOKBACK_DAYS: 1,
    MAX_LOOKBACK_DAYS: 30,
  },
}));

jest.mock('@/utils/schedule/build-schedule-insights.util.ts', () => ({
  buildScheduleInsights: jest.fn(),
}));

jest.mock('@/utils/schedule/build-weekly-template-copilot.util.ts', () => ({
  buildSuggestedWeeklyTemplates: jest.fn(),
  simulateWeeklyTemplateDraft: jest.fn(),
}));

jest.mock('@/utils/schedule.util.ts', () => ({
  normalizeScheduleDate: jest.fn(),
}));

import { buildScheduleInsights } from '@/utils/schedule/build-schedule-insights.util.ts';
import {
  buildSuggestedWeeklyTemplates,
  simulateWeeklyTemplateDraft,
} from '@/utils/schedule/build-weekly-template-copilot.util.ts';
import { normalizeScheduleDate } from '@/utils/schedule.util.ts';

const mockedBuildScheduleInsights = jest.mocked(buildScheduleInsights);
const mockedBuildSuggestedWeeklyTemplates = jest.mocked(buildSuggestedWeeklyTemplates);
const mockedSimulateWeeklyTemplateDraft = jest.mocked(simulateWeeklyTemplateDraft);
const mockedNormalizeScheduleDate = jest.mocked(normalizeScheduleDate);

type MockedShiftScheduleRepository = jest.Mocked<IShiftScheduleRepository>;
type MockedAttendanceRepository = jest.Mocked<IAttendanceRepository>;
type MockedWorkingShiftRepository = jest.Mocked<IWorkingShiftRepository>;

const createScheduleRepo = (): MockedShiftScheduleRepository =>
  ({
    findEmployeeIdsWithActiveTemplateSchedule: jest.fn(),
    assignSchedule: jest.fn(),
    getScheduleByEmployee: jest.fn(),
    listSchedulesByEmployee: jest.fn(),
  }) as unknown as MockedShiftScheduleRepository;

const createAttendanceRepo = (): MockedAttendanceRepository =>
  ({
    queryRecords: jest.fn(),
  }) as unknown as MockedAttendanceRepository;

const createWorkingShiftRepo = (): MockedWorkingShiftRepository =>
  ({
    listAll: jest.fn(),
  }) as unknown as MockedWorkingShiftRepository;

describe('ScheduleInsightsService.getInsights', () => {
  let scheduleRepo: MockedShiftScheduleRepository;
  let attendanceRepo: MockedAttendanceRepository;
  let workingShiftRepo: MockedWorkingShiftRepository;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();

    jest.clearAllMocks();

    // Act
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);

    // Assert
    expect(service).toBeInstanceOf(ScheduleInsightsService);
  });

  it('UTCID01 - returns insights for active employees and attendance records', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-15T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-15T00:00:00.000Z');
    const records = [{ employeeId: 'emp-1', status: 'present' }];
    const builtInsights = { summary: 'mocked-insights' };

    mockedNormalizeScheduleDate
      .mockReturnValueOnce(normalizedEnd)
      .mockReturnValueOnce(normalizedStart);

    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue(['emp-1', 'emp-2']);
    attendanceRepo.queryRecords.mockResolvedValue(records as never);
    mockedBuildScheduleInsights.mockReturnValue(builtInsights as never);

    // Act
    const result = await service.getInsights(7);

    // Assert
    expect(mockedNormalizeScheduleDate).toHaveBeenCalledTimes(2);
    expect(scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule).toHaveBeenCalledWith(normalizedEnd);
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
      employeeIds: ['emp-1', 'emp-2'],
      startDate: new Date('2024-05-08T00:00:00.000Z').toISOString(),
      endDate: normalizedEnd.toISOString(),
    });
    expect(mockedBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 7,
      periodStart: new Date('2024-05-08T00:00:00.000Z'),
      periodEnd: normalizedEnd,
      employeeCount: 2,
      records,
    });
    expect(result).toBe(builtInsights);
  });

  it('UTCID02 - returns empty insights when no employees have active schedules', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-15T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-15T00:00:00.000Z');
    const builtInsights = { summary: 'empty-insights' };

    mockedNormalizeScheduleDate
      .mockReturnValueOnce(normalizedEnd)
      .mockReturnValueOnce(normalizedStart);

    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue([]);
    mockedBuildScheduleInsights.mockReturnValue(builtInsights as never);

    // Act
    const result = await service.getInsights(undefined);

    // Assert
    expect(scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule).toHaveBeenCalledWith(normalizedEnd);
    expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
    expect(mockedBuildScheduleInsights).toHaveBeenCalledWith({
      lookbackDays: 14,
      periodStart: new Date('2024-05-01T00:00:00.000Z'),
      periodEnd: normalizedEnd,
      employeeCount: 0,
      records: [],
    });
    expect(result).toBe(builtInsights);
  });

  it('UTCID03 - propagates error when schedule repository lookup fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-15T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-15T00:00:00.000Z');
    const repoError = new Error('schedule lookup failed');

    mockedNormalizeScheduleDate
      .mockReturnValueOnce(normalizedEnd)
      .mockReturnValueOnce(normalizedStart);

    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockRejectedValue(repoError);

    // Act
    const act = service.getInsights(5);

    // Assert
    await expect(act).rejects.toThrow('schedule lookup failed');
    expect(attendanceRepo.queryRecords).not.toHaveBeenCalled();
    expect(mockedBuildScheduleInsights).not.toHaveBeenCalled();
  });

  it('UTCID04 - propagates error when attendance query fails', async () => {
    // Arrange
    const normalizedEnd = new Date('2024-05-15T00:00:00.000Z');
    const normalizedStart = new Date('2024-05-15T00:00:00.000Z');
    const recordsError = new Error('attendance query failed');

    mockedNormalizeScheduleDate
      .mockReturnValueOnce(normalizedEnd)
      .mockReturnValueOnce(normalizedStart);

    scheduleRepo.findEmployeeIdsWithActiveTemplateSchedule.mockResolvedValue(['emp-1']);
    attendanceRepo.queryRecords.mockRejectedValue(recordsError);

    // Act
    const act = service.getInsights(100);

    // Assert
    await expect(act).rejects.toThrow('attendance query failed');
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith({
      employeeIds: ['emp-1'],
      startDate: new Date('2024-04-15T00:00:00.000Z').toISOString(),
      endDate: normalizedEnd.toISOString(),
    });
    expect(mockedBuildScheduleInsights).not.toHaveBeenCalled();
  });
});

describe('ScheduleInsightsService.suggestTemplates', () => {
  let scheduleRepo: MockedShiftScheduleRepository;
  let attendanceRepo: MockedAttendanceRepository;
  let workingShiftRepo: MockedWorkingShiftRepository;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();

    jest.clearAllMocks();

    // Act
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);

    // Assert
    expect(service).toBeInstanceOf(ScheduleInsightsService);
  });

  it('UTCID01 - returns suggested templates using insights and mapped shifts', async () => {
    // Arrange
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        extraField: 'ignored',
      },
      {
        id: 'shift-2',
        name: 'Night',
        startTime: '22:00',
        endTime: '06:00',
        isActive: false,
        extraField: 'ignored',
      },
    ];
    const suggested = { templates: [{ id: 'tpl-1' }] };

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockedBuildSuggestedWeeklyTemplates.mockReturnValue(suggested as never);

    // Act
    const result = await service.suggestTemplates(10);

    // Assert
    expect(service.getInsights).toHaveBeenCalledWith(10);
    expect(workingShiftRepo.listAll).toHaveBeenCalledTimes(1);
    expect(mockedBuildSuggestedWeeklyTemplates).toHaveBeenCalledWith({
      insights,
      shifts: [
        {
          id: 'shift-1',
          name: 'Morning',
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        },
        {
          id: 'shift-2',
          name: 'Night',
          startTime: '22:00',
          endTime: '06:00',
          isActive: false,
        },
      ],
    });
    expect(result).toBe(suggested);
  });

  it('UTCID02 - propagates error when getInsights fails', async () => {
    // Arrange
    const insightsError = new Error('insights failed');

    jest.spyOn(service, 'getInsights').mockRejectedValue(insightsError);

    // Act
    const act = service.suggestTemplates(10);

    // Assert
    await expect(act).rejects.toThrow('insights failed');
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled();
    expect(mockedBuildSuggestedWeeklyTemplates).not.toHaveBeenCalled();
  });

  it('UTCID03 - propagates error when working shift repository fails', async () => {
    // Arrange
    const insights = { summary: 'insights' };
    const shiftsError = new Error('shift list failed');

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockRejectedValue(shiftsError);

    // Act
    const act = service.suggestTemplates(12);

    // Assert
    await expect(act).rejects.toThrow('shift list failed');
    expect(service.getInsights).toHaveBeenCalledWith(12);
    expect(mockedBuildSuggestedWeeklyTemplates).not.toHaveBeenCalled();
  });

  it('UTCID04 - propagates error when template builder fails', async () => {
    // Arrange
    const insights = { summary: 'insights' };
    const shifts = [
      {
        id: 'shift-1',
        name: 'Morning',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    ];
    const builderError = new Error('template builder failed');

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockedBuildSuggestedWeeklyTemplates.mockImplementation(() => {
      throw builderError;
    });

    // Act
    const act = service.suggestTemplates(9);

    // Assert
    await expect(act).rejects.toThrow('template builder failed');
    expect(mockedBuildSuggestedWeeklyTemplates).toHaveBeenCalledTimes(1);
  });
});

describe('ScheduleInsightsService.simulateTemplate', () => {
  let scheduleRepo: MockedShiftScheduleRepository;
  let attendanceRepo: MockedAttendanceRepository;
  let workingShiftRepo: MockedWorkingShiftRepository;
  let service: ScheduleInsightsService;

  beforeEach(() => {
    // Arrange
    scheduleRepo = createScheduleRepo();
    attendanceRepo = createAttendanceRepo();
    workingShiftRepo = createWorkingShiftRepo();

    jest.clearAllMocks();

    // Act
    service = new ScheduleInsightsService(scheduleRepo, attendanceRepo, workingShiftRepo);

    // Assert
    expect(service).toBeInstanceOf(ScheduleInsightsService);
  });

  it('UTCID01 - returns simulated template result using insights and shift name map', async () => {
    // Arrange
    const draft = {
      lookbackDays: 8,
      assignments: [{ dayOfWeek: 1, shiftId: 'shift-1' }],
    };
    const insights = { summary: 'insights' };
    const shifts = [
      { id: 'shift-1', name: 'Morning', startTime: '09:00', endTime: '17:00', isActive: true },
      { id: 'shift-2', name: 'Night', startTime: '22:00', endTime: '06:00', isActive: true },
    ];
    const simulated = { projectedCoverage: 95 };

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockedSimulateWeeklyTemplateDraft.mockReturnValue(simulated as never);

    // Act
    const result = await service.simulateTemplate(draft as never);

    // Assert
    expect(service.getInsights).toHaveBeenCalledWith(8);
    expect(workingShiftRepo.listAll).toHaveBeenCalledTimes(1);
    expect(mockedSimulateWeeklyTemplateDraft).toHaveBeenCalledTimes(1);

    const simulateArg = mockedSimulateWeeklyTemplateDraft.mock.calls[0]?.[0];

    expect(simulateArg).toBeDefined();
    expect(simulateArg).toEqual(
      expect.objectContaining({
        draft,
        insights,
        shiftNamesById: expect.any(Map),
      }),
    );

    const shiftNamesById = simulateArg?.shiftNamesById;

    expect(shiftNamesById).toBeInstanceOf(Map);
    expect(Array.from(shiftNamesById?.entries() ?? [])).toEqual([
      ['shift-1', 'Morning'],
      ['shift-2', 'Night'],
    ]);
    expect(result).toBe(simulated);
  });

  it('UTCID02 - propagates error when getInsights fails', async () => {
    // Arrange
    const draft = {
      lookbackDays: 5,
      assignments: [],
    };
    const insightsError = new Error('insights failed');

    jest.spyOn(service, 'getInsights').mockRejectedValue(insightsError);

    // Act
    const act = service.simulateTemplate(draft as never);

    // Assert
    await expect(act).rejects.toThrow('insights failed');
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled();
    expect(mockedSimulateWeeklyTemplateDraft).not.toHaveBeenCalled();
  });

  it('UTCID03 - propagates error when working shift repository fails', async () => {
    // Arrange
    const draft = {
      lookbackDays: 6,
      assignments: [{ dayOfWeek: 2, shiftId: 'shift-1' }],
    };
    const insights = { summary: 'insights' };
    const shiftsError = new Error('shift list failed');

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockRejectedValue(shiftsError);

    // Act
    const act = service.simulateTemplate(draft as never);

    // Assert
    await expect(act).rejects.toThrow('shift list failed');
    expect(service.getInsights).toHaveBeenCalledWith(6);
    expect(mockedSimulateWeeklyTemplateDraft).not.toHaveBeenCalled();
  });

  it('UTCID04 - propagates error when simulator utility fails', async () => {
    // Arrange
    const draft = {
      lookbackDays: 7,
      assignments: [{ dayOfWeek: 3, shiftId: 'shift-2' }],
    };
    const insights = { summary: 'insights' };
    const shifts = [
      { id: 'shift-2', name: 'Night', startTime: '22:00', endTime: '06:00', isActive: true },
    ];
    const simulatorError = new Error('simulation failed');

    jest.spyOn(service, 'getInsights').mockResolvedValue(insights as never);
    workingShiftRepo.listAll.mockResolvedValue(shifts as never);
    mockedSimulateWeeklyTemplateDraft.mockImplementation(() => {
      throw simulatorError;
    });

    // Act
    const act = service.simulateTemplate(draft as never);

    // Assert
    await expect(act).rejects.toThrow('simulation failed');
    expect(mockedSimulateWeeklyTemplateDraft).toHaveBeenCalledTimes(1);
  });
});