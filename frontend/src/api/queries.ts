import { apiClient } from "./client";
import {
  CallListResponse,
  ClassificationRequest,
  ClassificationResponse,
  DashboardSummary,
  SmsListResponse
} from "./types";

export const fetchSummary = async (): Promise<DashboardSummary> => {
  const { data } = await apiClient.get<DashboardSummary>("/summary");
  return data;
};

export const fetchSms = async (): Promise<SmsListResponse> => {
  const { data } = await apiClient.get<SmsListResponse>("/sms");
  return data;
};

export const fetchCalls = async (): Promise<CallListResponse> => {
  const { data } = await apiClient.get<CallListResponse>("/calls");
  return data;
};

export const classifyText = async (
  payload: ClassificationRequest
): Promise<ClassificationResponse> => {
  const { data } = await apiClient.post<ClassificationResponse>("/classification", payload);
  return data;
};
