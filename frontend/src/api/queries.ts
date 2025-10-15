import { apiClient } from "./client";
import {
  CallListResponse,
  ClassificationRequest,
  ClassificationResponse,
  DashboardSummary,
  DateRangeParams,
  Sender,
  SmsListResponse
} from "./types";

export const fetchSummary = async (params?: DateRangeParams): Promise<DashboardSummary> => {
  const { data } = await apiClient.get<DashboardSummary>("/summary", { params });
  return data;
};

export const fetchSms = async (params?: DateRangeParams): Promise<SmsListResponse> => {
  const { data } = await apiClient.get<SmsListResponse>("/sms", { params });
  return data;
};

export const fetchCalls = async (params?: DateRangeParams): Promise<CallListResponse> => {
  const { data } = await apiClient.get<CallListResponse>("/calls", { params });
  return data;
};

export const classifyText = async (
  payload: ClassificationRequest
): Promise<ClassificationResponse> => {
  const { data } = await apiClient.post<ClassificationResponse>("/classification", payload);
  return data;
};

export const blockSender = async (senderId: number): Promise<Sender> => {
  const { data } = await apiClient.post<Sender>(`/senders/${senderId}/block`);
  return data;
};

export const unblockSender = async (senderId: number): Promise<Sender> => {
  const { data } = await apiClient.post<Sender>(`/senders/${senderId}/unblock`);
  return data;
};
