/// <reference types="jest" />
import { jest } from '@jest/globals';
import { AttendanceService } from '../../services/attendance.service';
import { isPartTimeWorkSchedule } from '@/utils/employee/is-part-time-work-schedule.util.ts';
import { ATTENDANCE_ERROR_MESSAGES } from '@/configs/messages/attendance.message.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import { ATTENDANCE_LAYERS } from '@/constants/attendance.constants.ts';
import { computeAttendanceMetrics } from '@/utils/attendance/attendance-metrics.util.ts';
import { assertWithinShiftGps } from '@/utils/attendance/attendance-gps.util.ts';
import {
  findActiveAttendanceRecord,
  normalizeAttendanceDate,
} from '@/utils/attendance/attendance-record.util.ts';
import {
  assertCheckInWindow,
  getMinutesFromDateTime,
  isActualShiftMatched,
  isBeforeCheckOutWindow,
  isWithinShiftSelectionWindow,
} from '@/utils/attendance/attendance-shift.util.ts';
import { AppError } from '@/utils/error.util.ts';
import { resolveShiftFromSchedule } from '@/utils/schedule.util.ts';

jest.mock('@/utils/employee/is-part-time-work-schedule.util.ts', () => ({
  isPartTimeWorkSchedule: jest.fn(),
}));

jest.mock('@/configs/messages/attendance.message.ts', () => ({
  ATTENDANCE_ERROR_MESSAGES: {
    ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
    PT_NO_ASSIGNED_SHIFT: 'PT_NO_ASSIGNED_SHIFT',
    SHIFT_NOT_FOUND: 'SHIFT_NOT_FOUND',
    NO_SCHEDULE_TODAY: 'NO_SCHEDULE_TODAY',
    CHECK_OUT_BEFORE_IN: 'CHECK_OUT_BEFORE_IN',
    CHECK_OUT_TOO_EARLY: 'CHECK_OUT_TOO_EARLY',
  },
}));

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
  },
}));

jest.mock('@/constants/attendance.constants.ts', () => ({
  ATTENDANCE_LAYERS: {
    SERVICE: 'SERVICE',
  },
}));

jest.mock('@/types/attendance.types.ts', () => ({}));
jest.mock('@/types/shift.types.ts', () => ({}));
jest.mock('@/types/employee.types.ts', () => ({}));

jest.mock('@/utils/attendance/attendance-metrics.util.ts', () => ({
  computeAttendanceMetrics: jest.fn(),
}));

jest.mock('@/utils/attendance/attendance-gps.util.ts', () => ({
  assertWithinShiftGps: jest.fn(),
}));

jest.mock('@/utils/attendance/attendance-record.util.ts', () => ({
  findActiveAttendanceRecord: jest.fn(),
  normalizeAttendanceDate: jest.fn(),
}));

