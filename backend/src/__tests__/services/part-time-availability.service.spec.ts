/// <reference types="jest" />

import { PartTimeAvailabilityService } from '../../services/part-time-availability.service';

jest.mock('@/configs/entities/attendance.config.ts', () => ({
  DAY_OF_WEEK_VALUES: [1, 2, 3, 4, 5, 6, 7],
}));

jest.mock('@/utils/employee/is-part-time-work-schedule.util.ts', () => ({
  isPartTimeWorkSchedule: jest.fn(),
}));

jest.mock('@/configs/entities/part-time-availability.config.ts', () => ({
  PART_TIME_AVAILABILITY_STATUS: {
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
}));

jest.mock('@/configs/messages/part-time-availability.message.ts', () => ({
  PART_TIME_AVAILABILITY_MESSAGES: {
    PAST_OR_CURRENT_WEEK_NOT_ALLOWED: 'PAST_OR_CURRENT_WEEK_NOT_ALLOWED',
    WEEK_ALREADY_ASSIGNED: 'WEEK_ALREADY_ASSIGNED',
    REJECT_REASON_REQUIRED: 'REJECT_REASON_REQUIRED',
    ASSIGN_INVALID_RANGE: 'ASSIGN_INVALID_RANGE',
    SHIFT_NOT_IN_SLOT: 'SHIFT_NOT_IN_SLOT',
    NOT_FOUND: 'NOT_FOUND',
    NOT_PART_TIME: 'NOT_PART_TIME',
  },
}));

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
  },
}));

jest.mock('@/utils/attendance/resolve-personal-employee-id.ts', () => ({
  resolvePersonalEmployeeId: jest.fn(),
}));

jest.mock('@/utils/part-time-availability/validate-availability-days.util.ts', () => ({
  assertSubmittedForAssign: jest.fn(),
  assertSubmittedForReview: jest.fn(),
  normalizeAvailabilityDays: jest.fn(),
  PART_TIME_AVAILABILITY_LAYERS: {
    SERVICE: 'SERVICE',
  },
  validateAvailabilityDays: jest.fn(),
}));

jest.mock('@/utils/part-time-availability.util.ts', () => ({
  getDateForWeekDay: jest.fn(),
  isPastOrCurrentAvailabilityWeek: jest.fn(),
  minutesToTime: jest.fn(),
  normalizeWeekStart: jest.fn(),
  parseTimeToMinutes: jest.fn(),
  shiftFitsAvailabilityDay: jest.fn(),
}));



jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    layer: string;

    constructor(message: string, statusCode: number, layer: string) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.layer = layer;
    }
  },
}));

jest.mock('../../services/audit.service', () => ({
  auditService: {
    log: jest.fn(),
  },
}));

import { isPartTimeWorkSchedule } from '@/utils/employee/is-part-time-work-schedule.util.ts';
import { PART_TIME_AVAILABILITY_STATUS } from '@/configs/entities/part-time-availability.config.ts';
import { PART_TIME_AVAILABILITY_MESSAGES } from '@/configs/messages/part-time-availability.message.ts';
import { resolvePersonalEmployeeId } from '@/utils/attendance/resolve-personal-employee-id.ts';
import {
  assertSubmittedForAssign,
  assertSubmittedForReview,
  normalizeAvailabilityDays,
  validateAvailabilityDays,
} from '@/utils/part-time-availability/validate-availability-days.util.ts';
import {
  getDateForWeekDay,
  isPastOrCurrentAvailabilityWeek,
  minutesToTime,
  normalizeWeekStart,
  parseTimeToMinutes,
  shiftFitsAvailabilityDay,
} from '@/utils/part-time-availability.util.ts';

import { auditService } from '../../services/audit.service';

type MockFn = jest.Mock;
type GenericRecord = Record<string, unknown>;

type MockAvailabilityRepo = {
  findByEmployeeAndWeek: jest.Mock;
  upsert: jest.Mock;
  listByWeek: jest.Mock;
  findById: jest.Mock;
  updateStatus: jest.Mock;
};

type MockEmployeeRepo = {
  findById: jest.Mock;
};

