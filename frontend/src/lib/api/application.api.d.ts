import type { IApplication } from "@/types/attendance.types";
export declare const applicationApi: {
    createApplication: (data: Partial<IApplication>) => Promise<IApplication>;
    getEmployeeApplications: (employeeId: string) => Promise<IApplication[]>;
    approveApplication: (id: string, status: string) => Promise<IApplication>;
};