jest.mock('@/utils/attendance/attendance-shift.util.ts', () => ({
  assertCheckInWindow: jest.fn(),
  getMinutesFromDateTime: jest.fn(),
  isActualShiftMatched: jest.fn(),
  isBeforeCheckOutWindow: jest.fn(),
  isWithinShiftSelectionWindow: jest.fn(),
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

jest.mock('@/utils/schedule.util.ts', () => ({
  resolveShiftFromSchedule: jest.fn(),
}));

type Shift = {
  id: string;
  isActive?: boolean;
  startTime?: number;
  endTime?: number;
};

type EmployeeShift = {
  id: string;
  shiftId: string;
  shift?: Shift;
};

type AttendanceRecord = {
  id: string;
  employeeId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  employeeShift?: {
    id: string;
    shift?: Shift;
  };
};

type AttendanceMetrics = {
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
};

type AttendanceQuery = {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
};

type AsyncFn = (...args: any[]) => Promise<any>;
type AsyncMock = jest.Mock<AsyncFn>;
type AttendanceRepoMock = {
  checkIn: AsyncMock;
  checkOut: AsyncMock;
  queryRecords: AsyncMock;
  findByEmployeeAndDate: AsyncMock;
};

type EmployeeShiftRepoMock = {
  getShiftForEmployeeDate: AsyncMock;
  ensureShiftForEmployeeDate: AsyncMock;
};

type ScheduleRepoMock = {
  getScheduleByEmployee: AsyncMock;
};

type HolidayRepoMock = {
  checkIsHoliday: AsyncMock;
};

type WorkingShiftRepoMock = {
  listAll: AsyncMock;
  findById: AsyncMock;
};

type EmployeeRepoMock = {
  findById: AsyncMock;
};

const mockedIsPartTimeWorkSchedule = jest.mocked(isPartTimeWorkSchedule);
const mockedComputeAttendanceMetrics = jest.mocked(computeAttendanceMetrics);
const mockedAssertWithinShiftGps = jest.mocked(assertWithinShiftGps);
const mockedFindActiveAttendanceRecord = jest.mocked(findActiveAttendanceRecord);
const mockedNormalizeAttendanceDate = jest.mocked(normalizeAttendanceDate);
const mockedAssertCheckInWindow = jest.mocked(assertCheckInWindow);
const mockedGetMinutesFromDateTime = jest.mocked(getMinutesFromDateTime);
const mockedIsActualShiftMatched = jest.mocked(isActualShiftMatched);
const mockedIsBeforeCheckOutWindow = jest.mocked(isBeforeCheckOutWindow);
const mockedIsWithinShiftSelectionWindow = jest.mocked(isWithinShiftSelectionWindow);
const mockedResolveShiftFromSchedule = jest.mocked(resolveShiftFromSchedule);

describe('AttendanceService.checkIn', () => {
  let attendanceRepo: AttendanceRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let scheduleRepo: ScheduleRepoMock;
  let holidayRepo: HolidayRepoMock;
  let workingShiftRepo: WorkingShiftRepoMock;
  let employeeRepo: EmployeeRepoMock;
  let service: AttendanceService;

  const employeeId = 'emp-1';
  const createdById = 'admin-1';
  const location = { lat: 1.23, lng: 4.56 };
  const now = new Date('2024-01-15T09:00:00.000Z');
  const today = new Date('2024-01-15T00:00:00.000Z');
  const shift: Shift = { id: 'shift-1', isActive: true };
  const ensuredEmployeeShift: EmployeeShift = { id: 'es-1', shiftId: 'shift-1' };
  const attendanceRecord: AttendanceRecord = {
    id: 'att-1',
    employeeId,
    checkInAt: now.toISOString(),
    checkOutAt: null,
  };

  beforeEach(() => {
    attendanceRepo = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      queryRecords: jest.fn(),
      findByEmployeeAndDate: jest.fn(),
    };
    employeeShiftRepo = {
      getShiftForEmployeeDate: jest.fn(),
      ensureShiftForEmployeeDate: jest.fn(),
    };
    scheduleRepo = {
      getScheduleByEmployee: jest.fn(),
    };
    holidayRepo = {
      checkIsHoliday: jest.fn(),
    };
    workingShiftRepo = {
      listAll: jest.fn(),
      findById: jest.fn(),
    };
    employeeRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo as never,
      employeeShiftRepo as never,
      scheduleRepo as never,
      holidayRepo as never,
      workingShiftRepo as never,
      employeeRepo as never,
    );

    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockedNormalizeAttendanceDate.mockReturnValue(today);
    mockedFindActiveAttendanceRecord.mockResolvedValue(null as never);
    mockedGetMinutesFromDateTime.mockReturnValue(540);
    mockedIsPartTimeWorkSchedule.mockReturnValue(false);
    mockedResolveShiftFromSchedule.mockReturnValue({ shiftId: 'shift-1' } as never);
    workingShiftRepo.findById.mockResolvedValue(shift);
    employeeShiftRepo.ensureShiftForEmployeeDate.mockResolvedValue(ensuredEmployeeShift);
    holidayRepo.checkIsHoliday.mockResolvedValue(false);
    attendanceRepo.checkIn.mockResolvedValue(attendanceRecord);
    mockedAssertCheckInWindow.mockImplementation(() => undefined);
    mockedAssertWithinShiftGps.mockImplementation(() => undefined);
    mockedIsWithinShiftSelectionWindow.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('UTCID01 - returns attendance record for full-time employee using weekly schedule fallback', async () => {
    // Arrange
    employeeRepo.findById.mockResolvedValue({ id: employeeId, employmentType: 'FULL_TIME' });
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null);
    scheduleRepo.getScheduleByEmployee.mockResolvedValue({ id: 'sched-1', workingShiftId: null });

    // Act
    const result = await service.checkIn(employeeId, location, createdById);

    // Assert
    expect(mockedNormalizeAttendanceDate).toHaveBeenCalledWith(now);
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now);
    expect(employeeShiftRepo.getShiftForEmployeeDate).toHaveBeenCalledWith(employeeId, today, {
      atMinutes: 540,
    });
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, today);
    expect(mockedResolveShiftFromSchedule).toHaveBeenCalledWith(
      { id: 'sched-1', workingShiftId: null },
      today,
    );
    expect(workingShiftRepo.findById).toHaveBeenCalledWith('shift-1');
    expect(mockedAssertCheckInWindow).toHaveBeenCalledWith(now, today, shift);
    expect(mockedAssertWithinShiftGps).toHaveBeenCalledWith(location, shift);
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenCalledWith(
      employeeId,
      today,
      'shift-1',
      createdById,
    );
    expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(today);
    expect(attendanceRepo.checkIn).toHaveBeenCalledWith(employeeId, location, 'es-1');
    expect(result).toEqual(attendanceRecord);
  });

  it('UTCID02 - throws conflict when there is already an active open attendance record', async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue({
      id: 'att-open',
      employeeId,
      checkInAt: now.toISOString(),
      checkOutAt: null,
    } as never);

    // Act
    const act = service.checkIn(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
      statusCode: HttpStatusCode.CONFLICT,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(employeeRepo.findById).not.toHaveBeenCalled();
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws unprocessable entity for part-time employee without assigned shift', async () => {
    // Arrange
    employeeRepo.findById.mockResolvedValue({ id: employeeId, employmentType: 'PART_TIME' });
    mockedIsPartTimeWorkSchedule.mockReturnValue(true);
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null);

    // Act
    const act = service.checkIn(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.PT_NO_ASSIGNED_SHIFT,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(workingShiftRepo.findById).not.toHaveBeenCalled();
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled();
  });

  it('UTCID04 - throws bad request when schedule exists but no shift can be resolved for today', async () => {
    // Arrange
    employeeRepo.findById.mockResolvedValue({ id: employeeId, employmentType: 'FULL_TIME' });
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null);
    scheduleRepo.getScheduleByEmployee.mockResolvedValue({ id: 'sched-2', workingShiftId: null });
    mockedResolveShiftFromSchedule.mockReturnValue(null as never);

    // Act
    const act = service.checkIn(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.NO_SCHEDULE_TODAY,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(workingShiftRepo.findById).not.toHaveBeenCalled();
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled();
  });

  it('UTCID05 - throws bad request when fallback shift resolves but employee shift cannot be ensured', async () => {
    // Arrange
    employeeRepo.findById.mockResolvedValue({ id: employeeId, employmentType: 'FULL_TIME' });
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null);
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(null);
    workingShiftRepo.listAll.mockResolvedValue([
      { id: 'shift-1', isActive: true },
      { id: 'shift-2', isActive: false },
    ]);
    mockedIsWithinShiftSelectionWindow.mockReturnValue(true);
    employeeShiftRepo.ensureShiftForEmployeeDate.mockResolvedValue(null);

    // Act
    const act = service.checkIn(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.SHIFT_NOT_FOUND,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(workingShiftRepo.listAll).toHaveBeenCalled();
    expect(workingShiftRepo.findById).toHaveBeenCalledWith('shift-1');
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled();
  });
});

