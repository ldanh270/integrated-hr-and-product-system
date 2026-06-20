export interface ListEmployeesInput {
	page?: number;
	pageSize?: number;
	search?: string;
	role?: string;
	status?: "active" | "inactive" | "resigned" | "suspended" | "on_leave";
}

export interface CreateEmployeeInput {
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	joinDate?: string;
}

export interface UpdateEmployeeInput {
	firstName?: string;
	lastName?: string;
	role?: string;
}

export interface UpdateEmployeeStatusInput {
	status: "active" | "inactive" | "resigned" | "suspended" | "on_leave";
	reason?: string;
}