type MockEmployeeShiftRepo = {
  hasOverridesForEmployeeDates: jest.Mock;
  listByEmployeesAndDateRange: jest.Mock;
  replacePartTimeOverrides: jest.Mock;
};

type MockWorkingShiftRepo = {
  listAll: jest.Mock;
  create: jest.Mock;
};

const mockedIsPartTimeWorkSchedule = isPartTimeWorkSchedule as unknown as MockFn;
const mockedResolvePersonalEmployeeId = resolvePersonalEmployeeId as unknown as MockFn;
const mockedAssertSubmittedForAssign = assertSubmittedForAssign as unknown as MockFn;
const mockedAssertSubmittedForReview = assertSubmittedForReview as unknown as MockFn;
const mockedNormalizeAvailabilityDays = normalizeAvailabilityDays as unknown as MockFn;
const mockedValidateAvailabilityDays = validateAvailabilityDays as unknown as MockFn;
const mockedGetDateForWeekDay = getDateForWeekDay as unknown as MockFn;
const mockedIsPastOrCurrentAvailabilityWeek = isPastOrCurrentAvailabilityWeek as unknown as MockFn;
const mockedMinutesToTime = minutesToTime as unknown as MockFn;
const mockedNormalizeWeekStart = normalizeWeekStart as unknown as MockFn;
const mockedParseTimeToMinutes = parseTimeToMinutes as unknown as MockFn;
const mockedShiftFitsAvailabilityDay = shiftFitsAvailabilityDay as unknown as MockFn;

const mockedAuditServiceLog = (auditService as unknown as { log: MockFn }).log;

const createService = (): {
  service: PartTimeAvailabilityService;
  availabilityRepo: MockAvailabilityRepo;
  employeeRepo: MockEmployeeRepo;
  employeeShiftRepo: MockEmployeeShiftRepo;
  workingShiftRepo: MockWorkingShiftRepo;
} => {
  const availabilityRepo: MockAvailabilityRepo = {
    findByEmployeeAndWeek: jest.fn(),
    upsert: jest.fn(),
    listByWeek: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  const employeeRepo: MockEmployeeRepo = {
    findById: jest.fn(),
  };

  const employeeShiftRepo: MockEmployeeShiftRepo = {
    hasOverridesForEmployeeDates: jest.fn(),
    listByEmployeesAndDateRange: jest.fn(),
    replacePartTimeOverrides: jest.fn(),
  };

  const workingShiftRepo: MockWorkingShiftRepo = {
    listAll: jest.fn(),
    create: jest.fn(),
  };

  const service = new PartTimeAvailabilityService(
    availabilityRepo as never,
    employeeRepo as never,
    employeeShiftRepo as never,
    workingShiftRepo as never,
  );

  return {
    service,
    availabilityRepo,
    employeeRepo,
    employeeShiftRepo,
    workingShiftRepo,
  };
};

describe('PartTimeAvailabilityService.getMine', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;

    jest.clearAllMocks();
    mockedNormalizeWeekStart.mockReset();
    mockedNormalizeWeekStart.mockReturnValue('2025-02-03');
  });

  it('UTCID01 - returns availability for normalized week', async () => {
    const employeeId = 'emp-1';
    const weekStart = '2025-02-05';
    const expected: GenericRecord = { id: 'avail-1', employeeId, weekStart: '2025-02-03', days: [] };

    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(expected);

    const result = await service.getMine(employeeId, weekStart);

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(weekStart);
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith(employeeId, '2025-02-03');
    expect(result).toEqual(expected);
  });

  it('UTCID02 - propagates repository errors', async () => {
    const employeeId = 'emp-1';
    const weekStart = '2025-02-05';
    const error = new Error('repo failed');

    availabilityRepo.findByEmployeeAndWeek.mockRejectedValue(error);

    await expect(service.getMine(employeeId, weekStart)).rejects.toThrow('repo failed');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(weekStart);
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith(employeeId, '2025-02-03');
  });

  it('UTCID03 - propagates normalizeWeekStart errors', async () => {
    const employeeId = 'emp-1';
    const weekStart = 'bad-date';

    mockedNormalizeWeekStart.mockImplementation(() => {
      throw new Error('invalid week');
    });

    await expect(service.getMine(employeeId, weekStart)).rejects.toThrow('invalid week');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(weekStart);
    expect(availabilityRepo.findByEmployeeAndWeek).not.toHaveBeenCalled();
  });
});

