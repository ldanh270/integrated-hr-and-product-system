import type { User } from "@/store/auth-store";
export declare function useVirtualScanner(): {
    user: User | null;
    currentTime: Date;
    location: {
        lat: number;
        lng: number;
    } | null;
    locating: boolean;
    isProcessing: boolean;
    getLocation: () => void;
    handleScan: () => Promise<void>;
};