describe('AttendanceService.checkOut', () => {
  let attendanceRepo: AttendanceRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let scheduleRepo: ScheduleRepoMock;
  let holidayRepo: HolidayRepoMock;
  let workingShiftRepo: WorkingShiftRepoMock;
  let employeeRepo: EmployeeRepoMock;
  let service: AttendanceService;

  const employeeId = 'emp-1';
  const location = { lat: 1.23, lng: 4.56 };
  const now = new Date('2024-01-15T17:00:00.000Z');
  const shift: Shift = { id: 'shift-1', startTime: 540, endTime: 1020 };
  const record: AttendanceRecord = {
    id: 'att-1',
    employeeId,
    checkInAt: '2024-01-15T09:00:00.000Z',
    checkOutAt: null,
    employeeShift: {
      id: 'es-1',
      shift,
    },
  };
  const metrics: AttendanceMetrics = { lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 10 };
  const checkedOutRecord: AttendanceRecord = {
    ...record,
    checkOutAt: now.toISOString(),
  };

  beforeEach(() => {
    attendanceRepo = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      queryRecords: jest.fn(),
      findByEmployeeAndDate: jest.fn(),
    };
    employeeShiftRepo = {
      getShiftForEmployeeDate: jest.fn(),
      ensureShiftForEmployeeDate: jest.fn(),
    };
    scheduleRepo = {
      getScheduleByEmployee: jest.fn(),
    };
    holidayRepo = {
      checkIsHoliday: jest.fn(),
    };
    workingShiftRepo = {
      listAll: jest.fn(),
      findById: jest.fn(),
    };
    employeeRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo as never,
      employeeShiftRepo as never,
      scheduleRepo as never,
      holidayRepo as never,
      workingShiftRepo as never,
      employeeRepo as never,
    );

    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockedFindActiveAttendanceRecord.mockResolvedValue(record as never);
    mockedIsBeforeCheckOutWindow.mockReturnValue(false);
    mockedAssertWithinShiftGps.mockImplementation(() => undefined);
    mockedComputeAttendanceMetrics.mockReturnValue(metrics as never);
    mockedGetMinutesFromDateTime.mockReturnValueOnce(540).mockReturnValueOnce(1020);
    mockedIsActualShiftMatched.mockReturnValue(true);
    attendanceRepo.checkOut.mockResolvedValue(checkedOutRecord);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('UTCID01 - returns updated attendance record with computed metrics on successful check-out', async () => {
    // Arrange
    const expectedMeta = {
      actualEndTime: 1020,
      isMatched: true,
    };

    // Act
    const result = await service.checkOut(employeeId, location);

    // Assert
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now);
    expect(mockedIsBeforeCheckOutWindow).toHaveBeenCalledWith(now, record, shift);
    expect(mockedAssertWithinShiftGps).toHaveBeenCalledWith(location, shift);
    expect(mockedComputeAttendanceMetrics).toHaveBeenCalledWith(record, shift, now);
    expect(mockedIsActualShiftMatched).toHaveBeenCalledWith(540, 1020, shift);
    expect(attendanceRepo.checkOut).toHaveBeenCalledWith('att-1', location, metrics, expectedMeta);
    expect(result).toEqual(checkedOutRecord);
  });

  it('UTCID02 - throws bad request when employee has no active attendance record', async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue(null as never);

    // Act
    const act = service.checkOut(employeeId, location);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_BEFORE_IN,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(attendanceRepo.checkOut).not.toHaveBeenCalled();
  });

  it('UTCID03 - throws bad request when trying to check out before allowed window', async () => {
    // Arrange
    mockedIsBeforeCheckOutWindow.mockReturnValue(true);

    // Act
    const act = service.checkOut(employeeId, location);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(mockedAssertWithinShiftGps).not.toHaveBeenCalled();
    expect(attendanceRepo.checkOut).not.toHaveBeenCalled();
  });
});

