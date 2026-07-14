/// <reference types="jest" />
jest.mock('@/configs/entities/project.config.ts', () => ({
  PROJECT_MEMBER_WORK_MODE: {
    ONSITE: 'ONSITE',
    REMOTE: 'REMOTE'
  },
  SPENT_TIME_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
  }
}), { virtual: true });

jest.mock('@/configs/rules/project.config.ts', () => ({
  SPENT_TIME_RULES: {
    ENFORCE_ESTIMATE_CAP: true
  }
}), { virtual: true });

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  }
}), { virtual: true });

jest.mock('@/services/authorization.service.ts', () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn()
  }
}), { virtual: true });

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    layerName: string;
    constructor(message: string, statusCode: number, layerName: string) {
      super(message);
      this.message = message;
      this.statusCode = statusCode;
      this.layerName = layerName;
    }
  }
}), { virtual: true });

jest.mock('@/types', () => ({}), { virtual: true });
jest.mock('@/types/attendance.types.ts', () => ({}), { virtual: true });

import { SpentTimeService } from '../../services/spent-time.service';
import { authorizationService } from '@/services/authorization.service.ts';
import { PROJECT_MEMBER_WORK_MODE, SPENT_TIME_STATUS } from '@/configs/entities/project.config.ts';
import { HttpStatusCode } from '@/configs/system/http.config.ts';
import { AppError } from '@/utils/error.util.ts';

