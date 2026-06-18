export const HRP_API_CONSTANTS = {
	BASE_URL: process.env.HRP_API_BASE_URL || "http://localhost:5000",
	ENDPOINTS: {
		AUTH: {
			LOGIN: "/api/auth/login",
			LOGOUT: "/api/auth/logout",
		},
		APPLICATION: {
			BASE: "/api/1.0/hrm/application",
			APPROVE: (id: string) => `/api/1.0/hrm/application/${id}/approve`,
			REJECT: (id: string) => `/api/1.0/hrm/application/${id}/reject`,
		},
		ATTENDANCE: {
			BASE: "/api/attendance",
			CHECK_IN: "/api/attendance/check-in",
			CHECK_OUT: "/api/attendance/check-out",
			SCAN: "/api/attendance/scan",
		},
		SHIFTS: {
			BASE: "/api/shifts",
			SCHEDULES_MY: "/api/schedules/my",
			SHIFT_CHANGE_REQUESTS: "/api/shift-change-requests",
		},
		PAYROLL: {
			MY_PAYSLIPS: "/api/payrolls/my/payslips",
		},
		PROJECTS: {
			BASE: "/api/projects",
			TASKS: "/api/tasks",
		},
	},
};
