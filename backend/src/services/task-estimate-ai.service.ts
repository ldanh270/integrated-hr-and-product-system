import { aiClient } from "@/utils/ai-client.util.ts"
import {
  ITaskRepository,
  IProjectRepository,
  IEmployeeRepository,
  ISpentTimeRepository,
} from "@/types"
import { IApplicationRepository } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"

const LAYER_NAME = "TaskEstimateAiService"

export interface TaskEstimateAiSuggestion {
  employeeId: string
  fullName: string
  position: string | null
  skillScore: number
  workloadScore: number
  availabilityScore: number
  finalScore: number
  reasons: string[]
}

export interface GeneratedTaskSuggestion {
  title: string
  description: string
  tracker: string
  priority: string
  estimatedTime: number
}

export class TaskEstimateAiService {
  constructor(
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private applicationRepository: IApplicationRepository,
    private spentTimeRepository: ISpentTimeRepository,
  ) {}

  /**
   * Generates assignee suggestions using the Hybrid AI Approach:
   * 1. Backend calculates Workload Score & Availability Score.
   * 2. Gemini API calculates Skill Match Score and writes Vietnamese descriptions.
   * 3. Backend merges and ranks candidates.
   */
  async getAssigneeSuggestions(taskId: string): Promise<TaskEstimateAiSuggestion[]> {
    // 1. Fetch Task details
    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // 2. Fetch Project members
    const members = await this.projectRepository.getMembers(task.projectId)
    if (!members || members.length === 0) {
      return []
    }

     const suggestions: TaskEstimateAiSuggestion[] = []
    const geminiCandidatesContext: any[] = []
    const velocities = new Map<string, number>()

    // 3. Process each member to compute local scores (Workload & Availability)
    for (const member of members) {
      const employeeId = member.employeeId

      // Load employee profile
      const employee = await this.employeeRepository.findById(employeeId)
      if (!employee) continue

      // Calculate Workload Score (S_workload)
      // Count active tasks assigned to employee
      const activeTasksResult = await this.taskRepository.listTasks({
        assigneeId: employeeId,
        status: "in_progress",
        limit: 100,
      })
      const activeCount = activeTasksResult.meta.total

      let workloadScore = 0
      if (activeCount === 0) workloadScore = 100
      else if (activeCount === 1) workloadScore = 85
      else if (activeCount === 2) workloadScore = 60
      else if (activeCount === 3) workloadScore = 30
      else workloadScore = 0

      // Calculate Availability Score (H_avail)
      const startDate = task.startDate || new Date()
      // Default to 3 days if dueDate is not specified
      const dueDate = task.dueDate || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)

      const hasLeaveOverlap = await this.applicationRepository.checkLeaveOverlap(
        employeeId,
        startDate,
        dueDate,
      )
      const availabilityScore = hasLeaveOverlap ? 0 : 100

      // Fetch completed tasks for Velocity analysis and Skill context (retrieve up to 20 completed tasks)
      const completedTasksResult = await this.taskRepository.listTasks({
        assigneeId: employeeId,
        status: "done",
        limit: 20,
        sortBy: "completedAt",
        sortOrder: "desc",
      })
      const completedTasks = completedTasksResult.data
      const completedTaskTitles = completedTasks.slice(0, 5).map((t) => t.title)

      // Calculate Personal Velocity: AI Baseline / Real Spent Hours
      let totalBaseline = 0
      let totalSpent = 0

      for (const t of completedTasks) {
        if (t.estimatedTime && t.id) {
          const taskSpentHours = await this.spentTimeRepository.sumTaskHours(t.id)
          if (taskSpentHours > 0) {
            totalBaseline += t.estimatedTime
            totalSpent += taskSpentHours
          }
        }
      }

      let velocity = 1.0 // default multiplier
      if (totalSpent > 0 && totalBaseline > 0) {
        velocity = totalBaseline / totalSpent
        // Giới hạn hệ số từ 0.5 đến 2.0 để tránh lệch điểm quá lớn
        velocity = Math.max(0.5, Math.min(2.0, velocity))
      }
      velocities.set(employeeId, velocity)

      // Add to list for Gemini evaluation
      geminiCandidatesContext.push({
        employeeId,
        fullName: employee.fullName,
        position: employee.position || "Employee",
        completedTaskTitles,
        personalVelocity: velocity.toFixed(2), // báo cho AI tốc độ của nhân viên này
      })

      // Store basic data in temporary array
      suggestions.push({
        employeeId,
        fullName: employee.fullName,
        position: employee.position || null,
        skillScore: 0, // Will be filled by Gemini
        workloadScore,
        availabilityScore,
        finalScore: 0, // Will be calculated below
        reasons: [],
      })
    }

