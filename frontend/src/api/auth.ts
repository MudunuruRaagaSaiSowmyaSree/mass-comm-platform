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

export async function registerUser(
  data: RegisterPayload
) {
  const response = await apiClient.post(
    "/auth/register",
    data
  );

  return response.data;
}

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
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>(
    "/auth/me"
  );

  return response.data;
}