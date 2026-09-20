export type UserRole = 'ADMIN' | 'SHOPPER' | 'SELLER';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface VerifyResponse {
  id: string;
  email: string;
  status: UserStatus;
  message: string;
}
