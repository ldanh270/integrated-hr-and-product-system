/// <reference types="jest" />
import { jest } from '@jest/globals';

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    statusCode: number;

    source: string;

    constructor(message: string, statusCode: number, source: string) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.source = source;
    }
  },
}));

jest.mock('@/utils/schedule.util.ts', () => ({
  eachScheduleDate: jest.fn(),
  formatScheduleDateKey: jest.fn(),
  normalizeScheduleDate: jest.fn(),
  resolveShiftFromSchedule: jest.fn(),
}));



jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
  },
}));

import { ScheduleService } from '../../services/schedule.service';
import { AppError } from '@/utils/error.util.ts';
import {
  eachScheduleDate,
  formatScheduleDateKey,
  normalizeScheduleDate,
  resolveShiftFromSchedule,
} from '@/utils/schedule.util.ts';

import { HttpStatusCode } from '@/configs/system/http.config.ts';
import type {
  IEmployeeShiftRepository,
  IShiftScheduleRepository,
} from '@/types/shift.types.ts';

const mockedEachScheduleDate = eachScheduleDate as jest.MockedFunction<typeof eachScheduleDate>;
const mockedFormatScheduleDateKey = formatScheduleDateKey as jest.MockedFunction<
  typeof formatScheduleDateKey
>;
const mockedNormalizeScheduleDate = normalizeScheduleDate as jest.MockedFunction<
  typeof normalizeScheduleDate
>;
const mockedResolveShiftFromSchedule = resolveShiftFromSchedule as jest.MockedFunction<
  typeof resolveShiftFromSchedule
>;


type AssignScheduleInput = Parameters<ScheduleService['assignSchedule']>[0];
type AssignScheduleOutput = Awaited<ReturnType<ScheduleService['assignSchedule']>>;
type GetScheduleOutput = Awaited<ReturnType<ScheduleService['getScheduleForEmployee']>>;
type ListSchedulesOutput = Awaited<ReturnType<ScheduleService['listSchedulesForEmployee']>>;

type OverrideInput = Parameters<ScheduleService['overrideEmployeeShift']>[0];
type PreviewInput = Parameters<ScheduleService['previewGeneratedShifts']>[0];
type PreviewOutput = Awaited<ReturnType<ScheduleService['previewGeneratedShifts']>>;
type GenerateInput = Parameters<ScheduleService['generateShifts']>[0];

type AssignScheduleResult = NonNullable<AssignScheduleOutput>;
type ScheduleWithDays = NonNullable<GetScheduleOutput>;
type EmployeeShiftWithShift = Awaited<
  ReturnType<IEmployeeShiftRepository['listByEmployeesAndDateRange']>
>[number];

type PreviewResult = PreviewOutput;
type GenerateShiftAction = Awaited<ReturnType<IEmployeeShiftRepository['generateShiftForDate']>>;
type OverrideRepoResult = Awaited<ReturnType<IEmployeeShiftRepository['overrideShift']>>;
type GetScheduleForDateCallback = (date: Date) => Promise<GetScheduleOutput>;
type ResolvedPatternDay = NonNullable<ReturnType<typeof resolveShiftFromSchedule>>;

type ScheduleRepoMock = {
  assignSchedule: jest.MockedFunction<IShiftScheduleRepository['assignSchedule']>;
  getScheduleByEmployee: jest.MockedFunction<IShiftScheduleRepository['getScheduleByEmployee']>;
  listSchedulesByEmployee: jest.MockedFunction<IShiftScheduleRepository['listSchedulesByEmployee']>;
};

type EmployeeShiftRepoMock = {
  listByEmployeesAndDateRange: jest.MockedFunction<
    IEmployeeShiftRepository['listByEmployeesAndDateRange']
  >;
  overrideShift: jest.MockedFunction<IEmployeeShiftRepository['overrideShift']>;
  generateShiftForDate: jest.MockedFunction<IEmployeeShiftRepository['generateShiftForDate']>;
};

const createScheduleRepo = (): ScheduleRepoMock => ({
  assignSchedule: jest.fn() as jest.MockedFunction<IShiftScheduleRepository['assignSchedule']>,
  getScheduleByEmployee: jest.fn() as jest.MockedFunction<
    IShiftScheduleRepository['getScheduleByEmployee']
  >,
  listSchedulesByEmployee: jest.fn() as jest.MockedFunction<
    IShiftScheduleRepository['listSchedulesByEmployee']
  >,
});