describe('AttendanceService.scan', () => {
  let attendanceRepo: AttendanceRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let scheduleRepo: ScheduleRepoMock;
  let holidayRepo: HolidayRepoMock;
  let workingShiftRepo: WorkingShiftRepoMock;
  let employeeRepo: EmployeeRepoMock;
  let service: AttendanceService;

  const employeeId = 'emp-1';
  const createdById = 'admin-1';
  const location = { lat: 1.23, lng: 4.56 };
  const now = new Date('2024-01-15T17:00:00.000Z');
  const scanRecord: AttendanceRecord = {
    id: 'att-1',
    employeeId,
    checkInAt: '2024-01-15T09:00:00.000Z',
    checkOutAt: null,
    employeeShift: {
      id: 'es-1',
      shift: { id: 'shift-1' },
    },
  };

  beforeEach(() => {
    attendanceRepo = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      queryRecords: jest.fn(),
      findByEmployeeAndDate: jest.fn(),
    };
    employeeShiftRepo = {
      getShiftForEmployeeDate: jest.fn(),
      ensureShiftForEmployeeDate: jest.fn(),
    };
    scheduleRepo = {
      getScheduleByEmployee: jest.fn(),
    };
    holidayRepo = {
      checkIsHoliday: jest.fn(),
    };
    workingShiftRepo = {
      listAll: jest.fn(),
      findById: jest.fn(),
    };
    employeeRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo as never,
      employeeShiftRepo as never,
      scheduleRepo as never,
      holidayRepo as never,
      workingShiftRepo as never,
      employeeRepo as never,
    );

    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('UTCID01 - delegates to checkIn when no active record exists', async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue(null as never);
    const checkInSpy = jest.spyOn(service, 'checkIn').mockResolvedValue({
      id: 'att-new',
      employeeId,
      checkInAt: now.toISOString(),
      checkOutAt: null,
    } as never);

    // Act
    const result = await service.scan(employeeId, location, createdById);

    // Assert
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now);
    expect(checkInSpy).toHaveBeenCalledWith(employeeId, location, createdById);
    expect(result).toEqual({
      id: 'att-new',
      employeeId,
      checkInAt: now.toISOString(),
      checkOutAt: null,
    });
  });

  it('UTCID02 - throws conflict when active record exists and checkout window is not yet open', async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue(scanRecord as never);
    mockedIsBeforeCheckOutWindow.mockReturnValue(true);

    // Act
    const act = service.scan(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
      statusCode: HttpStatusCode.CONFLICT,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
  });

  it('UTCID03 - propagates checkOut error when active record exists and checkOut fails', async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue(scanRecord as never);
    mockedIsBeforeCheckOutWindow.mockReturnValue(false);
    jest.spyOn(service, 'checkOut').mockRejectedValue(
      new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      ),
    );

    // Act
    const act = service.scan(employeeId, location, createdById);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
  });
});