describe('SpentTimeService', () => {
  let service: SpentTimeService;
  let mockSpentTimeRepo: Record<string, jest.Mock>;
  let mockTaskRepo: Record<string, jest.Mock>;
  let mockProjectRepo: Record<string, jest.Mock>;
  let mockAttendanceRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpentTimeRepo = {
      findById: jest.fn(),
      sumTaskHours: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn()
    };

    mockTaskRepo = {
      findById: jest.fn()
    };

    mockProjectRepo = {
      findById: jest.fn(),
      getMember: jest.fn(),
      isMember: jest.fn()
    };

    mockAttendanceRepo = {
      findByEmployeeAndDate: jest.fn()
    };

    service = new SpentTimeService(
      mockSpentTimeRepo as never,
      mockTaskRepo as never,
      mockProjectRepo as never,
      mockAttendanceRepo as never
    );
  });

  describe('getSpentTime', () => {
    it('should return a spent time record when the requester is the owner (Happy Path)', async () => {
      // Arrange
      const recordId = 'record-123';
      const userId = 'user-123';
      const mockRecord = { id: recordId, employeeId: userId, taskId: 'task-123', hours: 4 };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      jest.mocked(authorizationService.getAuthorizationContext).mockResolvedValue({
        permissions: new Set()
      } as never);

      // Act
      const result = await service.getSpentTime(recordId, userId);

      // Assert
      expect(result).toEqual(mockRecord);
      expect(mockSpentTimeRepo.findById).toHaveBeenCalledWith(recordId);
    });

    it('should throw NOT_FOUND when the spent time record does not exist', async () => {
      // Arrange
      const recordId = 'missing-id';
      mockSpentTimeRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getSpentTime(recordId, 'user-123'))
        .rejects
        .toThrow(new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user is not the owner, not admin, and task/project matches but not TL', async () => {
      // Arrange
      const recordId = 'record-123';
      const userId = 'user-123';
      const mockRecord = { id: recordId, employeeId: 'other-user', taskId: 'task-123' };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: 'another-tl' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.getSpentTime(recordId, userId))
        .rejects
        .toThrow(new AppError("Access denied", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user is not owner/admin and associated task does not exist', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, employeeId: 'other-user', taskId: 'missing-task' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getSpentTime(recordId, 'user-123'))
        .rejects
        .toThrow(new AppError("Access denied", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });
  });

  describe('listSpentTimes', () => {
    it('should list all matching records when request is made by an authorized admin (Happy Path)', async () => {
      // Arrange
      const userId = 'admin-123';
      const query = { projectId: 'project-123' };
      const mockList = [{ id: 'record-1', hours: 8 }];

      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set(['project.update'])
      });
      mockSpentTimeRepo.list.mockResolvedValue(mockList);

      // Act
      const result = await service.listSpentTimes(query, userId);

      // Assert
      expect(result).toEqual(mockList);
      expect(mockSpentTimeRepo.list).toHaveBeenCalledWith(query);
    });

    it('should throw NOT_FOUND when non-admin queries by projectId and project does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      const query = { projectId: 'missing-project' };

      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.listSpentTimes(query, userId))
        .rejects
        .toThrow(new AppError("Project not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when non-admin queries project logs but is neither member nor TL', async () => {
      // Arrange
      const userId = 'user-123';
      const query = { projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: 'tl-456' };

      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.isMember.mockResolvedValue(false);

      // Act & Assert
      await expect(service.listSpentTimes(query, userId))
        .rejects
        .toThrow(new AppError("Access denied to this project's logs", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });

    it('should throw NOT_FOUND when non-admin queries by taskId and task does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      const query = { taskId: 'missing-task' };

      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.listSpentTimes(query, userId))
        .rejects
        .toThrow(new AppError("Task not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });
  });

  describe('createSpentTime', () => {
    it('should create spent time successfully for valid inputs (Happy Path)', async () => {
      // Arrange
      const userId = 'user-123';
      const dto = { taskId: 'task-123', hours: 4, date: '2023-10-10', activity: 'DEVELOPMENT' as never };
      const mockTask = { id: 'task-123', projectId: 'project-123', estimatedTime: 10 };
      const mockProject = { id: 'project-123', teamLeaderId: 'tl-123' };
      const mockCreated = { id: 'record-1', ...dto, employeeId: userId };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      jest.mocked(authorizationService.getAuthorizationContext).mockResolvedValue({
        permissions: new Set()
      } as never);
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.isMember.mockResolvedValue(true);
      mockSpentTimeRepo.sumTaskHours.mockResolvedValue(0);
      mockProjectRepo.getMember.mockResolvedValue({ workMode: PROJECT_MEMBER_WORK_MODE.REMOTE });
      mockSpentTimeRepo.create.mockResolvedValue(mockCreated);

      // Act
      const result = await service.createSpentTime(dto, userId);

      // Assert
      expect(result).toEqual(mockCreated);
      expect(mockSpentTimeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ employeeId: userId }));
    });

    it('should throw NOT_FOUND when creating spent time for a non-existing task', async () => {
      // Arrange
      const dto = { taskId: 'missing-task', hours: 4, date: '2023-10-10', activity: 'DEVELOPMENT' as never };
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createSpentTime(dto, 'user-123'))
        .rejects
        .toThrow(new AppError("Task not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user has no access to the project to log time', async () => {
      // Arrange
      const dto = { taskId: 'task-123', hours: 4, date: '2023-10-10', activity: 'DEVELOPMENT' as never };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: 'tl-123' };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      jest.mocked(authorizationService.getAuthorizationContext).mockResolvedValue({
        permissions: new Set()
      } as never);
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.isMember.mockResolvedValue(false);

      // Act & Assert
      await expect(service.createSpentTime(dto, 'stranger-123'))
        .rejects
        .toThrow(new AppError("Access denied to log time for this project", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });

    it('should throw UNPROCESSABLE_ENTITY when total logged hours exceeds task estimated time cap', async () => {
      // Arrange
      const dto = { taskId: 'task-123', hours: 5, date: '2023-10-10', activity: 'DEVELOPMENT' as never };
      const mockTask = { id: 'task-123', projectId: 'project-123', estimatedTime: 8 };
      const mockProject = { id: 'project-123', teamLeaderId: 'tl-123' };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      jest.mocked(authorizationService.getAuthorizationContext).mockResolvedValue({
        permissions: new Set()
      } as never);
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.isMember.mockResolvedValue(true);
      mockSpentTimeRepo.sumTaskHours.mockResolvedValue(4); // 4 + 5 = 9 > 8

      // Act & Assert
      await expect(service.createSpentTime(dto, 'user-123'))
        .rejects
        .toThrow(new AppError("Tổng giờ làm (9.0h) vượt ước tính (8h)", HttpStatusCode.UNPROCESSABLE_ENTITY, "SpentTimeService"));
    });

    it('should throw UNPROCESSABLE_ENTITY when onsite member has no check-in on record', async () => {
      // Arrange
      const dto = { taskId: 'task-123', hours: 4, date: '2023-10-10', activity: 'DEVELOPMENT' as any };
      const mockTask = { id: 'task-123', projectId: 'project-123', estimatedTime: null };
      const mockProject = { id: 'project-123', teamLeaderId: 'tl-123' };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.isMember.mockResolvedValue(true);
      mockSpentTimeRepo.sumTaskHours.mockResolvedValue(0);
      mockProjectRepo.getMember.mockResolvedValue({ workMode: PROJECT_MEMBER_WORK_MODE.ONSITE });
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createSpentTime(dto, 'user-123'))
        .rejects
        .toThrow(new AppError("Nhân viên onsite phải check-in trước khi ghi Spent Time", HttpStatusCode.UNPROCESSABLE_ENTITY, "SpentTimeService"));
    });
  });

  describe('updateSpentTime', () => {
    it('should update a pending spent time record successfully (Happy Path)', async () => {
      // Arrange
      const recordId = 'record-123';
      const userId = 'user-123';
      const dto = { hours: 6 };
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.PENDING, employeeId: userId, taskId: 'task-123', hours: 4, date: '2023-10-10' };
      const mockTask = { id: 'task-123', projectId: 'project-123', estimatedTime: null };
      const mockUpdated = { ...mockRecord, hours: 6 };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockProjectRepo.getMember.mockResolvedValue({ workMode: PROJECT_MEMBER_WORK_MODE.REMOTE });
      mockSpentTimeRepo.update.mockResolvedValue(mockUpdated);

      // Act
      const result = await service.updateSpentTime(recordId, dto, userId);

      // Assert
      expect(result).toEqual(mockUpdated);
      expect(mockSpentTimeRepo.update).toHaveBeenCalledWith(recordId, dto);
    });

    it('should throw NOT_FOUND when updating non-existent record', async () => {
      // Arrange
      mockSpentTimeRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateSpentTime('missing-id', { hours: 5 }, 'user-123'))
        .rejects
        .toThrow(new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw CONFLICT when trying to update non-pending record', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.APPROVED, employeeId: 'user-123' };
      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);

      // Act & Assert
      await expect(service.updateSpentTime(recordId, { hours: 5 }, 'user-123'))
        .rejects
        .toThrow(new AppError("Chỉ có thể sửa log đang chờ duyệt", HttpStatusCode.CONFLICT, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user has no permission to update others log', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.PENDING, employeeId: 'other-user' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });

      // Act & Assert
      await expect(service.updateSpentTime(recordId, { hours: 5 }, 'user-123'))
        .rejects
        .toThrow(new AppError("Access denied to update this log", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });
  });

  describe('deleteSpentTime', () => {
    it('should delete a pending spent time record successfully (Happy Path)', async () => {
      // Arrange
      const recordId = 'record-123';
      const userId = 'user-123';
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.PENDING, employeeId: userId };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockSpentTimeRepo.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteSpentTime(recordId, userId);

      // Assert
      expect(result).toBe(true);
      expect(mockSpentTimeRepo.delete).toHaveBeenCalledWith(recordId);
    });

    it('should throw NOT_FOUND when deleting non-existent record', async () => {
      // Arrange
      mockSpentTimeRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteSpentTime('missing-id', 'user-123'))
        .rejects
        .toThrow(new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw CONFLICT when trying to delete non-pending record', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.REJECTED, employeeId: 'user-123' };
      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);

      // Act & Assert
      await expect(service.deleteSpentTime(recordId, 'user-123'))
        .rejects
        .toThrow(new AppError("Chỉ có thể xóa log đang chờ duyệt", HttpStatusCode.CONFLICT, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user has no permission to delete others log', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, status: SPENT_TIME_STATUS.PENDING, employeeId: 'other-user' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });

      // Act & Assert
      await expect(service.deleteSpentTime(recordId, 'user-123'))
        .rejects
        .toThrow(new AppError("Access denied to delete this log", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });
  });

  describe('approveSpentTime', () => {
    it('should approve pending spent time successfully by project lead (Happy Path)', async () => {
      // Arrange
      const recordId = 'record-123';
      const leadId = 'lead-123';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.PENDING };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: leadId };
      const mockApproved = { ...mockRecord, status: SPENT_TIME_STATUS.APPROVED };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockSpentTimeRepo.approve.mockResolvedValue(mockApproved);

      // Act
      const result = await service.approveSpentTime(recordId, leadId);

      // Assert
      expect(result).toEqual(mockApproved);
      expect(mockSpentTimeRepo.approve).toHaveBeenCalledWith(recordId, leadId);
    });

    it('should throw NOT_FOUND when approving non-existent record', async () => {
      // Arrange
      mockSpentTimeRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approveSpentTime('missing-id', 'lead-123'))
        .rejects
        .toThrow(new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw NOT_FOUND when task associated with the record is missing', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, taskId: 'missing-task', status: SPENT_TIME_STATUS.PENDING };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approveSpentTime(recordId, 'lead-123'))
        .rejects
        .toThrow(new AppError("Task not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user has no authorization to approve (not project lead)', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.PENDING };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: 'different-lead-123' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.approveSpentTime(recordId, 'user-123'))
        .rejects
        .toThrow(new AppError("Access denied", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });

    it('should throw CONFLICT when trying to approve already processed record', async () => {
      // Arrange
      const recordId = 'record-123';
      const leadId = 'lead-123';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.APPROVED };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: leadId };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.approveSpentTime(recordId, leadId))
        .rejects
        .toThrow(new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, "SpentTimeService"));
    });
  });

  describe('rejectSpentTime', () => {
    it('should reject pending spent time successfully by project lead (Happy Path)', async () => {
      // Arrange
      const recordId = 'record-123';
      const leadId = 'lead-123';
      const reason = 'Incorrect task code';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.PENDING };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: leadId };
      const mockRejected = { ...mockRecord, status: SPENT_TIME_STATUS.REJECTED, rejectionReason: reason };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockSpentTimeRepo.reject.mockResolvedValue(mockRejected);

      // Act
      const result = await service.rejectSpentTime(recordId, reason, leadId);

      // Assert
      expect(result).toEqual(mockRejected);
      expect(mockSpentTimeRepo.reject).toHaveBeenCalledWith(recordId, leadId, reason);
    });

    it('should throw NOT_FOUND when rejecting non-existent record', async () => {
      // Arrange
      mockSpentTimeRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rejectSpentTime('missing-id', 'no reason', 'lead-123'))
        .rejects
        .toThrow(new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw NOT_FOUND when task associated with the record is missing', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, taskId: 'missing-task', status: SPENT_TIME_STATUS.PENDING };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rejectSpentTime(recordId, 'reason', 'lead-123'))
        .rejects
        .toThrow(new AppError("Task not found", HttpStatusCode.NOT_FOUND, "SpentTimeService"));
    });

    it('should throw FORBIDDEN when user has no authorization to reject (not project lead)', async () => {
      // Arrange
      const recordId = 'record-123';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.PENDING };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: 'different-lead-123' };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.rejectSpentTime(recordId, 'reason', 'user-123'))
        .rejects
        .toThrow(new AppError("Access denied", HttpStatusCode.FORBIDDEN, "SpentTimeService"));
    });

    it('should throw CONFLICT when trying to reject already processed record', async () => {
      // Arrange
      const recordId = 'record-123';
      const leadId = 'lead-123';
      const mockRecord = { id: recordId, taskId: 'task-123', status: SPENT_TIME_STATUS.REJECTED };
      const mockTask = { id: 'task-123', projectId: 'project-123' };
      const mockProject = { id: 'project-123', teamLeaderId: leadId };

      mockSpentTimeRepo.findById.mockResolvedValue(mockRecord);
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      (authorizationService.getAuthorizationContext as any).mockResolvedValue({
        permissions: new Set()
      });
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.rejectSpentTime(recordId, 'another reason', leadId))
        .rejects
        .toThrow(new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, "SpentTimeService"));
    });
  });
});