describe('PartTimeAvailabilityService.upsertMine', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;
  let employeeRepo: MockEmployeeRepo;
  let employeeShiftRepo: MockEmployeeShiftRepo;
  let data: {
    weekStart: string;
    note: string;
    days: Array<{
      dayOfWeek: number;
      isBusyAllDay: boolean;
      slots: Array<{ startTime: number; endTime: number }>;
    }>;
  };

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;
    employeeRepo = setup.employeeRepo;
    employeeShiftRepo = setup.employeeShiftRepo;

    data = {
      weekStart: '2025-02-10',
      note: 'note',
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    };

    jest.clearAllMocks();
    mockedResolvePersonalEmployeeId.mockReset();
    mockedIsPartTimeWorkSchedule.mockReset();
    mockedIsPastOrCurrentAvailabilityWeek.mockReset();
    mockedNormalizeWeekStart.mockReset();
    mockedGetDateForWeekDay.mockReset();
    mockedNormalizeAvailabilityDays.mockReset();
    mockedValidateAvailabilityDays.mockReset();

    mockedResolvePersonalEmployeeId.mockResolvedValue('emp-1');
    employeeRepo.findById.mockResolvedValue({ id: 'emp-1', workSchedule: 'PT' });
    mockedIsPartTimeWorkSchedule.mockReturnValue(true);
    mockedIsPastOrCurrentAvailabilityWeek.mockReturnValue(false);
    mockedNormalizeWeekStart.mockReturnValue('2025-02-10');
    mockedGetDateForWeekDay.mockImplementation((weekStartArg: string, dayOfWeek: number) => `${weekStartArg}-D${dayOfWeek}`);
    employeeShiftRepo.hasOverridesForEmployeeDates.mockResolvedValue(false);
    mockedNormalizeAvailabilityDays.mockReturnValue(data.days);
    mockedValidateAvailabilityDays.mockReturnValue(undefined);
    availabilityRepo.upsert.mockResolvedValue({
      id: 'avail-1',
      employeeId: 'emp-1',
      weekStart: '2025-02-10',
      note: 'note',
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: data.days,
    });
  });

  it('UTCID01 - upserts submitted availability for future week', async () => {
    const result = await service.upsertMine('acct-1', data);

    expect(mockedResolvePersonalEmployeeId).toHaveBeenCalledWith('acct-1');
    expect(employeeRepo.findById).toHaveBeenCalledWith('emp-1');
    expect(mockedIsPartTimeWorkSchedule).toHaveBeenCalledWith({ id: 'emp-1', workSchedule: 'PT' });
    expect(mockedIsPastOrCurrentAvailabilityWeek).toHaveBeenCalledWith(data.weekStart);
    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith(data.weekStart);
    expect(employeeShiftRepo.hasOverridesForEmployeeDates).toHaveBeenCalledWith('emp-1', [
      '2025-02-10-D1',
      '2025-02-10-D2',
      '2025-02-10-D3',
      '2025-02-10-D4',
      '2025-02-10-D5',
      '2025-02-10-D6',
      '2025-02-10-D7',
    ]);
    expect(mockedNormalizeAvailabilityDays).toHaveBeenCalledWith(data.days);
    expect(mockedValidateAvailabilityDays).toHaveBeenCalledWith(data.days);
    expect(availabilityRepo.upsert).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      weekStart: '2025-02-10',
      note: 'note',
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: data.days,
    });
    expect(result).toEqual({
      id: 'avail-1',
      employeeId: 'emp-1',
      weekStart: '2025-02-10',
      note: 'note',
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: data.days,
    });
  });

  it('UTCID02 - throws when employee is not part time', async () => {
    employeeRepo.findById.mockResolvedValue({ id: 'emp-1', workSchedule: 'FT' });
    mockedIsPartTimeWorkSchedule.mockReturnValue(false);

    await expect(service.upsertMine('acct-1', data)).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_PART_TIME,
    });

    expect(mockedResolvePersonalEmployeeId).toHaveBeenCalledWith('acct-1');
    expect(employeeRepo.findById).toHaveBeenCalledWith('emp-1');
    expect(mockedIsPastOrCurrentAvailabilityWeek).not.toHaveBeenCalled();
    expect(availabilityRepo.upsert).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws when week is past or current', async () => {
    mockedIsPastOrCurrentAvailabilityWeek.mockReturnValue(true);

    await expect(service.upsertMine('acct-1', data)).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.PAST_OR_CURRENT_WEEK_NOT_ALLOWED,
    });

    expect(mockedIsPastOrCurrentAvailabilityWeek).toHaveBeenCalledWith(data.weekStart);
    expect(employeeShiftRepo.hasOverridesForEmployeeDates).not.toHaveBeenCalled();
    expect(availabilityRepo.upsert).not.toHaveBeenCalled();
  });

  it('UTCID04 - throws when week already has assigned shifts', async () => {
    employeeShiftRepo.hasOverridesForEmployeeDates.mockResolvedValue(true);

    await expect(service.upsertMine('acct-1', data)).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.WEEK_ALREADY_ASSIGNED,
    });

    expect(employeeShiftRepo.hasOverridesForEmployeeDates).toHaveBeenCalled();
    expect(mockedNormalizeAvailabilityDays).not.toHaveBeenCalled();
    expect(availabilityRepo.upsert).not.toHaveBeenCalled();
  });
});

