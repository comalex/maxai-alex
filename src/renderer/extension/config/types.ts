import type { StatusType } from "./constants";

export interface ExtensionMessage {
  type: string;
  payload?: any;
}

export enum PaymentType {
  TIP = "tip",
  PURCHASE = "purchase"
}

type PaymentDaysAgo = { days_ago: number; paid: number };

export type PaymentResponse = {
  payments?: Payment[];
  totalUserTips?: number;
  totalUserPayments?: number;
  success: boolean;
  error?: string;
  countTotalUserTips: number;
  avgTotalUserTips: number;
  countTotalUserPayments: number;
  avgTotalUserPayments: number;
  totalUserTipDaysAgo: PaymentDaysAgo;
  totalUserPaymentDaysAgo: PaymentDaysAgo;
};

export type Payment = {
  id: string;
  type: PaymentType;
  user_id?: string;
  price: number | string;
  time: string;
  status: StatusType;
  paidStatus: StatusType;
  imageUrl: string;
  vault_id?: number;
  vaultName: string;
  account_id?: string;
  content?: string;
  mediaTypes?: string[];
  user_uuid?: string;
};

export type Message = {
  username: string;
  accountName?: string;
  customUsername: string;
  user_id: string;
  messages: OnlyFansMessage[];
  payments: Payment[];
  accountId: string;
};

export type Vault = {
  mediaCount?: number;
  description?: string;
  name: string;
  uuid: string;
  suggested_price: number;
  influencer_uuid: string;
  tags: string[];
  accountId: string;
};

export type OnlyFansMessage = {
  id?: string;
  role: "influencer" | "user";
  content: string;
  attachments?: any[];
  time?: string;
};

export const SOCKET_MESSAGE = {
  JOIN_ROOM: "join_room",
  MESSAGE_RESPONSE: "message_response",
  NEW_MESSAGE: "new_message",
  GENERATE_AUDIO: "generate_audio"
};

export type Model = {
  uuid: string;
  name: string;
  y: string;
  influencer_character: string;
  x: string;
  influencer_character_last_name?: string;
};

export enum PageName {
  VaultList = "VaultList",
  Vault = "vault",
  Message = "message",
  PurchaseHistory = "PurchaseHistory",
  Help = "help",
  PurchaseHistoryTips = "PurchaseHistoryTips",
  AIModelSettings = "AIModelContext",
  VoicePage = "VoicePage",
  CustomRequests = "CustomRequests",
  GeneralSettings = "GeneralSettings",
  VideoChat = "VideoChat",
  LogOut = "LogOut",
  Leaderboard = "Leaderboard"
}

export interface Logger {
  debug: (...args: any[]) => void;
  clean: () => void;
}

export type DeprioritizeStike = {
  strike1: { time: Date } | null;
  strike2: { time: Date } | null;
  strike3: { time: Date } | null;
};

export interface User {
  user_id: string;
  note?: string;
  deprioritize_stikes?: DeprioritizeStike;
  timers: Timer[] | null;
  custom_user_name?: string;
  currentUserName?: string;
  name: string;
}

export interface Timer {
  amount: string;
  description: string;
  addedAt: number; // Timestamp when the timer was added
}

export type Agency = {
  uuid: string;
  name: string;
  settings: AgencySettings;
  audio_characters_remaining: number;
};

export type Account = {
  uuid: string;
  name: string;
  settings?: AccountSettings;
};

export type CustomContentPricing = {
  type: string;
  id: number;
  price: number;
  value: string;
  description: string;
  group: string;
};

export type AgencySettings = {
  uuid: string;
  agency_id: number;
  whatsapp_support_group_invite_link: string;
  whatsapp_chat_group_invite_link: string;
  whatsapp_chat_group_id?: string | null;
  whatsapp_support_group_id?: string | null;
  voice_generation_characters_remaining: number;
  blank_user_message_settings: string;
  learning_development: string;
  creator_tips_last: number;
  creator_purchases_last: number;
  creator_tips_cumulative: number;
  creator_purchases_cumulative: number;
  user_goal_1_lvl: number;
  user_goal_2_lvl: number;
  user_goal_3_lvl: number;
  chatter_comission: number;
  chatter_commision_visibility: boolean;
  individual_challange_activity: boolean;
  individual_challange_description: string;
  individual_challange_start_date: string;
  individual_challange_end_date: string;
  global_challange_activity: boolean;
  global_challange_description: string;
  global_challange_start_date: string;
  global_challange_end_date: string;
  whale_threshold: number;
  discount_percentage?: number | null;
  deprioritized_user_window?: number | null;
};