    // 4. Call General AI API to calculate Skill Match Score
    try {
      const prompt = `
        Bạn là giám đốc kỹ thuật hoặc quản lý dự án công nghệ. Hãy phân tích độ tương thích kỹ năng (Skill Match) của từng nhân viên đối với Task mục tiêu.

        Task mục tiêu:
        - Tiêu đề: "${task.title}"
        - Mô tả: "${task.description || "Không có mô tả"}"
        - Tracker: "${task.tracker}"
        - Độ ưu tiên: "${task.priority}"

        Danh sách các ứng viên:
        ${JSON.stringify(geminiCandidatesContext, null, 2)}

        Yêu cầu:
        1. Chấm điểm kỹ năng (skillScore) từ 0 đến 100 cho từng ứng viên dựa trên chức danh (position) và danh sách các task tương tự họ từng làm (completedTaskTitles).
        2. Viết 2 lý do ngắn gọn bằng tiếng Việt giải thích vì sao họ có điểm số kỹ năng đó (tập trung vào chuyên môn kỹ thuật).
        3. Trả về đúng định dạng JSON là một mảng chứa các đối tượng có thuộc tính: "employeeId" (string), "skillScore" (number), "reasons" (mảng string gồm đúng 2 lý do ngắn gọn).

        Chú ý: Trả về duy nhất dữ liệu JSON sạch, không thêm bất kỳ dòng chữ giải thích nào ngoài JSON.
      `

      const geminiResults = await aiClient.generateJson<Array<{
        employeeId: string
        skillScore: number
        reasons: string[]
      }>>(prompt)

      // Map Gemini results back to suggestions and compute finalScore
      for (const s of suggestions) {
        const geminiRes = geminiResults.find((r) => r.employeeId === s.employeeId)
        if (geminiRes) {
          s.skillScore = geminiRes.skillScore
          s.reasons = geminiRes.reasons
        } else {
          s.skillScore = 50 // default fallback
          s.reasons = ["AI chưa phân tích được kỹ năng."]
        }

        // Apply velocity to skill score: faster velocity increases/scales the skill match score
        const velocity = velocities.get(s.employeeId) || 1.0
        const adjustedSkillScore = Math.min(100, s.skillScore * velocity)

        // Calculate final score: H_avail * (0.7 * S_skill_adjusted + 0.3 * S_workload)
        const availabilityFactor = s.availabilityScore / 100
        const rawScore = 0.7 * adjustedSkillScore + 0.3 * s.workloadScore
        s.finalScore = Math.round(availabilityFactor * rawScore * 10) / 10
      }

      // Sort by finalScore descending
      suggestions.sort((a, b) => b.finalScore - a.finalScore)
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      // Fallback in case of API failure
      for (const s of suggestions) {
        const skillScore = 60
        const velocity = velocities.get(s.employeeId) || 1.0
        const adjustedSkillScore = Math.min(100, skillScore * velocity)
        const finalScore = (s.availabilityScore / 100) * (0.7 * adjustedSkillScore + 0.3 * s.workloadScore)
        s.skillScore = skillScore
        s.finalScore = Math.round(finalScore * 10) / 10
        s.reasons = ["Gặp lỗi khi gọi AI API. Đây là điểm số dự phòng có tính đến tốc độ."]
      }
    }

    return suggestions
  }

  /**
   * Generates a list of suggested tasks to complete a project using General AI.
   */
  async generateProjectTasks(projectId: string): Promise<GeneratedTaskSuggestion[]> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const prompt = `
      Bạn là Tech Lead dự án. Hãy phân rã dự án sau đây thành một danh sách gồm 5 đến 8 công việc (Tasks) cụ thể, chi tiết cần làm để hoàn thành dự án.

      Thông tin dự án:
      - Tên dự án: "${project.name}"
      - Mô tả: "${project.description || "Không có mô tả"}"
      - Công nghệ sử dụng: ${JSON.stringify(project.techStack)}

      Yêu cầu trả về cấu trúc dữ liệu JSON là một mảng các đối tượng chứa:
      - "title": tiêu đề công việc ngắn gọn (tiếng Việt)
      - "description": mô tả chi tiết công việc cần thực hiện (tiếng Việt)
      - "tracker": loại công việc (chỉ được phép chọn 1 trong các giá trị: "feature", "task", "support", "test")
      - "priority": độ ưu tiên (chỉ được chọn 1 trong các giá trị: "low", "medium", "high", "urgent")
      - "estimatedTime": số giờ dự kiến để hoàn thành (nhập số nguyên từ 2 đến 40)

      Chú ý: Trả về duy nhất dữ liệu JSON sạch.
    `

    const taskSuggestions = await aiClient.generateJson<GeneratedTaskSuggestion[]>(prompt)
    return taskSuggestions
  }
}
