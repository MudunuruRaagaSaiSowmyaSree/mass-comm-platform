import { apiClient } from "./client";

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

export async function registerUser(data: RegisterPayload) {
  const res = await apiClient.post("/auth/register", data);
  return res.data;
}

export async function loginUser(email: string, password: string) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}