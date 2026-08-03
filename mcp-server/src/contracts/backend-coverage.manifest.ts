export type CoverageStatus = 'align' | 'add' | 'replace' | 'exclude'

export type BackendModuleContract = {
  mount: string
  routeFile: `${string}.route.ts`
  mcpGroup: string
  status: CoverageStatus
  wave: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'never'
}

/**
 * Characterization baseline for every backend route module.
 * Keep this list in sync with backend/src/routes until route contracts are generated.
 */
export const BACKEND_MODULE_CONTRACTS = [
  { mount: '/api/auth', routeFile: 'auth.route.ts', mcpGroup: 'auth', status: 'align', wave: 1 },
  { mount: '/api/security', routeFile: 'security.route.ts', mcpGroup: 'security', status: 'add', wave: 7 },
  { mount: '/api/employees', routeFile: 'employee.route.ts', mcpGroup: 'employee', status: 'align', wave: 3 },
  { mount: '/api/employee-contracts', routeFile: 'employee-contract.route.ts', mcpGroup: 'employee-contract', status: 'add', wave: 6 },
  { mount: '/api/profile', routeFile: 'profile.route.ts', mcpGroup: 'profile', status: 'align', wave: 3 },
  { mount: '/api/shifts', routeFile: 'shift.route.ts', mcpGroup: 'shift', status: 'align', wave: 3 },
  { mount: '/api/schedules', routeFile: 'schedule.route.ts', mcpGroup: 'schedule', status: 'align', wave: 3 },
  { mount: '/api/attendance', routeFile: 'attendance.route.ts', mcpGroup: 'attendance', status: 'align', wave: 3 },
  { mount: '/api/applications', routeFile: 'application.route.ts', mcpGroup: 'application', status: 'replace', wave: 2 },
  { mount: '/api/shift-change-requests', routeFile: 'shift-change-request.route.ts', mcpGroup: 'shift-change', status: 'replace', wave: 2 },
  { mount: '/api/holidays', routeFile: 'holiday.route.ts', mcpGroup: 'holiday', status: 'replace', wave: 3 },
  { mount: '/api/regime-categories', routeFile: 'regime-category.route.ts', mcpGroup: 'regime-category', status: 'add', wave: 2 },
  { mount: '/api/weekly-schedule-templates', routeFile: 'weekly-schedule-template.route.ts', mcpGroup: 'weekly-template', status: 'replace', wave: 3 },
  { mount: '/api/part-time-availabilities', routeFile: 'part-time-availability.route.ts', mcpGroup: 'part-time-availability', status: 'add', wave: 3 },
  { mount: '/api/approvals', routeFile: 'approval.route.ts', mcpGroup: 'approval', status: 'add', wave: 2 },
  { mount: '/api/recruitment', routeFile: 'recruitment.route.ts', mcpGroup: 'recruitment', status: 'add', wave: 6 },
  { mount: '/api/salary-components', routeFile: 'salary-component.route.ts', mcpGroup: 'salary-component', status: 'align', wave: 4 },
  { mount: '/api/salary-variables', routeFile: 'salary-variable.route.ts', mcpGroup: 'salary-variable', status: 'align', wave: 4 },
  { mount: '/api/payslip-templates', routeFile: 'payslip-template.route.ts', mcpGroup: 'payslip-template', status: 'replace', wave: 4 },
  { mount: '/api/employees/:employeeId/salary-config', routeFile: 'employee-salary-config.route.ts', mcpGroup: 'salary-config', status: 'align', wave: 4 },
  { mount: '/api/payrolls', routeFile: 'payroll.route.ts', mcpGroup: 'payroll', status: 'align', wave: 4 },
  { mount: '/api/projects', routeFile: 'project.route.ts', mcpGroup: 'project', status: 'replace', wave: 5 },
  { mount: '/api/tasks', routeFile: 'task.route.ts', mcpGroup: 'task', status: 'align', wave: 5 },
  { mount: '/api/task-estimate-ai', routeFile: 'task-estimate-ai.route.ts', mcpGroup: 'task-estimate-ai', status: 'add', wave: 8 },
  { mount: '/api/capacity-copilot', routeFile: 'capacity-copilot.route.ts', mcpGroup: 'capacity-copilot', status: 'add', wave: 8 },
  { mount: '/api/permissions', routeFile: 'permission.route.ts', mcpGroup: 'permission', status: 'add', wave: 7 },
  { mount: '/api/roles', routeFile: 'role.route.ts', mcpGroup: 'role', status: 'add', wave: 7 },
  { mount: '/api/positions', routeFile: 'position.route.ts', mcpGroup: 'position', status: 'add', wave: 2 },
  { mount: '/api/audit', routeFile: 'audit.route.ts', mcpGroup: 'audit', status: 'add', wave: 7 },
  { mount: '/api/spent-times', routeFile: 'spent-time.route.ts', mcpGroup: 'spent-time', status: 'align', wave: 5 },
  { mount: '/api/custom-queries', routeFile: 'custom-query.route.ts', mcpGroup: 'custom-query', status: 'add', wave: 8 },
  { mount: '/api/debug', routeFile: 'debug.route.ts', mcpGroup: 'debug', status: 'exclude', wave: 'never' },
] as const satisfies readonly BackendModuleContract[]

export const CURRENT_MCP_TOOL_COUNTS = {
  application: 13,
  approval: 2,
  attendance: 4,
  auth: 3,
  employee: 7,
  'employee-contract': 2,
  holiday: 6,
  payroll: 26,
  'part-time-availability': 2,
  profile: 3,
  'regime-category': 1,
  project: 22,
  schedule: 10,
  'shift-change': 4,
  shift: 5,
  'weekly-template': 6,
} as const

export const CURRENT_MCP_TOOL_COUNT = Object.values(CURRENT_MCP_TOOL_COUNTS).reduce(
  (total, count) => total + count,
  0,
)
