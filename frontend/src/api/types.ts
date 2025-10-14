export interface MessageStats {
  total_messages: number;
  blocked_messages: number;
  unique_senders: number;
  spam_percentage: number;
  top_sender_number: string | null;
}

export interface MessageCategorySummary {
  category: string;
  total_messages: number;
  unique_senders: number;
  blocked: number;
  sample_preview: string;
}

export interface MessageRead {
  id: number;
  sender_id: number | null;
  sender_number: string | null;
  receiver_number: string;
  body: string;
  category: string | null;
  received_at: string;
  is_spam: boolean;
  confidence: number | null;
  blocked: boolean;
}

export interface SmsListResponse {
  stats: MessageStats;
  categories: MessageCategorySummary[];
  recent_messages: MessageRead[];
}

export interface CallStats {
  total_calls: number;
  blocked_calls: number;
  unique_callers: number;
  spam_percentage: number;
  top_caller_number: string | null;
}

export interface CallCategorySummary {
  category: string;
  total_calls: number;
  unique_callers: number;
  blocked: number;
  sample_preview: string;
}

export interface CallRead {
  id: number;
  caller_id: number | null;
  caller_number: string | null;
  callee_number: string;
  started_at: string;
  duration_seconds: number;
  category: string | null;
  is_spam: boolean;
  confidence: number | null;
  blocked: boolean;
}

export interface CallListResponse {
  stats: CallStats;
  categories: CallCategorySummary[];
  recent_calls: CallRead[];
}

export interface DashboardSummary {
  timeframe: string;
  sms: MessageStats;
  calls: CallStats;
  overall_block_rate: number;
  avg_confidence: number;
}

export interface ClassificationRequest {
  text: string;
}

export interface ClassificationResponse {
  is_spam: boolean;
  confidence: number;
  category: string;
  rationale: string;
}
