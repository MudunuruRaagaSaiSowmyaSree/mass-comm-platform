import { apiClient } from "./client";

export interface Campaign {
  id: string;
  title: string;
  type: string;
  status: string;
  target_filters: Record<string, string> | null;
  template_id: string | null;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await apiClient.get("/campaigns/");
  return res.data;
}

export async function transitionCampaign(id: string, newStatus: string) {
  const res = await apiClient.post(`/campaigns/${id}/transition`, { new_status: newStatus });
  return res.data;
}