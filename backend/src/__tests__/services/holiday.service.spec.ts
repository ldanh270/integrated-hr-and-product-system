/// <reference types="jest" />
import { HolidayService } from '../../services/holiday.service';

jest.mock('@/configs/entities/attendance.config.ts', () => ({
  HOLIDAY_SCOPE: {
    ALL: 'ALL',
    POSITION: 'POSITION',
    EMPLOYEES: 'EMPLOYEES',
  },
}));

jest.mock('@/configs/entities/employee.config.ts', () => ({
  EMPLOYEE_STATUS: {
    ACTIVE: 'ACTIVE',
    ON_LEAVE: 'ON_LEAVE',
  },
}));

jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: {
    SERVICE: 'SERVICE',
  },
}));

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
}));

jest.mock('@/libs/database.ts', () => ({
  prisma: {
    position: {
      findFirst: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
  },
}));

jest.mock('@/types/attendance.types.ts', () => ({}));

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class MockAppError extends Error {
    statusCode: number;
    layer: string;
    code: string;

    constructor(message: string, statusCode: number, layer: string, code: string) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.layer = layer;
      this.code = code;
    }
  },
}));

import { HOLIDAY_SCOPE } from '@/configs/entities/attendance.config.ts';
import { EMPLOYEE_STATUS } from '@/configs/entities/employee.config.ts';
import { ErrorLayer } from '@/configs/system/error-code.config.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import { prisma } from '@/libs/database.ts';
import { AppError } from '@/utils/error.util.ts';

