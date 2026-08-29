import { apiClient } from "./client";

export interface Template {
  id: string;
  name: string;
  campaign_type: string;
  body: string;
  language: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplatePayload {
  name: string;
  campaign_type: string;
  body: string;
  language: string;
}

export interface TemplateFilters {
  campaign_type?: string;
  language?: string;
}

// GET /templates/
export async function fetchTemplates(
  filters?: TemplateFilters
): Promise<Template[]> {
  const response = await apiClient.get<Template[]>("/templates/", {
    params: filters,
  });

  return response.data;
}

// GET /templates/{template_id}
export async function fetchTemplate(
  id: string
): Promise<Template> {
  const response = await apiClient.get<Template>(
    `/templates/${id}`
  );

  return response.data;
}

// POST /templates/
export async function createTemplate(
  data: CreateTemplatePayload
): Promise<Template> {
  const response = await apiClient.post<Template>(
    "/templates/",
    data
  );

  return response.data;
}

// PUT /templates/{template_id}
export async function updateTemplate(
  id: string,
  data: CreateTemplatePayload
): Promise<Template> {
  const response = await apiClient.put<Template>(
    `/templates/${id}`,
    data
  );

  return response.data;
}

// DELETE /templates/{template_id}
export async function deleteTemplate(
  id: string
): Promise<void> {
  await apiClient.delete(`/templates/${id}`);
}