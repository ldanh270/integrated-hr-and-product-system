import type { ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts";
/**
 * Fetches the authenticated user's profile
 */
export declare const getMyProfile: () => Promise<ProfileDto>;
/**
 * Updates the authenticated user's profile
 */
export declare const updateMyProfile: (data: UpdateProfileDto) => Promise<ProfileDto>;
/**
 * Uploads a new avatar for the authenticated user
 */
export declare const uploadAvatar: (file: File) => Promise<ProfileDto>;
/**
 * Changes the authenticated user's password
 */
export declare const changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
