export const PAYROLL_MESSAGES = {
  ERRORS: {
    SALARY_CONFIG_NOT_FOUND: (employeeId: string) =>
      `Không tìm thấy cấu hình lương đang hoạt động cho nhân viên ${employeeId}`,
    PAYROLL_NOT_FOUND: "Không tìm thấy bảng lương",
    PAYSLIP_NOT_FOUND: "Không tìm thấy phiếu lương",
    TEMPLATE_NOT_FOUND_CREATE: "Không tìm thấy mẫu sau khi tạo",
    TEMPLATE_NOT_FOUND_UPDATE: "Không tìm thấy mẫu sau khi cập nhật",
    INVALID_FORMULA: (error: string) => `Công thức không hợp lệ: ${error}`,
    FORMULA_MUST_BE_NUMBER: "Công thức phải trả về một số",
    SALARY_VARIABLE_NOT_FOUND: "Không tìm thấy biến số lương",
    SALARY_VARIABLE_EXISTS: "Biến số lương với mã này đã tồn tại",
    PAYROLL_ALREADY_EXISTS: "Bảng lương cho kỳ này đã tồn tại",
  },
} as const
