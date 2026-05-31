import type { ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts";
export declare const useProfile: () => import("@tanstack/react-query").UseQueryResult<NoInfer<ProfileDto>, Error>;
export declare const useUpdateProfile: () => import("@tanstack/react-query").UseMutationResult<ProfileDto, Error, UpdateProfileDto, unknown>;
export declare const useUploadAvatar: () => import("@tanstack/react-query").UseMutationResult<ProfileDto, Error, File, unknown>;
export declare const useChangePassword: () => import("@tanstack/react-query").UseMutationResult<void, Error, {
    oldPassword: string;
    newPassword: string;
}, unknown>;
