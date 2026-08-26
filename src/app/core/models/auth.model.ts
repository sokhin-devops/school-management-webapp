export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

/** Shape of com.school_management_webapi.dto.response.UserResponse. */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenantId: string | null;
}

/** Shape of com.school_management_webapi.dto.response.AuthResponse. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

/** Shape of com.school_management_webapi.dto.response.ForgotPasswordResponse. */
export interface ForgotPasswordResponse {
  resetUrl: string | null;
}
