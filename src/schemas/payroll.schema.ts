import { z } from "zod";
import { SALARY_COMPONENT_TYPES } from "../constants/entities/payroll.config.js";

// ─── Salary Components ────────────────────────────────────────────────────────
const ComponentTypeEnum = z.enum(SALARY_COMPONENT_TYPES);
const ComponentValueType = z.enum(["currency", "number", "percentage"]);

export const CreateSalaryComponentSchema = z.object({
	name: z.string().min(1),
	type: ComponentTypeEnum,
	valueType: ComponentValueType,
	formula: z.string().min(1),
	description: z.string().optional(),
}).strict();

export const UpdateSalaryComponentSchema = CreateSalaryComponentSchema.partial().strict();

export const ValidateFormulaSchema = z.object({
	formula: z.string().min(1),
}).strict();

// ─── Salary Variables ─────────────────────────────────────────────────────────
export const CreateSalaryVariableSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	value: z.number(),
	description: z.string().optional(),
}).strict();

export const UpdateSalaryVariableSchema = CreateSalaryVariableSchema.partial().strict();

// ─── Payslip Templates ────────────────────────────────────────────────────────
export const CreatePayslipTemplateSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	componentIds: z.array(z.string()).min(1),
}).strict();

export const UpdatePayslipTemplateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	componentIds: z.array(z.string()).min(1).optional(),
}).strict();

// ─── Employee Salary Config ───────────────────────────────────────────────────
export const SetSalaryConfigSchema = z.object({
	templateId: z.string(),
	baseSalary: z.number().positive(),
	effectiveFrom: z.string().datetime(),
	effectiveTo: z.string().datetime().nullable().optional(),
	note: z.string().optional(),
}).strict();

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const GeneratePayrollSchema = z.object({
	periodMonth: z.number().int().min(1).max(12),
	periodYear: z.number().int().min(2000),
	name: z.string().min(1),
}).strict();

export const UpdatePayrollSettingsSchema = z.object({
	triggerDay: z.number().int().min(1).max(31),
	triggerHour: z.number().int().min(0).max(23),
	triggerMinute: z.number().int().min(0).max(59),
}).strict();

export const RejectPayrollSchema = z.object({
	rejectReason: z.string().min(1),
}).strict();

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type CreateSalaryComponentInput = z.infer<typeof CreateSalaryComponentSchema>;
export type UpdateSalaryComponentInput = z.infer<typeof UpdateSalaryComponentSchema>;
export type ValidateFormulaInput = z.infer<typeof ValidateFormulaSchema>;

export type CreateSalaryVariableInput = z.infer<typeof CreateSalaryVariableSchema>;
export type UpdateSalaryVariableInput = z.infer<typeof UpdateSalaryVariableSchema>;

export type CreatePayslipTemplateInput = z.infer<typeof CreatePayslipTemplateSchema>;
export type UpdatePayslipTemplateInput = z.infer<typeof UpdatePayslipTemplateSchema>;

export type SetSalaryConfigInput = z.infer<typeof SetSalaryConfigSchema>;

export type GeneratePayrollInput = z.infer<typeof GeneratePayrollSchema>;
export type UpdatePayrollSettingsInput = z.infer<typeof UpdatePayrollSettingsSchema>;
export type RejectPayrollInput = z.infer<typeof RejectPayrollSchema>;
