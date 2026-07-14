/// <reference types="jest" />
import { jest } from '@jest/globals';

jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: {
    SERVICE: 'SERVICE',
  },
}));

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    BAD_REQUEST: 400,
  },
}));

jest.mock('@/types/shift.types.ts', () => ({}));

jest.mock('@/utils/db-error.util.ts', () => ({
  handleDbUniqueError: jest.fn(),
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

import { ShiftService } from '../../services/shift.service';
import { handleDbUniqueError } from '@/utils/db-error.util.ts';
import { AppError } from '@/utils/error.util.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import { ErrorLayer } from '@/configs/system/error-code.config.ts';

type ShiftRecord = {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  createdById?: string;
};

type CreateShiftDto = {
  name: string;
  startTime: string;
  endTime: string;
  createdById: string;
};

type UpdateShiftDto = {
  name?: string;
  startTime?: string;
  endTime?: string;
};

type ShiftRepoDependency = ConstructorParameters<typeof ShiftService>[0];

type ShiftRepoMock = {
  create: jest.MockedFunction<(data: CreateShiftDto) => Promise<ShiftRecord>>;
  update: jest.MockedFunction<(id: string, data: UpdateShiftDto) => Promise<ShiftRecord | null>>;
  findById: jest.MockedFunction<(id: string) => Promise<ShiftRecord | null>>;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
  listAll: jest.MockedFunction<() => Promise<ShiftRecord[]>>;
};

const createShiftRepoMock = (): ShiftRepoMock => ({
  create: jest.fn<(data: CreateShiftDto) => Promise<ShiftRecord>>(),
  update: jest.fn<(id: string, data: UpdateShiftDto) => Promise<ShiftRecord | null>>(),
  findById: jest.fn<(id: string) => Promise<ShiftRecord | null>>(),
  delete: jest.fn<(id: string) => Promise<void>>(),
  listAll: jest.fn<() => Promise<ShiftRecord[]>>(),
});

const mockedHandleDbUniqueError = handleDbUniqueError as jest.MockedFunction<typeof handleDbUniqueError>;

describe('ShiftService.createShift', () => {
  let shiftRepo: ShiftRepoMock;
  let shiftService: ShiftService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    shiftRepo = createShiftRepoMock();
    shiftService = new ShiftService(shiftRepo as unknown as ShiftRepoDependency);

    // Act

    // Assert
  });

  it('UTCID01 - creates a shift successfully', async () => {
    // Arrange
    const payload: CreateShiftDto = {
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '17:00',
      createdById: 'user-1',
    };
    const createdShift: ShiftRecord = { id: 'shift-1', ...payload };
    shiftRepo.create.mockResolvedValue(createdShift);

    // Act
    const result = await shiftService.createShift(payload);

    // Assert
    expect(shiftRepo.create).toHaveBeenCalledTimes(1);
    expect(shiftRepo.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(createdShift);
    expect(mockedHandleDbUniqueError).not.toHaveBeenCalled();
  });

  it('UTCID02 - delegates unique constraint errors to handleDbUniqueError', async () => {
    // Arrange
    const payload: CreateShiftDto = {
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '17:00',
      createdById: 'user-1',
    };
    const dbError = new Error('duplicate key');
    shiftRepo.create.mockRejectedValue(dbError);
    mockedHandleDbUniqueError.mockImplementation(() => {
      throw new AppError('Shift name already exists', HttpStatusCode.BAD_REQUEST, 'ShiftService');
    });

    // Act
    const act = async (): Promise<unknown> => shiftService.createShift(payload);

    // Assert
    await expect(act()).rejects.toMatchObject({
      message: 'Shift name already exists',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: 'ShiftService',
    });
    expect(shiftRepo.create).toHaveBeenCalledWith(payload);
    expect(mockedHandleDbUniqueError).toHaveBeenCalledTimes(1);
    expect(mockedHandleDbUniqueError).toHaveBeenCalledWith(
      dbError,
      'ShiftService',
      { name: 'Shift name' },
      'Shift name already exists',
    );
  });

  it('UTCID03 - propagates handler-thrown internal errors during create', async () => {
    // Arrange
    const payload: CreateShiftDto = {
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      createdById: 'user-2',
    };
    const dbError = new Error('db failure');
    const serviceError = new AppError('Internal failure', HttpStatusCode.INTERNAL_SERVER_ERROR, 'ShiftService');
    shiftRepo.create.mockRejectedValue(dbError);
    mockedHandleDbUniqueError.mockImplementation(() => {
      throw serviceError;
    });

    // Act
    const act = async (): Promise<unknown> => shiftService.createShift(payload);

    // Assert
    await expect(act()).rejects.toBe(serviceError);
    expect(mockedHandleDbUniqueError).toHaveBeenCalledWith(
      dbError,
      'ShiftService',
      { name: 'Shift name' },
      'Shift name already exists',
    );
  });
});

describe('ShiftService.updateShift', () => {
  let shiftRepo: ShiftRepoMock;
  let shiftService: ShiftService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    shiftRepo = createShiftRepoMock();
    shiftService = new ShiftService(shiftRepo as unknown as ShiftRepoDependency);

    // Act

    // Assert
  });

  it('UTCID01 - updates a shift successfully', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const payload: UpdateShiftDto = { name: 'Updated Shift' };
    const updatedShift: ShiftRecord = {
      id: shiftId,
      name: 'Updated Shift',
      startTime: '09:00',
      endTime: '18:00',
    };
    shiftRepo.update.mockResolvedValue(updatedShift);

    // Act
    const result = await shiftService.updateShift(shiftId, payload);

    // Assert
    expect(shiftRepo.update).toHaveBeenCalledTimes(1);
    expect(shiftRepo.update).toHaveBeenCalledWith(shiftId, payload);
    expect(result).toEqual(updatedShift);
    expect(mockedHandleDbUniqueError).not.toHaveBeenCalled();
  });

  it('UTCID02 - converts missing shift into a not found error through handleDbUniqueError flow', async () => {
    // Arrange
    const shiftId = 'missing-shift';
    const payload: UpdateShiftDto = { name: 'Updated Shift' };
    shiftRepo.update.mockResolvedValue(null);
    mockedHandleDbUniqueError.mockImplementation((error: unknown) => {
      throw error;
    });

    // Act
    const act = async (): Promise<unknown> => shiftService.updateShift(shiftId, payload);

    // Assert
    await expect(act()).rejects.toMatchObject({
      message: 'Shift not found',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: 'ShiftService',
    });
    expect(shiftRepo.update).toHaveBeenCalledWith(shiftId, payload);
    expect(mockedHandleDbUniqueError).toHaveBeenCalledTimes(1);
    expect(mockedHandleDbUniqueError.mock.calls[0]?.[1]).toBe('ShiftService');
    expect(mockedHandleDbUniqueError.mock.calls[0]?.[2]).toEqual({ name: 'Shift name' });
    expect(mockedHandleDbUniqueError.mock.calls[0]?.[3]).toBe('Shift name already exists');
  });

  it('UTCID03 - delegates duplicate name update errors to handleDbUniqueError', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const payload: UpdateShiftDto = { name: 'Duplicate Shift' };
    const dbError = new Error('duplicate key');
    shiftRepo.update.mockRejectedValue(dbError);
    mockedHandleDbUniqueError.mockImplementation(() => {
      throw new AppError('Shift name already exists', HttpStatusCode.BAD_REQUEST, 'ShiftService');
    });

    // Act
    const act = async (): Promise<unknown> => shiftService.updateShift(shiftId, payload);

    // Assert
    await expect(act()).rejects.toMatchObject({
      message: 'Shift name already exists',
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: 'ShiftService',
    });
    expect(mockedHandleDbUniqueError).toHaveBeenCalledWith(
      dbError,
      'ShiftService',
      { name: 'Shift name' },
      'Shift name already exists',
    );
  });
});

