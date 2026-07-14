/// <reference types="jest" />

jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: {
    SERVICE: 'SERVICE',
  },
}));

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    NOT_FOUND: 404,
  },
}));

jest.mock('@/types/shift.types.ts', () => ({}));

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    public statusCode: number;
    public layer: string;

    constructor(message: string, statusCode: number, layer: string) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.layer = layer;
    }
  },
}));

import { ShiftChangeRequestService } from '../../services/shift-change-request.service';
import { AppError } from '@/utils/error.util.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import { ErrorLayer } from '@/configs/system/error-code.config.ts';
import type {
  IShiftChangeRequestRepository,
  ISubmitShiftChangeRequestDTO,
} from '@/types/shift.types.ts';

type MockedShiftChangeRequestRepository = jest.Mocked<IShiftChangeRequestRepository>;

const createMockRepo = (): MockedShiftChangeRequestRepository =>
  ({
    submit: jest.fn(),
    findByEmployee: jest.fn(),
    findById: jest.fn(),
    listPending: jest.fn(),
  }) as MockedShiftChangeRequestRepository;

describe('ShiftChangeRequestService', () => {
  describe('submitRequest', () => {
    let repo: MockedShiftChangeRequestRepository;
    let service: ShiftChangeRequestService;

    beforeEach(() => {
      // Arrange
      repo = createMockRepo();
      service = new ShiftChangeRequestService(repo);

      // Act

      // Assert
      expect(service).toBeInstanceOf(ShiftChangeRequestService);
    });

    it('UTCID01 - submits a shift change request successfully', async () => {
      // Arrange
      const data: ISubmitShiftChangeRequestDTO = {
        employeeId: 'emp-1',
        swapWithEmployeeId: 'emp-2',
        employeeShiftId: 'shift-1',
        swapWithShiftId: 'shift-2',
        startDate: '2024-01-15',
        reason: 'Need coverage',
      };
      const createdRequest = {
        id: 'req-1',
        employeeId: 'emp-1',
        swapWithEmployeeId: 'emp-2',
        employeeShiftId: 'shift-1',
        swapWithShiftId: 'shift-2',
        startDate: '2024-01-15',
        reason: 'Need coverage',
        approvedAt: null,
        rejectedAt: null,
      };
      repo.submit.mockResolvedValue(createdRequest);

      // Act
      const result = await service.submitRequest(data);

      // Assert
      expect(repo.submit).toHaveBeenCalledTimes(1);
      expect(repo.submit).toHaveBeenCalledWith(data);
      expect(result).toEqual(createdRequest);
    });

    it('UTCID02 - throws AppError when employee requests a swap with themselves', async () => {
      // Arrange
      const data: ISubmitShiftChangeRequestDTO = {
        employeeId: 'emp-1',
        swapWithEmployeeId: 'emp-1',
        employeeShiftId: 'shift-1',
        swapWithShiftId: 'shift-1',
        startDate: '2024-01-15',
        reason: 'Invalid self swap',
      };

      // Act
      const act = service.submitRequest(data);

      // Assert
      await expect(act).rejects.toBeInstanceOf(AppError);
      await expect(act).rejects.toMatchObject({
        message: 'Cannot request shift swap with yourself',
        statusCode: HttpStatusCode.BAD_REQUEST,
        layer: ErrorLayer.SERVICE,
      });
      expect(repo.submit).not.toHaveBeenCalled();
    });

    it('UTCID03 - propagates repository errors during request submission', async () => {
      // Arrange
      const data: ISubmitShiftChangeRequestDTO = {
        employeeId: 'emp-1',
        swapWithEmployeeId: 'emp-2',
        employeeShiftId: 'shift-1',
        swapWithShiftId: 'shift-2',
        startDate: '2024-01-16',
        reason: 'Need change',
      };
      const repoError = new AppError(
        'Repository submit failed',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      );
      repo.submit.mockRejectedValue(repoError);

      // Act
      const act = service.submitRequest(data);

      // Assert
      await expect(act).rejects.toBe(repoError);
      expect(repo.submit).toHaveBeenCalledTimes(1);
      expect(repo.submit).toHaveBeenCalledWith(data);
    });
  });

  describe('getMyRequests', () => {
    let repo: MockedShiftChangeRequestRepository;
    let service: ShiftChangeRequestService;

    beforeEach(() => {
      // Arrange
      repo = createMockRepo();
      service = new ShiftChangeRequestService(repo);

      // Act

      // Assert
      expect(service).toBeInstanceOf(ShiftChangeRequestService);
    });

    it('UTCID01 - returns all shift change requests for the employee', async () => {
      // Arrange
      const employeeId = 'emp-1';
      const requests = [
        {
          id: 'req-1',
          employeeId: 'emp-1',
          swapWithEmployeeId: 'emp-2',
          employeeShiftId: 'shift-1',
          swapWithShiftId: 'shift-2',
          startDate: '2024-01-15',
          approvedAt: null,
          rejectedAt: null,
        },
        {
          id: 'req-2',
          employeeId: 'emp-1',
          swapWithEmployeeId: 'emp-3',
          employeeShiftId: 'shift-3',
          swapWithShiftId: 'shift-4',
          startDate: '2024-01-16',
          approvedAt: null,
          rejectedAt: null,
        },
      ];
      repo.findByEmployee.mockResolvedValue(requests);

      // Act
      const result = await service.getMyRequests(employeeId);

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1);
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId);
      expect(result).toEqual(requests);
    });

    it('UTCID02 - propagates not found style repository errors when fetching employee requests', async () => {
      // Arrange
      const employeeId = 'missing-emp';
      const repoError = new AppError(
        'Requests not found',
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      );
      repo.findByEmployee.mockRejectedValue(repoError);

      // Act
      const act = service.getMyRequests(employeeId);

      // Assert
      await expect(act).rejects.toBe(repoError);
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1);
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId);
    });

    it('UTCID03 - propagates generic repository failures when fetching employee requests', async () => {
      // Arrange
      const employeeId = 'emp-1';
      const repoError = new Error('Database unavailable');
      repo.findByEmployee.mockRejectedValue(repoError);

      // Act
      const act = service.getMyRequests(employeeId);

      // Assert
      await expect(act).rejects.toBe(repoError);
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1);
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId);
    });
  });
});