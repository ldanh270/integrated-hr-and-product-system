/// <reference types="jest" />
import { HolidayService } from '../../services/holiday.service';

jest.mock('@/configs/entities/employee.config.ts', () => ({
  EMPLOYEE_STATUS: { ACTIVE: 'ACTIVE', ON_LEAVE: 'ON_LEAVE' },
}));
jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: { SERVICE: 'SERVICE' },
}));
jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: { BAD_REQUEST: 400, NOT_FOUND: 404, UNPROCESSABLE_ENTITY: 422, INTERNAL_SERVER_ERROR: 500 },
}));
jest.mock('@/libs/database.ts', () => ({
  prisma: { position: { findFirst: jest.fn() }, employee: { count: jest.fn() } },
}));
jest.mock('@/types/attendance.types.ts', () => ({}));
jest.mock('@/utils/error.util.ts', () => ({
  AppError: class MockAppError extends Error {
    statusCode: number; layer: string; code: string;
    constructor(message: string, statusCode: number, layer: string, code: string) {
      super(message); this.name = 'AppError'; this.statusCode = statusCode; this.layer = layer; this.code = code;
    }
  },
}));

import { ErrorLayer } from '@/configs/system/error-code.config.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import type { IHolidayRepository } from '@/types/attendance.types.ts';
import { AppError } from '@/utils/error.util.ts';

describe('HolidayService', () => {
  let holidayRepo: any;
  let service: HolidayService;

  beforeEach(() => {
    holidayRepo = { listHolidays: jest.fn(), createHoliday: jest.fn(), updateHoliday: jest.fn(), deleteHoliday: jest.fn(), checkIsHoliday: jest.fn() };
    service = new HolidayService(holidayRepo);
    jest.clearAllMocks();
  });

  describe('listHolidays', () => {
    it('returns holidays for a valid query', async () => {
      const query = { year: 2025 };
      const holidays = [{ id: 'h1', name: 'New Year', deletedAt: null }];
      holidayRepo.listHolidays.mockResolvedValue(holidays);
      const result = await service.listHolidays(query as never);
      expect(result).toEqual(holidays);
    });
  });
});