describe('PartTimeAvailabilityService.listForWeek', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;
  let employeeShiftRepo: MockEmployeeShiftRepo;

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;
    employeeShiftRepo = setup.employeeShiftRepo;

    jest.clearAllMocks();
    mockedNormalizeWeekStart.mockReset();

    mockedNormalizeWeekStart.mockReturnValue('2025-02-10');
  });

  it('UTCID01 - returns weekly availabilities', async () => {
    const items = [
      { id: 'avail-1', employeeId: 'emp-1', weekStart: '2025-02-10', days: [] },
      { id: 'avail-2', employeeId: 'emp-2', weekStart: '2025-02-10', days: [] },
    ];

    availabilityRepo.listByWeek.mockResolvedValue(items);

    const result = await service.listForWeek('2025-02-11');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith('2025-02-11');
    expect(availabilityRepo.listByWeek).toHaveBeenCalledWith('2025-02-10');
    expect(result).toEqual(items);
  });

  it('UTCID02 - returns empty list when no availability exists', async () => {
    availabilityRepo.listByWeek.mockResolvedValue([]);

    const result = await service.listForWeek('2025-02-11');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith('2025-02-11');
    expect(availabilityRepo.listByWeek).toHaveBeenCalledWith('2025-02-10');
    expect(result).toEqual([]);
  });

  it('UTCID03 - propagates repository errors from listByWeek', async () => {
    availabilityRepo.listByWeek.mockRejectedValue(new Error('list failed'));

    await expect(service.listForWeek('2025-02-11')).rejects.toThrow('list failed');

    expect(availabilityRepo.listByWeek).toHaveBeenCalledWith('2025-02-10');
  });
});

describe('PartTimeAvailabilityService.getByEmployee', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;

    jest.clearAllMocks();
    mockedNormalizeWeekStart.mockReset();
    mockedNormalizeWeekStart.mockReturnValue('2025-02-10');
  });

  it('UTCID01 - returns employee availability for normalized week', async () => {
    const expected: GenericRecord = { id: 'avail-1', employeeId: 'emp-1', weekStart: '2025-02-10', days: [] };
    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(expected);

    const result = await service.getByEmployee('emp-1', '2025-02-11');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith('2025-02-11');
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith('emp-1', '2025-02-10');
    expect(result).toEqual(expected);
  });

  it('UTCID02 - propagates repository errors', async () => {
    availabilityRepo.findByEmployeeAndWeek.mockRejectedValue(new Error('find failed'));

    await expect(service.getByEmployee('emp-1', '2025-02-11')).rejects.toThrow('find failed');

    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith('emp-1', '2025-02-10');
  });

  it('UTCID03 - propagates normalization errors', () => {
    mockedNormalizeWeekStart.mockImplementation(() => {
      throw new Error('bad week');
    });

    expect(() => service.getByEmployee('emp-1', 'invalid')).toThrow('bad week');

    expect(mockedNormalizeWeekStart).toHaveBeenCalledWith('invalid');
    expect(availabilityRepo.findByEmployeeAndWeek).not.toHaveBeenCalled();
  });
});

