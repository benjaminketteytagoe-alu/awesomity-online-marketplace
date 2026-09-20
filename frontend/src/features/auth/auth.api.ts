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
};
