import { apiClient } from "./client";

export interface ChannelConfig {
  id?: string;
  channel: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ChannelConfigUpdate {
  enabled?: boolean;
  config?: Record<string, unknown>;
}

// GET /channel-config
export async function fetchChannelConfigs(): Promise<ChannelConfig[]> {
  const response = await apiClient.get<ChannelConfig[]>(
    "/channel-config"
  );

  return response.data;
}

// GET /channel-config/{channel}
export async function fetchChannelConfig(
  channel: string
): Promise<ChannelConfig> {
  const response = await apiClient.get<ChannelConfig>(
    `/channel-config/${channel}`
  );

  return response.data;
}

// PUT /channel-config/{channel}
export async function updateChannelConfig(
  channel: string,
  data: ChannelConfigUpdate
): Promise<ChannelConfig> {
  const response = await apiClient.put<ChannelConfig>(
    `/channel-config/${channel}`,
    data
  );

  return response.data;
}

// POST /channel-config/{channel}/enable
export async function enableChannel(
  channel: string
): Promise<ChannelConfig> {
  const response = await apiClient.post<ChannelConfig>(
    `/channel-config/${channel}/enable`
  );

  return response.data;
}

// POST /channel-config/{channel}/disable
export async function disableChannel(
  channel: string
): Promise<ChannelConfig> {
  const response = await apiClient.post<ChannelConfig>(
    `/channel-config/${channel}/disable`
  );

  return response.data;
}