const createEmployeeShiftRepo = (): EmployeeShiftRepoMock => ({
  listByEmployeesAndDateRange: jest.fn() as jest.MockedFunction<
    IEmployeeShiftRepository['listByEmployeesAndDateRange']
  >,
  overrideShift: jest.fn() as jest.MockedFunction<IEmployeeShiftRepository['overrideShift']>,
  generateShiftForDate: jest.fn() as jest.MockedFunction<
    IEmployeeShiftRepository['generateShiftForDate']
  >,
});

const createService = (
  scheduleRepo: ScheduleRepoMock,
  employeeShiftRepo: EmployeeShiftRepoMock,
): ScheduleService =>
  new ScheduleService(
    scheduleRepo as unknown as IShiftScheduleRepository,
    employeeShiftRepo as unknown as IEmployeeShiftRepository,
  );

function* makeDateGenerator(dates: Date[]): Generator<Date, void, unknown> {
  for (const date of dates) {
    yield date;
  }
}

const createResolvedPatternDay = (
  dayOfWeek: number,
  shiftId: string | null,
  shiftName: string | null,
  startTime: number | null,
  endTime: number | null,
): ResolvedPatternDay => ({
  dayOfWeek,
  shiftId,
  shift:
    shiftId && shiftName !== null && startTime !== null && endTime !== null
      ? {
          id: shiftId,
          name: shiftName,
          startTime,
          endTime,
        }
      : null,
});

describe('ScheduleService.assignSchedule', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - returns assigned schedule on success', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      templateId: 'tpl-1',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      createdById: 'admin-1',
    } as unknown as AssignScheduleInput;
    const assignedSchedule = {
      id: 'schedule-1',
      employeeId: 'emp-1',
      templateId: 'tpl-1',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      validTo: null,
      createdById: 'admin-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      cycleWeeks: 2,
      template: {
        id: 'tpl-1',
        name: 'Morning Template',
        description: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        isActive: true,
        createdById: 'admin-1',
        cycleWeeks: 2,
      },
      days: [],
    } as unknown as AssignScheduleResult;
    scheduleRepo.assignSchedule.mockResolvedValue(assignedSchedule);

    // Act
    const result = await service.assignSchedule(data);

    // Assert
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1);
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledWith(data);
    expect(result).toEqual(assignedSchedule);
  });

  it('UTCID02 - throws when repository rejects with validation-style error', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      templateId: null,
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      createdById: 'admin-1',
    } as unknown as AssignScheduleInput;
    const error = new AppError('Invalid schedule payload', 400, 'service');
    scheduleRepo.assignSchedule.mockRejectedValue(error);

    // Act
    const act = service.assignSchedule(data);

    // Assert
    await expect(act).rejects.toBe(error);
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledWith(data);
  });

  it('UTCID03 - throws when repository rejects with server error', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      templateId: 'tpl-1',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      createdById: 'admin-1',
    } as unknown as AssignScheduleInput;
    const error = new Error('Database failure');
    scheduleRepo.assignSchedule.mockRejectedValue(error);

    // Act
    const act = service.assignSchedule(data);

    // Assert
    await expect(act).rejects.toThrow('Database failure');
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledWith(data);
  });
});

describe('ScheduleService.getScheduleForEmployee', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - returns employee schedule on success', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const date = '2024-01-10';
    const schedule = {
      id: 'schedule-1',
      employeeId,
      templateId: 'tpl-1',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      validTo: null,
      createdById: 'admin-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      cycleWeeks: 1,
      days: [],
    } as unknown as ScheduleWithDays;
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(schedule);

    // Act
    const result = await service.getScheduleForEmployee(employeeId, date);

    // Assert
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(1);
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date);
    expect(result).toEqual(schedule);
  });

  it('UTCID02 - returns null when no schedule exists', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const date = '2024-01-10';
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(null);

    // Act
    const result = await service.getScheduleForEmployee(employeeId, date);

    // Assert
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date);
    expect(result).toBeNull();
  });

  it('UTCID03 - throws when repository fails', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const date = '2024-01-10';
    const error = new Error('Read failure');
    scheduleRepo.getScheduleByEmployee.mockRejectedValue(error);

    // Act
    const act = service.getScheduleForEmployee(employeeId, date);

    // Assert
    await expect(act).rejects.toThrow('Read failure');
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date);
  });
});

