/// <reference types="jest" />
import { TaskEstimateAiService } from '../../services/task-estimate-ai.service';
import { aiClient } from '@/utils/ai-client.util.ts';

// Mock path-aliased external dependencies as virtual mocks to prevent resolution issues
jest.mock('@/utils/ai-client.util.ts', () => ({
  aiClient: {
    generateJson: jest.fn(),
  },
}), { virtual: true });

jest.mock('@/utils/error.util.ts', () => ({
  AppError: class extends Error {
    public statusCode: number;
    public layer: string;
    constructor(message: string, statusCode: number, layer: string) {
      super(message);
      this.message = message;
      this.statusCode = statusCode;
      this.layer = layer;
    }
  },
}), { virtual: true });

jest.mock('@/configs/system/http.config.ts', () => ({
  HttpStatusCode: {
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}), { virtual: true });

jest.mock('@/configs/system/error-code.config.ts', () => ({
  ErrorLayer: {
    SERVICE: 'SERVICE',
  },
}), { virtual: true });

describe('TaskEstimateAiService', () => {
  let taskRepository: any;
  let projectRepository: any;
  let employeeRepository: any;
  let applicationRepository: any;
  let spentTimeRepository: any;
  let service: TaskEstimateAiService;
  let mockGenerateJson: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    taskRepository = {
      findById: jest.fn(),
      listTasks: jest.fn(),
    };
    projectRepository = {
      findById: jest.fn(),
      getMembers: jest.fn(),
    };
    employeeRepository = {
      findById: jest.fn(),
    };
    applicationRepository = {
      checkLeaveOverlap: jest.fn(),
    };
    spentTimeRepository = {
      sumTaskHours: jest.fn(),
    };

    service = new TaskEstimateAiService(
      taskRepository,
      projectRepository,
      employeeRepository,
      applicationRepository,
      spentTimeRepository
    );

    mockGenerateJson = aiClient.generateJson as jest.Mock;
  });

  describe('getAssigneeSuggestions', () => {
    it('should calculate scores, call Gemini API, and return sorted suggestions on success (Happy Path)', async () => {
      // Arrange
      const taskId = 'task-123';
      const taskMock = {
        id: taskId,
        projectId: 'proj-456',
        title: 'Implement OAuth',
        description: 'Add Google and Facebook login',
        tracker: 'feature',
        priority: 'high',
        startDate: new Date('2023-10-01'),
        dueDate: new Date('2023-10-04'),
      };
      
      const membersMock = [
        { employeeId: 'emp-1' },
        { employeeId: 'emp-2' },
        { employeeId: 'emp-missing' },
      ];

      const emp1Mock = { id: 'emp-1', fullName: 'Alice Smith', position: 'Senior Dev' };
      const emp2Mock = { id: 'emp-2', fullName: 'Bob Jones', position: null };

      taskRepository.findById.mockResolvedValue(taskMock);
      projectRepository.getMembers.mockResolvedValue(membersMock);
      
      employeeRepository.findById.mockImplementation(async (id: string) => {
        if (id === 'emp-1') return emp1Mock;
        if (id === 'emp-2') return emp2Mock;
        return null;
      });

      // Active tasks: emp-1 has 1 task (85 score), emp-2 has 0 tasks (100 score)
      taskRepository.listTasks
        .mockResolvedValueOnce({ meta: { total: 1 } }) // active tasks for emp-1
        .mockResolvedValueOnce({ data: [{ id: 't-comp1', title: 'Task Done', estimatedTime: 10 }] }) // completed tasks for emp-1
        .mockResolvedValueOnce({ meta: { total: 0 } }) // active tasks for emp-2
        .mockResolvedValueOnce({ data: [] }); // completed tasks for emp-2

      // Leaves: emp-1 has no leave (100 score), emp-2 has leave overlap (0 score)
      applicationRepository.checkLeaveOverlap.mockImplementation(async (empId: string) => {
        if (empId === 'emp-1') return false;
        if (empId === 'emp-2') return true;
        return false;
      });

      // Velocity for emp-1: baseline (10) / spent (5) = 2.0
      spentTimeRepository.sumTaskHours.mockResolvedValue(5);

      const aiResponseMock = [
        { employeeId: 'emp-1', skillScore: 40, reasons: ['Good base', 'Fast worker'] },
        { employeeId: 'emp-2', skillScore: 80, reasons: ['Great match', 'Experienced'] },
      ];
      mockGenerateJson.mockResolvedValue(aiResponseMock);

      // Act
      const result = await service.getAssigneeSuggestions(taskId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].employeeId).toBe('emp-1');
      expect(result[0].finalScore).toBe(81.5);
      expect(result[0].position).toBe('Senior Dev');
      
      expect(result[1].employeeId).toBe('emp-2');
      expect(result[1].finalScore).toBe(0);
      expect(result[1].position).toBeNull();
    });

    it('should throw AppError 404 when target task is not found (Error Case 1)', async () => {
      // Arrange
      const taskId = 'non-existent-task';
      taskRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAssigneeSuggestions(taskId)).rejects.toThrow(
        expect.objectContaining({
          statusCode: 404,
          message: 'Task not found',
        })
      );
    });

    it('should propagate internal repository runtime exceptions (Error Case 2)', async () => {
      // Arrange
      const taskId = 'task-123';
      const dbError = new Error('Database connection failed');
      taskRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getAssigneeSuggestions(taskId)).rejects.toThrow('Database connection failed');
    });

    it('should fall back gracefully to raw scores if Gemini API call fails (Error Case 3)', async () => {
      // Arrange
      const taskId = 'task-123';
      const taskMock = {
        id: taskId,
        projectId: 'proj-456',
        title: 'Implement OAuth',
        description: 'Add Google and Facebook login',
        tracker: 'feature',
        priority: 'high',
        startDate: new Date('2023-10-01'),
        dueDate: new Date('2023-10-04'),
      };
      
      const membersMock = [{ employeeId: 'emp-1' }];
      const emp1Mock = { id: 'emp-1', fullName: 'Alice Smith', position: 'Senior Dev' };

      taskRepository.findById.mockResolvedValue(taskMock);
      projectRepository.getMembers.mockResolvedValue(membersMock);
      employeeRepository.findById.mockResolvedValue(emp1Mock);

      taskRepository.listTasks
        .mockResolvedValueOnce({ meta: { total: 0 } })
        .mockResolvedValueOnce({ data: [] });
      applicationRepository.checkLeaveOverlap.mockResolvedValue(false);

      mockGenerateJson.mockRejectedValue(new Error('API failure'));

      // Act
      const result = await service.getAssigneeSuggestions(taskId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].employeeId).toBe('emp-1');
      expect(result[0].skillScore).toBe(60); // Default fallback score
      expect(result[0].reasons[0]).toContain('Gặp lỗi khi gọi AI API');
    });
  });

  describe('generateProjectTasks', () => {
    it('should generate target tasks from project tech stack and descriptions successfully (Happy Path)', async () => {
      // Arrange
      const projectId = 'proj-123';
      const projectMock = {
        id: projectId,
        name: 'Payroll System',
        description: 'New automated HR payroll platform',
        techStack: ['Node.js', 'PostgreSQL'],
      };
      const generatedSuggestionsMock = [
        {
          title: 'Thiết lập cơ sở dữ liệu',
          description: 'Cấu hình Schema cho bảng Lương nhân viên',
          tracker: 'task',
          priority: 'high',
          estimatedTime: 12,
        },
      ];

      projectRepository.findById.mockResolvedValue(projectMock);
      mockGenerateJson.mockResolvedValue(generatedSuggestionsMock);

      // Act
      const result = await service.generateProjectTasks(projectId);

      // Assert
      expect(result).toEqual(generatedSuggestionsMock);
      expect(projectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockGenerateJson).toHaveBeenCalled();
    });

    it('should throw AppError 404 if project to estimate does not exist (Error Case 1)', async () => {
      // Arrange
      const projectId = 'non-existent-proj';
      projectRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.generateProjectTasks(projectId)).rejects.toThrow(
        expect.objectContaining({
          statusCode: 404,
          message: 'Project not found',
        })
      );
    });

    it('should propagate errors when Gemini AI service generation fails (Error Case 2)', async () => {
      // Arrange
      const projectId = 'proj-123';
      const projectMock = {
        id: projectId,
        name: 'Payroll System',
        description: 'New automated HR payroll platform',
        techStack: ['Node.js'],
      };
      
      projectRepository.findById.mockResolvedValue(projectMock);
      mockGenerateJson.mockRejectedValue(new Error('AI generation rate limit hit'));

      // Act & Assert
      await expect(service.generateProjectTasks(projectId)).rejects.toThrow('AI generation rate limit hit');
    });
  });
});