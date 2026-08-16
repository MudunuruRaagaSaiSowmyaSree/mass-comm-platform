import { apiClient } from "./client";

export interface DeliverySummary {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
}

export interface MessageDelivery {
  id: string;
  recipient_id: string;
  channel: string;
  status: string;
  provider_message_id?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
}

// GET /message-delivery/summary
export async function fetchDeliverySummary(): Promise<DeliverySummary> {
  const response = await apiClient.get<DeliverySummary>(
    "/message-delivery/summary"
  );

  return response.data;
}

// POST /message-delivery/{recipient_id}/send
export async function sendMessage(
  recipientId: string
): Promise<MessageDelivery> {
  const response = await apiClient.post<MessageDelivery>(
    `/message-delivery/${recipientId}/send`
  );

  return response.data;
}

// GET /message-delivery/{recipient_id}
export async function fetchDeliveries(
  recipientId: string
): Promise<MessageDelivery[]> {
  const response = await apiClient.get<MessageDelivery[]>(
    `/message-delivery/${recipientId}`
  );

  return response.data;
}