export type CustomNames = Array<{ value: string }> | null;

export type AccountSettings = {
  express_turnaround_amount?: number | null;
  deprioritized_user_window?: number | null;
  message_threshold?: number | null;
  discount_percentage?: number | null;
  drip_message?: string | null;
  custom_content_pricing?: CustomContentPricing[] | null;
  whatsapp_channel?: string | null;
  whatsapp_channel_link?: string | null;
  blank_user_message?: string | null;
  id: number;
  custom_names?: CustomNames;
  voice_id?: string | null;
  model?: Model;
  accepting_custom_requests?: number;
  accepting_meeting_in_real_life?: number;
  accepting_video_chats?: number;
  first_interaction_date?: string;
  creator_purchases_cumulative?: number;
  creator_purchases_last?: number;
  creator_tips_cumulative?: number;
  creator_tips_last?: number;
  customs_price_list?: string;
  auto_play_state?: boolean;
  auto_generate_response_state?: boolean;
  first_name?: string;
  last_name?: string;
};

export interface CustomRequest {
  id: number;
  created_at: string;
  uuid: string;
  description: string;
  promised_delivery_date: string;
  user_name: string;
  video_duration: number;
  turnaround_price?: number;
  base_price: number;
  account_id: string;
  completed_status: "Completed" | "Not Completed";
  title: string;
  user_uuid: string;
}

export type CustomRequestInput = Omit<
  CustomRequest,
  "id" | "created_at" | "uuid" | "completed_status"
>;

export interface OnlyFansMessageInput {
  external_id: string;
  user_id: string;
  influencer_id: number;
  account_id: string;
  user_uuid: string;
  role: "user" | "influencer";
  content: string;
  type: "media" | "text";
}

export interface UserActionInput {
  user_id: string;
  influencer_id: string;
  account_id: string;
  user_uuid: string;
  type: "copy-text" | "drag-drop";
}

export interface MessageWithFeedbackInput {
  user_id: string;
  message_text: string;
  response_text: string;
  message_date: string; // ISO 8601 format: '2024-08-13T12:00:00.000Z'
  chat_id?: string;
  influencer_id?: string; // Optional, as it can be null
  response_time?: number; // Optional, default is 0
  response_Time_prepare?: number; // Optional, default is 0
  response_Time_moderation_engine?: number; // Optional, default is 0
  response_Time_intent_engine?: number; // Optional, default is 0
  response_Time_link_match?: number; // Optional, default is 0
  response_Time_get_response?: number; // Optional, default is 0
  imagePath?: string; // Optional, can be an empty string
  linkPath?: string; // Optional, can be an empty string
  moderation_result?: string; // Optional, can be an empty string
  is_regeneration?: boolean; // Optional, default is false
  payment_mode_enabled?: boolean; // Optional, default is false
  user_balance_before?: number; // Optional, can be null
  visible_in_history?: boolean; // Optional, default is false
  audio_file_url?: string; // Optional, can be an empty string
  voice_msg_length?: number; // Optional, default is 0
  message_type_id?: number; // Optional, default is 3
  assistant_original?: string | null; // Optional, can be null
  image_nsfw?: boolean; // Optional, default is false
  intent_engine_cost?: number; // Optional, default is 0
  link_search_cost?: number; // Optional, default is 0
  post_price?: number; // Optional, can be null
  post_id?: number; // Optional, can be null
  feedback_text?: string;
  feedback?: number;
  training_data_history?: string;
  of_message_external_id?: string;
}

type GetUserPerformanceResponseData = {
  agency_default_revenue: number;
  email: string;
  revenue_goal?: number;
  time_goal: number;
  total_paid_payments_today: number;
  total_shift_duration_seconds: number;
};

export type GetUserPerformanceResponse = {
  success: boolean;
  error?: string;
  data?: GetUserPerformanceResponseData;
};

export interface LeaderboardEntry {
  rank: number;
  user_uuid: string;
  name: string;
  purchases: number;
  tips: number;
  total_payments_amount: number;
  worked_hours: number;
}
