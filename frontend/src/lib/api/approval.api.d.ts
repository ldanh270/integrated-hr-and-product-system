export interface IApprovalItem {
    id: string;
    category: "application" | "password_reset" | "recruitment_proposal";
    employeeId: string;
    employeeName: string;
    createdAt: string;
    status: string;
    details: Record<string, any>;
}
export declare const approvalApi: {
    getPendingApprovals: () => Promise<IApprovalItem[]>;
    processApproval: (category: string, id: string, status: "approved" | "rejected", rejectReason?: string) => Promise<any>;
};