describe('ShiftService.deleteShift', () => {
  let shiftRepo: ShiftRepoMock;
  let shiftService: ShiftService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    shiftRepo = createShiftRepoMock();
    shiftService = new ShiftService(shiftRepo as unknown as ShiftRepoDependency);

    // Act

    // Assert
  });

  it('UTCID01 - deletes an existing shift successfully', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const existingShift: ShiftRecord = { id: shiftId, name: 'Morning Shift' };
    shiftRepo.findById.mockResolvedValue(existingShift);
    shiftRepo.delete.mockResolvedValue(undefined);

    // Act
    await shiftService.deleteShift(shiftId);

    // Assert
    expect(shiftRepo.findById).toHaveBeenCalledTimes(1);
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
    expect(shiftRepo.delete).toHaveBeenCalledTimes(1);
    expect(shiftRepo.delete).toHaveBeenCalledWith(shiftId);
  });

  it('UTCID02 - throws not found when deleting a missing shift', async () => {
    // Arrange
    const shiftId = 'missing-shift';
    shiftRepo.findById.mockResolvedValue(null);

    // Act
    const act = async (): Promise<void> => shiftService.deleteShift(shiftId);

    // Assert
    await expect(act()).rejects.toMatchObject({
      message: 'Shift not found',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: ErrorLayer.SERVICE,
    });
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
    expect(shiftRepo.delete).not.toHaveBeenCalled();
  });

  it('UTCID03 - propagates repository delete errors', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const existingShift: ShiftRecord = { id: shiftId, name: 'Morning Shift' };
    const deleteError = new AppError('Delete failed', HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorLayer.SERVICE);
    shiftRepo.findById.mockResolvedValue(existingShift);
    shiftRepo.delete.mockRejectedValue(deleteError);

    // Act
    const act = async (): Promise<void> => shiftService.deleteShift(shiftId);

    // Assert
    await expect(act()).rejects.toBe(deleteError);
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
    expect(shiftRepo.delete).toHaveBeenCalledWith(shiftId);
  });
});

