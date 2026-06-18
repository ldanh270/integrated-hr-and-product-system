import { hrpClient, createAuthedClient } from '../utils/hrp-client.js';
import { HRP_API_CONSTANTS } from '../constants/hrp-api.constants.js';
import { LoginInput } from '../schemas/auth.schema.js';
import { LoginResponse, GenericResponse } from '../types/hrp-api.types.js';

export class AuthService {
  /**
   * Call HRP API to login and obtain a JWT Token
   */
  public async login(input: LoginInput): Promise<LoginResponse> {
    try {
      const response = await hrpClient.post<LoginResponse>(
        HRP_API_CONSTANTS.ENDPOINTS.AUTH.LOGIN,
        input
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Login failed from HRP API');
      }
      throw new Error(`Connection error: ${error.message}`);
    }
  }

  /**
   * Call HRP API to logout and invalidate the token on the server
   */
  public async logout(jwtToken: string): Promise<GenericResponse> {
    try {
      const authedClient = createAuthedClient(jwtToken);
      const response = await authedClient.post<GenericResponse>(
        HRP_API_CONSTANTS.ENDPOINTS.AUTH.LOGOUT
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Logout failed from HRP API');
      }
      throw new Error(`Connection error: ${error.message}`);
    }
  }
}

export const authService = new AuthService();