describe('ScheduleService.listSchedulesForEmployee', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - returns schedule list on success', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const schedules = [
      {
        id: 'schedule-1',
        employeeId,
        templateId: 'tpl-1',
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        cycleWeeks: 1,
        days: [],
      },
      {
        id: 'schedule-2',
        employeeId,
        templateId: 'tpl-2',
        validFrom: new Date('2024-02-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
        updatedAt: new Date('2024-02-01T00:00:00.000Z'),
        cycleWeeks: 2,
        days: [],
      },
    ] as unknown as ListSchedulesOutput;
    scheduleRepo.listSchedulesByEmployee.mockResolvedValue(schedules);

    // Act
    const result = await service.listSchedulesForEmployee(employeeId);

    // Assert
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledTimes(1);
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId);
    expect(result).toEqual(schedules);
  });

  it('UTCID02 - returns empty array when employee has no schedules', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const schedules = [] as unknown as ListSchedulesOutput;
    scheduleRepo.listSchedulesByEmployee.mockResolvedValue(schedules);

    // Act
    const result = await service.listSchedulesForEmployee(employeeId);

    // Assert
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId);
    expect(result).toEqual([]);
  });

  it('UTCID03 - throws when repository list fails', async () => {
    // Arrange
    const employeeId = 'emp-1';
    const error = new Error('List failure');
    scheduleRepo.listSchedulesByEmployee.mockRejectedValue(error);

    // Act
    const act = service.listSchedulesForEmployee(employeeId);

    // Assert
    await expect(act).rejects.toThrow('List failure');
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId);
  });
});


describe('ScheduleService.overrideEmployeeShift', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - returns override result on success', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      assignedDate: '2024-01-10',
      shiftId: 'shift-2',
      reason: 'Coverage',
    } as unknown as OverrideInput;
    const overrideResult = {
      id: 'override-1',
      employeeId: 'emp-1',
      shiftId: 'shift-2',
    } as OverrideRepoResult;
    employeeShiftRepo.overrideShift.mockResolvedValue(overrideResult);

    // Act
    const result = await service.overrideEmployeeShift(data);

    // Assert
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledTimes(1);
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledWith(data);
    expect(result).toEqual(overrideResult);
  });

  it('UTCID02 - throws when override repository rejects with bad request style error', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      assignedDate: '2024-01-10',
      shiftId: null,
      reason: 'Coverage',
    } as unknown as OverrideInput;
    const error = new AppError('Missing shift id', 400, 'service');
    employeeShiftRepo.overrideShift.mockRejectedValue(error);

    // Act
    const act = service.overrideEmployeeShift(data);

    // Assert
    await expect(act).rejects.toBe(error);
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledWith(data);
  });

  it('UTCID03 - throws when override repository fails with server error', async () => {
    // Arrange
    const data = {
      employeeId: 'emp-1',
      assignedDate: '2024-01-10',
      shiftId: 'shift-2',
      reason: 'Coverage',
    } as unknown as OverrideInput;
    const error = new Error('Override write failure');
    employeeShiftRepo.overrideShift.mockRejectedValue(error);

    // Act
    const act = service.overrideEmployeeShift(data);

    // Assert
    await expect(act).rejects.toThrow('Override write failure');
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledWith(data);
  });
});