describe('ShiftService.getShift', () => {
  let shiftRepo: ShiftRepoMock;
  let shiftService: ShiftService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    shiftRepo = createShiftRepoMock();
    shiftService = new ShiftService(shiftRepo as unknown as ShiftRepoDependency);

    // Act

    // Assert
  });

  it('UTCID01 - returns a shift by id successfully', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const existingShift: ShiftRecord = {
      id: shiftId,
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '17:00',
    };
    shiftRepo.findById.mockResolvedValue(existingShift);

    // Act
    const result = await shiftService.getShift(shiftId);

    // Assert
    expect(shiftRepo.findById).toHaveBeenCalledTimes(1);
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
    expect(result).toEqual(existingShift);
  });

  it('UTCID02 - throws not found when shift does not exist', async () => {
    // Arrange
    const shiftId = 'missing-shift';
    shiftRepo.findById.mockResolvedValue(null);

    // Act
    const act = async (): Promise<unknown> => shiftService.getShift(shiftId);

    // Assert
    await expect(act()).rejects.toMatchObject({
      message: 'Shift not found',
      statusCode: HttpStatusCode.NOT_FOUND,
      layer: 'ShiftService',
    });
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
  });

  it('UTCID03 - propagates repository lookup errors', async () => {
    // Arrange
    const shiftId = 'shift-1';
    const repoError = new AppError('Lookup failed', HttpStatusCode.INTERNAL_SERVER_ERROR, 'ShiftService');
    shiftRepo.findById.mockRejectedValue(repoError);

    // Act
    const act = async (): Promise<unknown> => shiftService.getShift(shiftId);

    // Assert
    await expect(act()).rejects.toBe(repoError);
    expect(shiftRepo.findById).toHaveBeenCalledWith(shiftId);
  });
});

describe('ShiftService.listShifts', () => {
  let shiftRepo: ShiftRepoMock;
  let shiftService: ShiftService;

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    shiftRepo = createShiftRepoMock();
    shiftService = new ShiftService(shiftRepo as unknown as ShiftRepoDependency);

    // Act

    // Assert
  });

  it('UTCID01 - lists all shifts successfully', async () => {
    // Arrange
    const shifts: ShiftRecord[] = [
      { id: 'shift-1', name: 'Morning Shift', startTime: '08:00', endTime: '17:00' },
      { id: 'shift-2', name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
    ];
    shiftRepo.listAll.mockResolvedValue(shifts);

    // Act
    const result = await shiftService.listShifts();

    // Assert
    expect(shiftRepo.listAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(shifts);
  });

  it('UTCID02 - propagates repository list errors', async () => {
    // Arrange
    const repoError = new AppError('List failed', HttpStatusCode.INTERNAL_SERVER_ERROR, 'ShiftService');
    shiftRepo.listAll.mockRejectedValue(repoError);

    // Act
    const act = async (): Promise<unknown[]> => shiftService.listShifts();

    // Assert
    await expect(act()).rejects.toBe(repoError);
    expect(shiftRepo.listAll).toHaveBeenCalledTimes(1);
  });

  it('UTCID03 - propagates generic list failures', async () => {
    // Arrange
    const genericError = new Error('Unexpected list error');
    shiftRepo.listAll.mockRejectedValue(genericError);

    // Act
    const act = async (): Promise<unknown[]> => shiftService.listShifts();

    // Assert
    await expect(act()).rejects.toBe(genericError);
    expect(shiftRepo.listAll).toHaveBeenCalledTimes(1);
  });
});