describe('PartTimeAvailabilityService.approve', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;

    jest.clearAllMocks();
    mockedAssertSubmittedForReview.mockReset();
    mockedAssertSubmittedForReview.mockImplementation(() => undefined);
  });

  it('UTCID01 - approves submitted availability', async () => {
    const availability = { id: 'avail-1', status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED, days: [] };
    const updated = { ...availability, status: PART_TIME_AVAILABILITY_STATUS.APPROVED };

    availabilityRepo.findById.mockResolvedValue(availability);
    availabilityRepo.updateStatus.mockResolvedValue(updated);

    const result = await service.approve({
      availabilityId: 'avail-1',
      reviewedById: 'admin-1',
      rejectReason: null,
    } as never);

    expect(availabilityRepo.findById).toHaveBeenCalledWith('avail-1');
    expect(mockedAssertSubmittedForReview).toHaveBeenCalledWith(PART_TIME_AVAILABILITY_STATUS.SUBMITTED);
    expect(availabilityRepo.updateStatus).toHaveBeenCalledWith(
      'avail-1',
      PART_TIME_AVAILABILITY_STATUS.APPROVED,
      'admin-1',
    );
    expect(result).toEqual(updated);
  });

  it('UTCID02 - throws when availability is not found', async () => {
    availabilityRepo.findById.mockResolvedValue(null);

    await expect(
      service.approve({
        availabilityId: 'missing',
        reviewedById: 'admin-1',
        rejectReason: null,
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
    });

    expect(availabilityRepo.findById).toHaveBeenCalledWith('missing');
    expect(mockedAssertSubmittedForReview).not.toHaveBeenCalled();
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('UTCID03 - propagates invalid status errors from review assertion', async () => {
    availabilityRepo.findById.mockResolvedValue({
      id: 'avail-1',
      status: PART_TIME_AVAILABILITY_STATUS.REJECTED,
      days: [],
    });
    mockedAssertSubmittedForReview.mockImplementation(() => {
      throw new Error('invalid review status');
    });

    await expect(
      service.approve({
        availabilityId: 'avail-1',
        reviewedById: 'admin-1',
        rejectReason: null,
      } as never),
    ).rejects.toThrow('invalid review status');

    expect(mockedAssertSubmittedForReview).toHaveBeenCalledWith(PART_TIME_AVAILABILITY_STATUS.REJECTED);
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled();
  });
});

describe('PartTimeAvailabilityService.reject', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;

    jest.clearAllMocks();
    mockedAssertSubmittedForReview.mockReset();
    mockedAssertSubmittedForReview.mockImplementation(() => undefined);
  });

  it('UTCID01 - rejects submitted availability with trimmed reason', async () => {
    const availability = { id: 'avail-1', status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED, days: [] };
    const updated = {
      ...availability,
      status: PART_TIME_AVAILABILITY_STATUS.REJECTED,
      rejectReason: 'Need fixes',
    };

    availabilityRepo.findById.mockResolvedValue(availability);
    availabilityRepo.updateStatus.mockResolvedValue(updated);

    const result = await service.reject({
      availabilityId: 'avail-1',
      reviewedById: 'admin-1',
      rejectReason: '  Need fixes  ',
    } as never);

    expect(availabilityRepo.findById).toHaveBeenCalledWith('avail-1');
    expect(mockedAssertSubmittedForReview).toHaveBeenCalledWith(PART_TIME_AVAILABILITY_STATUS.SUBMITTED);
    expect(availabilityRepo.updateStatus).toHaveBeenCalledWith(
      'avail-1',
      PART_TIME_AVAILABILITY_STATUS.REJECTED,
      'admin-1',
      'Need fixes',
    );
    expect(result).toEqual(updated);
  });

  it('UTCID02 - throws when reject reason is missing or blank', async () => {
    availabilityRepo.findById.mockResolvedValue({
      id: 'avail-1',
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [],
    });

    await expect(
      service.reject({
        availabilityId: 'avail-1',
        reviewedById: 'admin-1',
        rejectReason: '   ',
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.REJECT_REASON_REQUIRED,
    });

    expect(mockedAssertSubmittedForReview).toHaveBeenCalledWith(PART_TIME_AVAILABILITY_STATUS.SUBMITTED);
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws when availability is not found', async () => {
    availabilityRepo.findById.mockResolvedValue(null);

    await expect(
      service.reject({
        availabilityId: 'missing',
        reviewedById: 'admin-1',
        rejectReason: 'reason',
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
    });

    expect(availabilityRepo.findById).toHaveBeenCalledWith('missing');
    expect(mockedAssertSubmittedForReview).not.toHaveBeenCalled();
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled();
  });
});

