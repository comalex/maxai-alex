export const EXTENSION_MESSAGE_TYPES = {
  SERVICE_WORKER_FETCH: "FETCH_REQUEST",
  RETRIEVE_ONLY_FANS_MESSAGES: "retrieve-only-fans-messages",
  CHECK_PROCESSING_MESSAGE: "check-processing-message",
  READ_CURRENT_VAULT: "read_current_vault",
  READ_HTML: "READ_HTML",
  SEND_MESSAGE_HISTORY: "send-message-history",
  SUGGESTED_MESSAGE_TEXT: "suggested-message-text",
  COMMAND_MESSAGE_TEXT: "command-message-text",
  ERROR: "socket-error",
  MODELS: "models",
  RECONNECT: "RECONNECT",
  GENERATE_AUDIO: "GENERATE_AUDIO",
  URL_CHANGED: "URL_CHANGED",
  VAULT_UPDATE: "VAULT_UPDATE",
  REFRESH_OF_PAGE: "REFRESH_OF_PAGE",
  RETRIEVE_ONLY_FANS_SUBS: "retrieve-only-fans-subs",

  FROM_FE: "FROM_FE",
  LOGGER: "logger",
  OPEN_TAB: "OPEN_TAB",

  ADD_LISTENERS: "ADD_LISTENERS",
  ADD_URL_CHANGE_LISTENERS: "ADD_URL_CHANGE_LISTENERS",

  URL_CHANGE_LISTENER: "URL_CHANGE_LISTENER",
  INSTALL_SCRIPT: "INSTALL_SCRIPT",
  CHECK_URL: "CHECK_URL"
};

export enum ExtensionMessageTypes {
  COMMAND_MESSAGE_TEXT = "command_response",
  IMAGE_RESPONSE = "image_response",

  CUSTOM_MEDIA_REQUEST = "custom_media_request",
  IRL_MEETING_REQUEST = "irl_meeting_request",
  VIDEO_CHAT_REQUEST = "video_chat_request",
  DISCOUNT_REQUEST = "discount_request",
  GIFT_OPPORTUNITY = "gift_opportunity",
  MODERATION_FILTER_TRIGGERED = "moderation_filter_triggered"
}

export const Status = {
  paid: "Paid",
  notPaid: "Not Paid",
  read: "Read",
  notRead: "Not Read"
};

export type StatusType = (typeof Status)[keyof typeof Status];

export const MESSAGES = {};

export const STORAGE_KEYS = {
  JWT_TOKEN: "jwtToken",
  AGENCY_UUID: "AGENCY_UUID",
  CHAT_JWT_TOKEN: "chatJwtToken",
  USER_UUID: "userUUID",
  SELECTED_MODEL: "model-2",
  PAYMENTS: "payments",
  CHATTER: "CHATTER",
  MODELS: "models",
  WHATSAPP_GROUP_NAME: "WHATSAPP_GROUP_NAME",
  DEPRIORITIZED_DAYS: "deprioritizedDays",
  MESSAGE_THRESHOLD: "messageThreshold",
  USER_DATA: "USER_DATA",
  DEBUG_MODE: "DEBUG_MODE",
  EXPRESS_TURNAROUND: "EXPRESS_TURNAROUND",
  DISCOUNT_PERCENTAGE: "DISCOUNT_PERCENTAGE",
  BLANK_USER_MESSAGE_SETTINGS: "blankUserMessageSettings",
  ACCOUNT_ID: "ACCOUNT_ID",
  CUSTOM_INFLUENCER_NAME: "CUSTOM_INFLUENCER_NAME_1",
  CUSTOM_VAULT_ID: "CUSTOM_VAULT_ID",
  LAST_FAN_SPEND: "LAST_FAN_SPEND",
  CUSTOM_ACCOUNT_NAME: "CUSTOM_ACCOUNT_NAME",
  VOICE_GENERATION_ABILITY: "VOICE_GENERATION_ABILITY",
};

const PE = {
  PLASMO_PUBLIC_CHAT_API_URL: "https://socket.pdfviewer.click",
  PLASMO_PUBLIC_API_URL: "https://devapi.pdfviewer.click",
  PLASMO_PUBLIC_SENTRY_DSN: "",
  PLASMO_PUBLIC_SLACK_BOT_TOKEN_PRO: "",
  PLASMO_PUBLIC_SLACK_CHANNEL_PRO: "",
  PLASMO_PUBLIC_DATADOG_API_KEY: "fc981ef759be24f0016465e68b168432",
  FERNET_SECRET_KEY: "rcV8OUJeLD3ii_flzSnN6jgSF6iOvAvZt7p75p1Xl_o="
}
export const CHAT_API_URL = PE.PLASMO_PUBLIC_CHAT_API_URL;
export const API_URL = PE.PLASMO_PUBLIC_API_URL;
export const SENTRY_DSN = PE.PLASMO_PUBLIC_SENTRY_DSN;
export const CALENDLY_API_KEY = PE.PLASMO_PUBLIC_CALENDLY_API_KEY;

export const SORT_MEDIA_MODAL_KEYS = {
  MEDIA: "sort-media",
  FOLDER: "sort-folder",
  FOLDER_MEDIA: "sort-folder-media",
  SETS: "sort-sets"
};

export const CHAT_ID = "37813542-0dca-5a8a-b2a2-b69c2d45583f"; // TODO with a new account we have to change this or maybe remove

export const DEFAULT_DRIP_MESSAGE =
  "<blank> INFORMATION: XOT sends a seductive message to encourage [usr] to respond (drip) ENDINFORMATION";

export const MESSAGE_INTENT_ENGINE_TYPE = {
  NEGATIVE_ACCUSATION: "XOT Negative Accusation (Direct or Implied)",
  CONTROVERSIAL_TOPIC: "Controversial Topic",
  IRL_MEETING_REQUEST: "IRL Meeting Request",
  VIDEO_CHAT_REQUEST: "Video Chat Request",
  CUSTOM_MEDIA_REQUEST: "Custom Media Request",
  DISCOUNT_REQUEST: "Discount Request",
  GIFT_OPPORTUNITY: "Gift Opportunity",
  GIFT_SUMMARY: "Gift Summary"
};

export const PERMITTED_ROLES = [1, 2]; // 1 = Developer, 2 = Super Admin
