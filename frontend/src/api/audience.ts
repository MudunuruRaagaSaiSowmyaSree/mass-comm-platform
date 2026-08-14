import { apiClient } from "./client";

export interface AudienceMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  language: string;
  geography: string | null;
  occupation: string | null;
}

export async function fetchAudience(): Promise<AudienceMember[]> {
  const res = await apiClient.get("/audience/");
  return res.data;
}

export async function createAudienceMember(data: Partial<AudienceMember>) {
  const res = await apiClient.post("/audience/", data);
  return res.data;
}

export async function deleteAudienceMember(id: string) {
  await apiClient.delete(`/audience/${id}`);
}
export interface SegmentFilters {
  language?: string;
  geography?: string;
}

export async function fetchSegment(filters: SegmentFilters): Promise<AudienceMember[]> {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.geography) params.append("geography", filters.geography);
  const res = await apiClient.get(`/audience/segment?${params.toString()}`);
  return res.data;
}

export async function fetchSegmentCount(filters: SegmentFilters): Promise<number> {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.geography) params.append("geography", filters.geography);
  const res = await apiClient.get(`/audience/segment/count?${params.toString()}`);
  return res.data.count;
}