describe('HolidayService', () => {
  let holidayRepo: {
    listHolidays: jest.Mock;
    createHolidayRange: jest.Mock;
    updateHoliday: jest.Mock;
    deleteHoliday: jest.Mock;
    checkIsHoliday: jest.Mock;
  };

  let service: HolidayService;

  beforeEach(() => {
    holidayRepo = {
      listHolidays: jest.fn(),
      createHolidayRange: jest.fn(),
      updateHoliday: jest.fn(),
      deleteHoliday: jest.fn(),
      checkIsHoliday: jest.fn(),
    };

    service = new HolidayService(holidayRepo as any);

    jest.clearAllMocks();
  });

  describe('listHolidays', () => {
    it('UTCID01 - returns holidays for a valid query', async () => {
      // Arrange
      const query = { year: 2025, scope: HOLIDAY_SCOPE.ALL };
      const holidays = [{ id: 'h1', name: 'New Year', deletedAt: null }];
      holidayRepo.listHolidays.mockResolvedValue(holidays);

      // Act
      const result = await service.listHolidays(query as any);

      // Assert
      expect(holidayRepo.listHolidays).toHaveBeenCalledTimes(1);
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query);
      expect(result).toEqual(holidays);
    });

    it('UTCID02 - propagates repository AppError failure', async () => {
      // Arrange
      const query = { year: 2025 };
      const error = new AppError(
        'Invalid holiday filter',
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        'INVALID_FILTER',
      );
      holidayRepo.listHolidays.mockRejectedValue(error);

      // Act
      const act = service.listHolidays(query as any);

      // Assert
      await expect(act).rejects.toBe(error);
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query);
    });

    it('UTCID03 - propagates repository internal failure', async () => {
      // Arrange
      const query = { scope: HOLIDAY_SCOPE.EMPLOYEES };
      const error = new Error('database failure');
      holidayRepo.listHolidays.mockRejectedValue(error);

      // Act
      const act = service.listHolidays(query as any);

      // Assert
      await expect(act).rejects.toThrow('database failure');
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query);
    });
  });

  describe('createHoliday', () => {
    it('UTCID01 - creates a holiday range with default ALL scope and normalized dates', async () => {
      // Arrange
      const data = {
        name: 'Company Holiday',
        date: '2025-12-25',
      };
      const createdById = 'user-1';
      const repoResult = [{ id: 'h1', deletedAt: null }];
      holidayRepo.createHolidayRange.mockResolvedValue(repoResult);

      // Act
      const result = await service.createHoliday(data as any, createdById);

      // Assert
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledTimes(1);
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          scope: HOLIDAY_SCOPE.ALL,
          startDate: new Date('2025-12-25'),
          endDate: new Date('2025-12-25'),
        }),
        createdById,
      );
      expect(result).toEqual(repoResult);
    });

    it('UTCID02 - throws BAD_REQUEST when endDate is before startDate', async () => {
      // Arrange
      const data = {
        name: 'Invalid Range Holiday',
        startDate: '2025-12-31',
        endDate: '2025-12-30',
      };

      // Act
      const act = service.createHoliday(data as any, 'user-1');

      // Assert
      await expect(act).rejects.toMatchObject({
        message: 'endDate must be greater than or equal to startDate',
        statusCode: HttpStatusCode.BAD_REQUEST,
        layer: ErrorLayer.SERVICE,
        code: 'INVALID_DATE_RANGE',
      });
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled();
    });

    it('UTCID03 - throws NOT_FOUND when POSITION scope target does not exist', async () => {
      // Arrange
      const data = {
        name: 'Position Holiday',
        startDate: '2025-01-01',
        endDate: '2025-01-01',
        scope: HOLIDAY_SCOPE.POSITION,
        positionId: 'pos-1',
      };
      (prisma.position.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const act = service.createHoliday(data as any, 'user-1');

      // Assert
      await expect(act).rejects.toMatchObject({
        message: 'Position not found',
        statusCode: HttpStatusCode.NOT_FOUND,
        layer: ErrorLayer.SERVICE,
        code: 'POSITION_NOT_FOUND',
      });
      expect(prisma.position.findFirst).toHaveBeenCalledWith({
        where: { id: 'pos-1', deletedAt: null },
        select: { id: true },
      });
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled();
    });

    it('UTCID04 - throws UNPROCESSABLE_ENTITY when EMPLOYEES scope has no active employees', async () => {
      // Arrange
      const data = {
        name: 'Employee Holiday',
        startDate: '2025-05-01',
        endDate: '2025-05-02',
        scope: HOLIDAY_SCOPE.EMPLOYEES,
        employeeIds: ['emp-1', 'emp-1', 'emp-2'],
      };
      (prisma.employee.count as jest.Mock).mockResolvedValue(0);

      // Act
      const act = service.createHoliday(data as any, 'user-1');

      // Assert
      await expect(act).rejects.toMatchObject({
        message: 'No active employees found for the provided ids',
        statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
        layer: ErrorLayer.SERVICE,
        code: 'NO_TARGET_EMPLOYEES',
      });
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['emp-1', 'emp-2'] },
          deletedAt: null,
          status: { in: [EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.ON_LEAVE] },
        },
      });
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled();
    });

    it('UTCID05 - propagates repository internal failure after successful scope validation', async () => {
      // Arrange
      const data = {
        name: 'All Scope Holiday',
        startDate: '2025-03-10',
        endDate: '2025-03-12',
        scope: HOLIDAY_SCOPE.ALL,
      };
      const error = new Error('insert failed');
      holidayRepo.createHolidayRange.mockRejectedValue(error);

      // Act
      const act = service.createHoliday(data as any, 'user-1');

      // Assert
      await expect(act).rejects.toThrow('insert failed');
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          startDate: new Date('2025-03-10'),
          endDate: new Date('2025-03-12'),
        }),
        'user-1',
      );
    });
  });

  describe('updateHoliday', () => {
    it('UTCID01 - updates a holiday successfully', async () => {
      // Arrange
      const id = 'holiday-1';
      const data = { name: 'Updated Holiday' };
      const updatedHoliday = { id, name: 'Updated Holiday', deletedAt: null };
      holidayRepo.updateHoliday.mockResolvedValue(updatedHoliday);

      // Act
      const result = await service.updateHoliday(id, data as any);

      // Assert
      expect(holidayRepo.updateHoliday).toHaveBeenCalledTimes(1);
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data);
      expect(result).toEqual(updatedHoliday);
    });

    it('UTCID02 - propagates repository not found AppError', async () => {
      // Arrange
      const id = 'missing-holiday';
      const data = { name: 'Updated Holiday' };
      const error = new AppError(
        'Holiday not found',
        404,
        ErrorLayer.SERVICE,
        'HOLIDAY_NOT_FOUND',
      );
      holidayRepo.updateHoliday.mockRejectedValue(error);

      // Act
      const act = service.updateHoliday(id, data as any);

      // Assert
      await expect(act).rejects.toBe(error);
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data);
    });

    it('UTCID03 - propagates repository internal failure', async () => {
      // Arrange
      const id = 'holiday-1';
      const data = { name: 'Updated Holiday' };
      const error = new Error('update failed');
      holidayRepo.updateHoliday.mockRejectedValue(error);

      // Act
      const act = service.updateHoliday(id, data as any);

      // Assert
      await expect(act).rejects.toThrow('update failed');
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data);
    });
  });

  describe('deleteHoliday', () => {
    it('UTCID01 - deletes a holiday successfully with default deleteBatch true', async () => {
      // Arrange
      const id = 'holiday-1';
      holidayRepo.deleteHoliday.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteHoliday(id);

      // Assert
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledTimes(1);
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id, true);
      expect(result).toBeUndefined();
    });

    it('UTCID02 - propagates repository not found AppError', async () => {
      // Arrange
      const id = 'missing-holiday';
      const error = new AppError(
        'Holiday not found',
        404,
        ErrorLayer.SERVICE,
        'HOLIDAY_NOT_FOUND',
      );
      holidayRepo.deleteHoliday.mockRejectedValue(error);

      // Act
      const act = service.deleteHoliday(id, false);

      // Assert
      await expect(act).rejects.toBe(error);
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id, false);
    });

    it('UTCID03 - propagates repository internal failure', async () => {
      // Arrange
      const id = 'holiday-1';
      const error = new Error('delete failed');
      holidayRepo.deleteHoliday.mockRejectedValue(error);

      // Act
      const act = service.deleteHoliday(id, true);

      // Assert
      await expect(act).rejects.toThrow('delete failed');
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id, true);
    });
  });

  describe('isHoliday', () => {
    it('UTCID01 - returns true when the date is a holiday', async () => {
      // Arrange
      const date = '2025-12-25';
      holidayRepo.checkIsHoliday.mockResolvedValue(true);

      // Act
      const result = await service.isHoliday(date);

      // Assert
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledTimes(1);
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date);
      expect(result).toBe(true);
    });

    it('UTCID02 - propagates repository bad request AppError for invalid date', async () => {
      // Arrange
      const date = 'invalid-date';
      const error = new AppError(
        'Invalid date',
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        'INVALID_DATE',
      );
      holidayRepo.checkIsHoliday.mockRejectedValue(error);

      // Act
      const act = service.isHoliday(date);

      // Assert
      await expect(act).rejects.toBe(error);
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date);
    });

    it('UTCID03 - propagates repository internal failure', async () => {
      // Arrange
      const date = new Date('2025-12-25');
      const error = new Error('lookup failed');
      holidayRepo.checkIsHoliday.mockRejectedValue(error);

      // Act
      const act = service.isHoliday(date);

      // Assert
      await expect(act).rejects.toThrow('lookup failed');
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date);
    });
  });
});