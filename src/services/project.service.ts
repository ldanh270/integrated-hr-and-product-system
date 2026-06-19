import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateProjectInput,
	UpdateProjectInput,
	ListProjectsInput,
	CreateTaskInput,
	UpdateTaskInput,
	ListTasksInput,
	LogSpentTimeInput,
	UpdateSpentTimeInput,
	ListSpentTimesInput,
} from "../schemas/project.schema.js";

export class ProjectService {
	private client(jwt: string) {
		return createAuthedClient(jwt);
	}

	private handleError(error: any, fallback: string): never {
		if (error.response) {
			throw new Error(
				error.response.data?.message || error.response.data?.error?.message || fallback,
			);
		}
		throw new Error(`Connection error: ${error.message}`);
	}

	// ─── Projects ────────────────────────────────────────────────────────────────

	async listProjects(jwt: string, params?: ListProjectsInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.BASE, { params });
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch projects");
		}
	}

	async getProject(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch project");
		}
	}

	async createProject(jwt: string, data: CreateProjectInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create project");
		}
	}

	async updateProject(jwt: string, id: string, data: UpdateProjectInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update project");
		}
	}

	async deleteProject(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete project");
		}
	}

	async getProjectMembers(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBERS(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch project members");
		}
	}

	async addProjectMember(jwt: string, projectId: string, employeeId: string) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBERS(projectId),
				{ employeeId },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to add project member");
		}
	}

	async removeProjectMember(jwt: string, projectId: string, employeeId: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBER_BY_ID(projectId, employeeId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to remove project member");
		}
	}

	// ─── Tasks ────────────────────────────────────────────────────────────────────

	async listTasks(jwt: string, params?: ListTasksInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.TASKS, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch tasks");
		}
	}

	async getTask(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch task");
		}
	}

	async createTask(jwt: string, data: CreateTaskInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.TASKS, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create task");
		}
	}

	async updateTask(jwt: string, id: string, data: UpdateTaskInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update task");
		}
	}

	async deleteTask(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete task");
		}
	}

	// ─── Categories ───────────────────────────────────────────────────────────────

	async listCategories(jwt: string, projectId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORIES(projectId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch categories");
		}
	}

	async createCategory(jwt: string, projectId: string, name: string) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORIES(projectId),
				{ name },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create category");
		}
	}

	async updateCategory(jwt: string, projectId: string, categoryId: string, name: string) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORY_BY_ID(projectId, categoryId),
				{ name },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update category");
		}
	}

	async deleteCategory(jwt: string, projectId: string, categoryId: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORY_BY_ID(projectId, categoryId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete category");
		}
	}

	// ─── Spent Times ──────────────────────────────────────────────────────────────

	async listSpentTimes(jwt: string, params?: ListSpentTimesInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIMES, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch spent times");
		}
	}

	async getSpentTime(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch spent time");
		}
	}

	async logSpentTime(jwt: string, data: LogSpentTimeInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIMES,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to log spent time");
		}
	}

	async updateSpentTime(jwt: string, id: string, data: UpdateSpentTimeInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update spent time");
		}
	}

	async deleteSpentTime(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete spent time");
		}
	}
}

export const projectService = new ProjectService();
