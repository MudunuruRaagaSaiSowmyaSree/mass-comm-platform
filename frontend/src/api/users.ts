import { apiClient } from "./client";


export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  registration_date: string | null;
  manager_id: string | null;
}


export interface TeamMembersResponse {
  manager_id: string | null;
  total: number;
  members: TeamMember[];
}


/**
 * GET /users/team-members
 */
export async function fetchTeamMembers(): Promise<TeamMembersResponse> {
  const response =
    await apiClient.get<TeamMembersResponse>(
      "/users/team-members"
    );

  return response.data;
}