describe('ScheduleService.previewGeneratedShifts', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - returns generated preview items with pending existing override and no_schedule statuses', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1', 'emp-2'],
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      createdById: 'admin-1',
    } as unknown as PreviewInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-02T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const date2 = new Date('2024-01-02T00:00:00.000Z');

    mockedNormalizeScheduleDate.mockImplementation((value: Date) => {
      const iso = new Date(value).toISOString();
      return iso === '2024-01-01T00:00:00.000Z' ? start : end;
    });

    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1, date2]));

    mockedFormatScheduleDateKey.mockImplementation((date: Date) => {
      const iso = date.toISOString();
      return iso === '2024-01-01T00:00:00.000Z' ? '2024-01-01' : '2024-01-02';
    });

    employeeShiftRepo.listByEmployeesAndDateRange.mockResolvedValue([
      {
        id: 'es-1',
        employeeId: 'emp-1',
        shiftId: 'shift-existing',
        scheduleId: 'schedule-existing',
        assignedDate: '2024-01-01',
        isOverride: false,
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdById: 'admin-1',
        shift: {
          id: 'shift-existing',
          name: 'Existing',
          startTime: 480,
          endTime: 1020,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          gracePeriodMinutes: 10,
          gpsLat: null,
          gpsLng: null,
          gpsRadiusMeters: 100,
          isActive: true,
          createdById: 'admin-1',
        },
      },
      {
        id: 'es-2',
        employeeId: 'emp-2',
        shiftId: 'shift-override',
        scheduleId: 'schedule-override',
        assignedDate: '2024-01-02',
        isOverride: true,
        revokedAt: null,
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdById: 'admin-1',
        shift: {
          id: 'shift-override',
          name: 'Override',
          startTime: 540,
          endTime: 1080,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          gracePeriodMinutes: 10,
          gpsLat: null,
          gpsLng: null,
          gpsRadiusMeters: 100,
          isActive: true,
          createdById: 'admin-1',
        },
      },
    ] as unknown as EmployeeShiftWithShift[]);

    scheduleRepo.getScheduleByEmployee.mockImplementation(async (employeeId: string) => ({
      id: employeeId === 'emp-1' ? 'schedule-1' : 'schedule-2',
      employeeId,
      templateId: employeeId === 'emp-1' ? 'tpl-1' : 'tpl-2',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      validTo: null,
      createdById: 'admin-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      cycleWeeks: 1,
      days: [],
    })) as unknown as jest.MockedFunction<IShiftScheduleRepository['getScheduleByEmployee']>;

    mockedResolveShiftFromSchedule.mockImplementation((schedule, date) => {
      const employeeId =
        schedule && typeof schedule === 'object' && 'employeeId' in schedule
          ? (schedule.employeeId as string | null)
          : null;
      const dateKey = new Date(date).toISOString().slice(0, 10);

      if (employeeId === 'emp-1' && dateKey === '2024-01-01') {
        return createResolvedPatternDay(1, 'shift-a', 'A', 480, 1020);
      }

      if (employeeId === 'emp-1' && dateKey === '2024-01-02') {
        return createResolvedPatternDay(2, 'shift-b', 'B', 540, 1080);
      }

      if (employeeId === 'emp-2' && dateKey === '2024-01-01') {
        return createResolvedPatternDay(1, null, null, null, null);
      }

      if (employeeId === 'emp-2' && dateKey === '2024-01-02') {
        return createResolvedPatternDay(2, 'shift-d', 'D', 600, 1140);
      }

      return null;
    });

    // Act
    const result = await service.previewGeneratedShifts(data);

    // Assert
    expect(mockedNormalizeScheduleDate).toHaveBeenCalledTimes(2);
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      data.employeeIds,
      start,
      end,
    );
    expect(mockedEachScheduleDate).toHaveBeenCalledTimes(2);
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(4);
    expect(result).toEqual([
      {
        employeeId: 'emp-1',
        items: [
          {
            date: '2024-01-01',
            shiftId: 'shift-a',
            shift: { id: 'shift-a', name: 'A', startTime: 480, endTime: 1020 },
            status: 'existing',
          },
          {
            date: '2024-01-02',
            shiftId: 'shift-b',
            shift: { id: 'shift-b', name: 'B', startTime: 540, endTime: 1080 },
            status: 'pending',
          },
        ],
      },
      {
        employeeId: 'emp-2',
        items: [
          {
            date: '2024-01-01',
            shiftId: null,
            shift: null,
            status: 'no_schedule',
          },
          {
            date: '2024-01-02',
            shiftId: 'shift-d',
            shift: { id: 'shift-d', name: 'D', startTime: 600, endTime: 1140 },
            status: 'override',
          },
        ],
      },
    ] as unknown as PreviewResult);
  });

  it('UTCID02 - throws AppError when end date is before start date', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-05',
      endDate: '2024-01-01',
      createdById: 'admin-1',
    } as unknown as PreviewInput;
    const start = new Date('2024-01-05T00:00:00.000Z');
    const end = new Date('2024-01-01T00:00:00.000Z');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);

    // Act
    const act = service.previewGeneratedShifts(data);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
      statusCode: HttpStatusCode.BAD_REQUEST,
      source: 'service',
    });
    expect(employeeShiftRepo.listByEmployeesAndDateRange).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws when employee shift lookup fails', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      createdById: 'admin-1',
    } as unknown as PreviewInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-02T00:00:00.000Z');
    const error = new Error('Range query failure');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    employeeShiftRepo.listByEmployeesAndDateRange.mockRejectedValue(error);

    // Act
    const act = service.previewGeneratedShifts(data);

    // Assert
    await expect(act).rejects.toThrow('Range query failure');
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      data.employeeIds,
      start,
      end,
    );
  });

  it('UTCID04 - throws when schedule lookup fails while building preview items', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      createdById: 'admin-1',
    } as unknown as PreviewInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-01T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const error = new Error('Schedule preview failure');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    employeeShiftRepo.listByEmployeesAndDateRange.mockResolvedValue([]);
    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1]));
    mockedFormatScheduleDateKey.mockReturnValue('2024-01-01');
    scheduleRepo.getScheduleByEmployee.mockRejectedValue(error);

    // Act
    const act = service.previewGeneratedShifts(data);

    // Assert
    await expect(act).rejects.toThrow('Schedule preview failure');
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith('emp-1', date1);
  });
});