describe('PartTimeAvailabilityService.assignShifts', () => {
  let service: PartTimeAvailabilityService;
  let availabilityRepo: MockAvailabilityRepo;
  let employeeRepo: MockEmployeeRepo;
  let employeeShiftRepo: MockEmployeeShiftRepo;
  let workingShiftRepo: MockWorkingShiftRepo;
  let availability: {
    id: string;
    employeeId: string;
    weekStart: string;
    status: string;
    days: Array<{
      dayOfWeek: number;
      isBusyAllDay: boolean;
      slots: Array<{ startTime: number; endTime: number }>;
    }>;
  };

  beforeEach(() => {
    const setup = createService();

    service = setup.service;
    availabilityRepo = setup.availabilityRepo;
    employeeRepo = setup.employeeRepo;
    employeeShiftRepo = setup.employeeShiftRepo;
    workingShiftRepo = setup.workingShiftRepo;

    availability = {
      id: 'avail-1',
      employeeId: 'emp-1',
      weekStart: '2025-02-10',
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [
        { dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] },
        { dayOfWeek: 2, isBusyAllDay: false, slots: [{ startTime: 600, endTime: 780 }] },
      ],
    };

    jest.clearAllMocks();
    mockedAssertSubmittedForAssign.mockReset();
    mockedIsPartTimeWorkSchedule.mockReset();
    mockedNormalizeWeekStart.mockReset();
    mockedGetDateForWeekDay.mockReset();
    mockedParseTimeToMinutes.mockReset();
    mockedShiftFitsAvailabilityDay.mockReset();
    mockedAuditServiceLog.mockReset();
    mockedMinutesToTime.mockReset();

    mockedAssertSubmittedForAssign.mockImplementation(() => undefined);
    availabilityRepo.findById.mockResolvedValue(availability);
    employeeRepo.findById.mockResolvedValue({ id: 'emp-1', workSchedule: 'PT' });
    mockedIsPartTimeWorkSchedule.mockReturnValue(true);
    mockedNormalizeWeekStart.mockReturnValue('2025-02-10');
    mockedGetDateForWeekDay.mockImplementation((_weekStartArg: string, dayOfWeek: number) => `date-${dayOfWeek}`);
    mockedParseTimeToMinutes.mockImplementation((value: string) => {
      switch (value) {
        case '09:00':
          return 540;
        case '12:00':
          return 720;
        case '10:00':
          return 600;
        case '13:00':
          return 780;
        case '14:00':
          return 840;
        default:
          return undefined;
      }
    });
    mockedShiftFitsAvailabilityDay.mockReturnValue(true);
    workingShiftRepo.listAll.mockResolvedValue([{ id: 'shift-existing', startTime: 540, endTime: 720 }]);
    workingShiftRepo.create.mockResolvedValue({ id: 'shift-created' });
    employeeShiftRepo.replacePartTimeOverrides.mockResolvedValue(undefined);
    mockedAuditServiceLog.mockResolvedValue(undefined);
    mockedMinutesToTime.mockImplementation((minutes: number) => {
      switch (minutes) {
        case 540:
          return '09:00';
        case 720:
          return '12:00';
        case 600:
          return '10:00';
        case 780:
          return '13:00';
        case 840:
          return '14:00';
        default:
          return undefined;
      }
    });
  });

  it('UTCID01 - assigns valid shifts and skips day-off entries', async () => {
    workingShiftRepo.listAll.mockResolvedValue([
      { id: 'shift-existing', startTime: 540, endTime: 720 },
      { id: 'shift-existing-2', startTime: 600, endTime: 780 },
    ]);

    const result = await service.assignShifts({
      availabilityId: 'avail-1',
      createdById: 'admin-1',
      assignments: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 2, startTime: null, endTime: null },
      ],
    } as never);

    expect(availabilityRepo.findById).toHaveBeenCalledWith('avail-1');
    expect(mockedAssertSubmittedForAssign).toHaveBeenCalledWith(PART_TIME_AVAILABILITY_STATUS.SUBMITTED);
    expect(employeeRepo.findById).toHaveBeenCalledWith('emp-1');
    expect(mockedIsPartTimeWorkSchedule).toHaveBeenCalledWith({ id: 'emp-1', workSchedule: 'PT' });
    expect(mockedParseTimeToMinutes).toHaveBeenCalledWith('09:00');
    expect(mockedParseTimeToMinutes).toHaveBeenCalledWith('12:00');
    expect(mockedShiftFitsAvailabilityDay).toHaveBeenCalledWith({ startTime: 540, endTime: 720 }, availability.days[0]);
    expect(employeeShiftRepo.replacePartTimeOverrides).toHaveBeenCalledWith(
      'emp-1',
      ['date-1', 'date-2', 'date-3', 'date-4', 'date-5', 'date-6', 'date-7'],
      [
        {
          employeeId: 'emp-1',
          assignedDate: 'date-1',
          shiftId: 'shift-existing',
          createdById: 'admin-1',
        },
      ],
    );
    expect(mockedAuditServiceLog).toHaveBeenCalledWith({
      actorId: 'admin-1',
      targetEmployeeId: 'emp-1',
      action: 'PART_TIME_SHIFTS_ASSIGNED',
      newValue: {
        availabilityId: 'avail-1',
        weekStart: '2025-02-10',
        assigned: 1,
        skipped: 1,
      },
    });
    expect(result).toEqual({ assigned: 1, skipped: 1 });
  });

  it('UTCID02 - throws when availability is not found', async () => {
    availabilityRepo.findById.mockResolvedValue(null);

    await expect(
      service.assignShifts({
        availabilityId: 'missing',
        createdById: 'admin-1',
        assignments: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
    });

    expect(mockedAssertSubmittedForAssign).not.toHaveBeenCalled();
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled();
    expect(mockedAuditServiceLog).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws when assignment range is invalid', async () => {
    mockedParseTimeToMinutes.mockImplementation((value: string) => {
      switch (value) {
        case '12:00':
          return 720;
        case '09:00':
          return 540;
        default:
          return undefined;
      }
    });

    await expect(
      service.assignShifts({
        availabilityId: 'avail-1',
        createdById: 'admin-1',
        assignments: [{ dayOfWeek: 1, startTime: '12:00', endTime: '09:00' }],
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.ASSIGN_INVALID_RANGE,
    });

    expect(mockedParseTimeToMinutes).toHaveBeenCalledWith('12:00');
    expect(mockedParseTimeToMinutes).toHaveBeenCalledWith('09:00');
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled();
    expect(mockedAuditServiceLog).not.toHaveBeenCalled();
  });

  it('UTCID04 - throws when shift does not fit availability slot', async () => {
    mockedShiftFitsAvailabilityDay.mockReturnValue(false);

    await expect(
      service.assignShifts({
        availabilityId: 'avail-1',
        createdById: 'admin-1',
        assignments: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      } as never),
    ).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
    });

    expect(mockedShiftFitsAvailabilityDay).toHaveBeenCalledWith({ startTime: 540, endTime: 720 }, availability.days[0]);
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled();
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled();
  });
});