describe('AttendanceService.getAttendanceRecords', () => {
  let attendanceRepo: AttendanceRepoMock;
  let employeeShiftRepo: EmployeeShiftRepoMock;
  let scheduleRepo: ScheduleRepoMock;
  let holidayRepo: HolidayRepoMock;
  let workingShiftRepo: WorkingShiftRepoMock;
  let employeeRepo: EmployeeRepoMock;
  let service: AttendanceService;

  const query: AttendanceQuery = {
    employeeId: 'emp-1',
    fromDate: '2024-01-01',
    toDate: '2024-01-31',
  };
  const records: AttendanceRecord[] = [
    { id: 'att-1', employeeId: 'emp-1', checkInAt: '2024-01-02T09:00:00.000Z', checkOutAt: null },
    { id: 'att-2', employeeId: 'emp-1', checkInAt: '2024-01-03T09:00:00.000Z', checkOutAt: null },
  ];

  beforeEach(() => {
    attendanceRepo = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      queryRecords: jest.fn(),
      findByEmployeeAndDate: jest.fn(),
    };
    employeeShiftRepo = {
      getShiftForEmployeeDate: jest.fn(),
      ensureShiftForEmployeeDate: jest.fn(),
    };
    scheduleRepo = {
      getScheduleByEmployee: jest.fn(),
    };
    holidayRepo = {
      checkIsHoliday: jest.fn(),
    };
    workingShiftRepo = {
      listAll: jest.fn(),
      findById: jest.fn(),
    };
    employeeRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo as never,
      employeeShiftRepo as never,
      scheduleRepo as never,
      holidayRepo as never,
      workingShiftRepo as never,
      employeeRepo as never,
    );

    jest.clearAllMocks();
  });

  it('UTCID01 - returns attendance records from repository for a valid query', async () => {
    // Arrange
    attendanceRepo.queryRecords.mockResolvedValue(records);

    // Act
    const result = await service.getAttendanceRecords(query as never);

    // Assert
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith(query);
    expect(result).toEqual(records);
  });

  it('UTCID02 - propagates repository validation error for invalid query input', async () => {
    // Arrange
    const repoError = new AppError(
      'INVALID_QUERY',
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    );
    attendanceRepo.queryRecords.mockRejectedValue(repoError);

    // Act
    const act = service.getAttendanceRecords(query as never);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: 'INVALID_QUERY',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith(query);
  });

  it('UTCID03 - propagates repository internal error when queryRecords fails unexpectedly', async () => {
    // Arrange
    const repoError = new AppError('REPO_FAILURE', 500, ATTENDANCE_LAYERS.SERVICE);
    attendanceRepo.queryRecords.mockRejectedValue(repoError);

    // Act
    const act = service.getAttendanceRecords(query as never);

    // Assert
    await expect(act).rejects.toMatchObject({
      message: 'REPO_FAILURE',
      statusCode: 500,
      layer: ATTENDANCE_LAYERS.SERVICE,
    });
    expect(attendanceRepo.queryRecords).toHaveBeenCalledTimes(1);
  });
});