describe('ScheduleService.generateShifts', () => {
  let scheduleRepo: ScheduleRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let service: ScheduleService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    scheduleRepo = createScheduleRepo();
    employeeShiftRepo = createEmployeeShiftRepo();
    service = createService(scheduleRepo, employeeShiftRepo);

    // Act

    // Assert
  });

  it('UTCID01 - generates shifts and counts created updated and skipped results', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      createdById: 'admin-1',
    } as unknown as GenerateInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-03T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const date2 = new Date('2024-01-02T00:00:00.000Z');
    const date3 = new Date('2024-01-03T00:00:00.000Z');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1, date2, date3]));

    scheduleRepo.getScheduleByEmployee
      .mockResolvedValueOnce({
        id: 'schedule-1',
        employeeId: 'emp-1',
        templateId: 'tpl-1',
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        cycleWeeks: 1,
        days: [],
      } as unknown as ScheduleWithDays)
      .mockResolvedValueOnce({
        id: 'schedule-2',
        employeeId: 'emp-1',
        templateId: 'tpl-1',
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        cycleWeeks: 1,
        days: [],
      } as unknown as ScheduleWithDays)
      .mockResolvedValueOnce({
        id: 'schedule-3',
        employeeId: 'emp-1',
        templateId: 'tpl-1',
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        cycleWeeks: 1,
        days: [],
      } as unknown as ScheduleWithDays);

    mockedResolveShiftFromSchedule
      .mockReturnValueOnce(createResolvedPatternDay(1, 'shift-1', 'Shift 1', 480, 1020))
      .mockReturnValueOnce(createResolvedPatternDay(2, 'shift-2', 'Shift 2', 540, 1080))
      .mockReturnValueOnce(null);

    employeeShiftRepo.generateShiftForDate
      .mockResolvedValueOnce('created' as GenerateShiftAction)
      .mockResolvedValueOnce('updated' as GenerateShiftAction);

    // Act
    const result = await service.generateShifts(data);

    // Assert
    expect(mockedEachScheduleDate).toHaveBeenCalledTimes(1);
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(3);
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledTimes(2);
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenNthCalledWith(
      1,
      'emp-1',
      date1,
      'shift-1',
      'schedule-1',
      'admin-1',
    );
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenNthCalledWith(
      2,
      'emp-1',
      date2,
      'shift-2',
      'schedule-2',
      'admin-1',
    );
    expect(result).toEqual({ created: 1, updated: 1, skipped: 1 });
  });

  it('UTCID02 - throws AppError when createdById is missing', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      createdById: null,
    } as unknown as GenerateInput;

    // Act
    const act = service.generateShifts(data);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: 'Thiếu thông tin người thực hiện',
      statusCode: HttpStatusCode.BAD_REQUEST,
      source: 'service',
    });
    expect(mockedNormalizeScheduleDate).not.toHaveBeenCalled();
    expect(employeeShiftRepo.generateShiftForDate).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws AppError when date range is invalid', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-05',
      endDate: '2024-01-01',
      createdById: 'admin-1',
    } as unknown as GenerateInput;
    const start = new Date('2024-01-05T00:00:00.000Z');
    const end = new Date('2024-01-01T00:00:00.000Z');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);

    // Act
    const act = service.generateShifts(data);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: 'Ngày kết thúc phải sau ngày bắt đầu',
      statusCode: HttpStatusCode.BAD_REQUEST,
      source: 'service',
    });
    expect(mockedEachScheduleDate).not.toHaveBeenCalled();
    expect(employeeShiftRepo.generateShiftForDate).not.toHaveBeenCalled();
  });

  it('UTCID04 - throws when schedule repository fails during generation', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      createdById: 'admin-1',
    } as unknown as GenerateInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-01T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const error = new Error('Schedule read failure');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1]));
    scheduleRepo.getScheduleByEmployee.mockRejectedValue(error);

    // Act
    const act = service.generateShifts(data);

    // Assert
    await expect(act).rejects.toThrow('Schedule read failure');
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith('emp-1', date1);
    expect(employeeShiftRepo.generateShiftForDate).not.toHaveBeenCalled();
  });

  it('UTCID05 - throws when shift generation repository fails', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      createdById: 'admin-1',
    } as unknown as GenerateInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-01T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const error = new Error('Generate write failure');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1]));
    scheduleRepo.getScheduleByEmployee.mockResolvedValue({
      id: 'schedule-1',
      employeeId: 'emp-1',
      templateId: 'tpl-1',
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      validTo: null,
      createdById: 'admin-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      cycleWeeks: 1,
      days: [],
    } as unknown as ScheduleWithDays);
    mockedResolveShiftFromSchedule.mockReturnValue(
      createResolvedPatternDay(1, 'shift-1', 'Shift 1', 480, 1020),
    );
    employeeShiftRepo.generateShiftForDate.mockRejectedValue(error);

    // Act
    const act = service.generateShifts(data);

    // Assert
    await expect(act).rejects.toThrow('Generate write failure');
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledWith(
      'emp-1',
      date1,
      'shift-1',
      'schedule-1',
      'admin-1',
    );
  });

  it('UTCID06 - uses null schedule id and increments skipped for unknown action', async () => {
    // Arrange
    const data = {
      employeeIds: ['emp-1'],
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      createdById: 'admin-1',
    } as unknown as GenerateInput;
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-02T00:00:00.000Z');
    const date1 = new Date('2024-01-01T00:00:00.000Z');
    const date2 = new Date('2024-01-02T00:00:00.000Z');

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end);
    mockedEachScheduleDate.mockImplementation(() => makeDateGenerator([date1, date2]));

    scheduleRepo.getScheduleByEmployee
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'schedule-2',
        employeeId: 'emp-1',
        templateId: 'tpl-1',
        validFrom: new Date('2024-01-01T00:00:00.000Z'),
        validTo: null,
        createdById: 'admin-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        cycleWeeks: 1,
        days: [],
      } as unknown as ScheduleWithDays);

    mockedResolveShiftFromSchedule
      .mockReturnValueOnce(createResolvedPatternDay(1, 'shift-1', 'Shift 1', 480, 1020))
      .mockReturnValueOnce(createResolvedPatternDay(2, null, null, null, null));

    employeeShiftRepo.generateShiftForDate.mockResolvedValueOnce(
      'ignored-status' as GenerateShiftAction,
    );

    // Act
    const result = await service.generateShifts(data);

    // Assert
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledTimes(1);
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledWith(
      'emp-1',
      date1,
      'shift-1',
      null,
      'admin-1',
    );
    expect(result).toEqual({ created: 0, updated: 0, skipped: 2 });
  });
});

