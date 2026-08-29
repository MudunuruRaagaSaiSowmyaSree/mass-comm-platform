import { apiClient } from "./client";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "admin" | "campaign_manager" | "comms_team";
  is_active: boolean;
  registration_date: string | null;

  admin_id: string | null;
  department: string | null;
  access_level: string | null;

  manager_id: string | null;
  assigned_region: string | null;
  shift_timing: string | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "campaign_manager" | "comms_team";

  admin_id?: string;
  department?: string;
  access_level?: string;
  manager_id?: string;
  assigned_region?: string;
  shift_timing?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UpdateCurrentUserPayload {
  name?: string;
  phone?: string;
  department?: string;
  access_level?: string;
  assigned_region?: string;
  shift_timing?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// ============================================================
// FORGOT PASSWORD PAYLOAD
// ============================================================

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string;
  expires_in_minutes?: number;
}

// ============================================================
// RESET PASSWORD PAYLOAD
// ============================================================

export interface ResetPasswordResponse {
  message: string;
}

// ============================================================
// REGISTER
// ============================================================

export async function registerUser(
  data: RegisterPayload
) {
  const response = await apiClient.post(
    "/auth/register",
    data
  );

  return response.data;
}

// ============================================================
// LOGIN
// ============================================================

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const form = new URLSearchParams();

  form.append("username", email);
  form.append("password", password);

  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    form,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

// ============================================================
// CURRENT USER
// ============================================================

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response =
    await apiClient.get<CurrentUser>(
      "/auth/me"
    );

  return response.data;
}

// ============================================================
// UPDATE CURRENT USER
// ============================================================

export async function updateCurrentUser(
  data: UpdateCurrentUserPayload
) {
  const response = await apiClient.put(
    "/auth/me",
    data
  );

  return response.data;
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changePassword(
  data: ChangePasswordPayload
) {
  const response = await apiClient.post(
    "/auth/change-password",
    null,
    {
      params: {
        current_password: data.current_password,
        new_password: data.new_password,
      },
    }
  );

  return response.data;
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  const response =
    await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      null,
      {
        params: {
          email: email.trim(),
        },
      }
    );

  return response.data;
}

// ============================================================
// RESET PASSWORD
// ============================================================

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const response =
    await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      null,
      {
        params: {
          token,
          new_password: newPassword,
        },
      }
    );

  return response.data;
}