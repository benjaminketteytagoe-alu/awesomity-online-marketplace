import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyResponse,
} from './auth.types';

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(ENDPOINTS.auth.login, payload);
    return data;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>(ENDPOINTS.auth.register, payload);
    return data;
  },

  async verify(token: string): Promise<VerifyResponse> {
    const { data } = await api.get<VerifyResponse>(ENDPOINTS.auth.verify, {
      params: { token },
    });
    return data;
  },

  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>(ENDPOINTS.auth.me);
    return data;
  },

  /**
   * POST /api/seller-applications/accept
   *
   * Public endpoint (no auth needed). The invite token is the
   * credential. On success, the backend creates a SELLER user and a
   * Store from the original application, then the applicant can log
   * in normally.
   *
   * Why this lives in auth.api: it creates credentials. Same category
   * of operation as register — the endpoint happens to be namespaced
   * under seller-applications, but the frontend responsibility is
   * "create an account from a token".
   */
  async acceptSellerInvite(payload: {
    inviteToken: string;
    password: string;
  }): Promise<{
    userId: string;
    storeId: string;
    email: string;
    name: string;
    role: string;
    status: string;
    message: string;
  }> {
    const { data } = await api.post(
      '/api/seller-applications/accept',
      payload,
    );
    return data;
  },
};
