import type { CreateEmployeeDto, EmployeeListQuery, UpdateEmployeeDto, UpdateStatusDto } from "@/types/employee.types";
export declare const employeeKeys: {
    all: readonly ["employees"];
    lists: () => readonly ["employees", "list"];
    list: (query: EmployeeListQuery) => readonly ["employees", "list", EmployeeListQuery];
    details: () => readonly ["employees", "detail"];
    detail: (id: string) => readonly ["employees", "detail", string];
};
export declare function useEmployees(query: EmployeeListQuery): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/types/employee.types").PaginatedEmployees>, Error>;
export declare function useEmployee(id: string): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/types/employee.types").Employee>, Error>;
export declare function useCreateEmployee(): import("@tanstack/react-query").UseMutationResult<import("@/types/employee.types").Employee, Error, CreateEmployeeDto, unknown>;
export declare function useUpdateEmployee(): import("@tanstack/react-query").UseMutationResult<import("@/types/employee.types").Employee, Error, {
    id: string;
    data: UpdateEmployeeDto;
}, unknown>;
export declare function useUpdateEmployeeStatus(): import("@tanstack/react-query").UseMutationResult<import("@/types/employee.types").Employee, Error, {
    id: string;
    data: UpdateStatusDto;
}, unknown>;
