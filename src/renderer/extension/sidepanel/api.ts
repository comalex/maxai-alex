import { sendToBackground } from "../../plasmohq/messaging";
import axios from "axios";
import { API_URL, EXTENSION_MESSAGE_TYPES } from "../config/constants";
import type {
  Account,
  Agency,
  CustomRequest,
  CustomRequestInput,
  GetUserPerformanceResponse,
  LeaderboardEntry,
  MessageWithFeedbackInput,
  OnlyFansMessageInput,
  Payment,
  PaymentResponse,
  User,
  UserActionInput
} from "../config/types";
import { sentry } from "../sentryHelper";

import type { MediaItem } from "./components/MediaGrid";
import { sendLogToDatadogAsync } from "./logger";
import { getTimezoneInfo } from "./utils";

// API functions

const apiFetch = async (url: string, options: any) => {
  try {
    const userEmail = 'of@aleannlab.com';
    await sendLogToDatadogAsync({ url, ...options }, { userId: userEmail });
  } catch (error) {
    console.error('Failed to send log to Datadog:', error);
  }
  const response = await axios({ url, ...options });
  return {
    json: async () => response.data,
    ok: response.status >= 200 && response.status < 300,
  };
};

export const _sendToBackground = async ({ name, payload }) => {
  const currentTab = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  // console.log("tab", currentTab[0].id)
  const data = await chrome.tabs.sendMessage(currentTab[0].id, payload);
  return {
    success: true,
    data
  };
};

export const api = {
  retrieveDataFromPage: async (): Promise<{
    accountId?: string;
    accountName: string;
  } | null> => {
    try {
      const { success, data } = await sendToBackground({
        name: "retrieve-data",
        body: {
          type: EXTENSION_MESSAGE_TYPES.READ_HTML
        }
      });
      if (success) {
        return data;
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.log({
        error
      });
      return null;
    }
  },
  retrieveProcessingStatus: async (): Promise<{
    accountId?: string;
    accountName: string;
  } | null> => {
    try {
      const { success, data } = await sendToBackground({
        name: "retrieve-data",
        body: {
          type: EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE
        }
      });
      if (success) {
        return data;
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.log({
        error
      });
      return null;
    }
  },
  retrieveCurrentVault: async () => {
    try {
      const { success, data } = await sendToBackground({
        name: "retrieve-current-vault"
      });
      if (success) {
        return data;
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.log({
        error
      });
      return null;
    }
  },
  getVaults: async (jwtToken: string, accountId: string) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/vault?accountId=${accountId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, data: data.vaults };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error retrieving vault items:", error);
      return { success: false, error: error.message };
    }
  },
  saveVaultItem: async (jwtToken, vaultItem) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(vaultItem)
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, vault: data.vault };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error saving vault item:", error);
      return { success: false, error: error.message };
    }
  },
  updateVaultItem: async (jwtToken, vaultId, vaultItem) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/vault/${vaultId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(vaultItem)
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, vault: data.vault };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating vault item:", error);
      return { success: false, error: error.message };
    }
  },
  deleteVaultItem: async (jwtToken, vaultId) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/vault/${vaultId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });
      if (response.ok) {
        return { success: true, message: "Vault item deleted successfully" };
      } else {
        const data = await response.json();
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error deleting vault item:", error);
      return { success: false, error: error.message };
    }
  },

  updateInfluencerSettings: async (
    jwtToken: string,
    influencerId: string,
    settings: any
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/model-settings/${influencerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(settings)
        }
      );
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: "Influencer settings updated successfully"
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating influencer settings:", error);
      return { success: false, error: error.message };
    }
  },

  syncPayments: async (
    jwtToken: string,
    data: {
      influencer_uuid: string;
      payments: Payment[];
      accountId: string;
      userUUID: string;
    }
  ) => {
    try {
      const { timezone, utcOffsetMinutes } = getTimezoneInfo();
      const response = await apiFetch(`${API_URL}/v1/api/sync-payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          ...data,
          timezone,
          utc_offset: utcOffsetMinutes
        })
      });
      const res = await response.json();
      if (response.ok) {
        return { success: true, message: "Payment history synchronized" };
      } else {
        return { success: false, error: res.message };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        // sentry.captureException(new Error(error));
        console.error("Error synchronizing payment history:", error);
      }
      return { success: false, error: error.message };
    }
  },

  getPaymentsByUser: async (
    jwtToken: string,
    userId: string,
    accountId: string
  ): Promise<PaymentResponse | { success: false; error: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/payments/${userId}?accountId=${accountId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, ...data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        // sentry.captureException(new Error(error));
        console.error("Error fetching payments by influencer:", error);
      }
      return { success: false, error: error.message };
    }
  },

  sendSms: async (jwtToken: string, to: string, body: string) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ to, body })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "SMS sent", sid: data.sid };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error sending SMS:", error);
      return { success: false, error: error.message };
    }
  },
  getAgency: async (jwtToken: string): Promise<Agency> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/agency`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        return data.data;
      } else {
        throw new Error("No data received from the server");
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error reading agency settings:", error);
      throw new Error(error);
    }
  },
  updateAgency: async (
    jwtToken: string,
    data: Agency
  ): Promise<{ success: boolean; data?: Agency; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/agency`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating agency settings:", error);
      return { success: false, error: error.message };
    }
  },
  getAccount: async (
    jwtToken: string,
    accountName: string
  ): Promise<Account> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/account/${accountName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return data.data;
      } else {
        throw new Error("401");
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error reading agency settings:", error);
      throw new Error(error);
    }
  },
  updateAccount: async (
    jwtToken: string,
    accountName: string,
    data: Account
  ): Promise<{ success: boolean; data?: Account; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/account/${accountName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(data)
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating agency settings:", error);
      return { success: false, error: error.message };
    }
  },

  getUser: async (
    jwtToken: string,
    userName: string,
    accountUuid: string
  ): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/user/${accountUuid}/${userName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching user data:", error);
      return { success: false, error: error.message };
    }
  },

  updateUser: async (
    jwtToken: string,
    userName: string,
    accountUuid: string,
    userData: Partial<User>
  ): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/user/${accountUuid}/${userName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(userData)
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error creating or updating user:", error);
      return { success: false, error: error.message };
    }
  },
  sendFeedback: async (
    jwtToken: string,
    messageUUID: string,
    feedback_text: string,
    feedback: number,
    trainingDataHistory: string,
    assistant?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/set-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          messageUUID,
          feedback_text,
          feedback,
          trainingDataHistory,
          ...(assistant && assistant.length > 0 && { assistant })
        })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Feedback updated" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error sending feedback:", error);
      return { success: false, error: error.message };
    }
  },

  savePostMedia: async (
    jwtToken: string,
    mediaData: any[]
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/media-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(mediaData)
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Media posted successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error saving media messages:", error);
      return { success: false, error: error.message };
    }
  },

  getPostMedia: async (jwtToken: string, userId: string, accountId: string) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/media-post?userId=${userId}&accountId=${accountId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          data: data.media_messages,
          influencerAudioMessages: data.influencer_audio_messages
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error getting media messages:", error);
      return { success: false, error: error.message };
    }
  },

  forceUpdateSettings: async (jwtToken: string) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/influencer/force_reload`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      if (response.ok) {
        return { success: true, message: "Settings updated successfully" };
      } else {
        return { success: false, message: "Settings update failed" };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error forcing update settings:", error);
      return { success: false, error: error.message };
    }
  },

  manageShift: async ({
    jwtToken,
    clock,
    startTime,
    endTime,
    ofUserId,
    shiftId
  }: {
    jwtToken: string;
    clock: "clock_in" | "clock_out";
    startTime?: string;
    endTime?: string;
    ofUserId?: string;
    shiftId?: string;
  }) => {
    console.log("manageShift", {
      jwtToken,
      clock,
      startTime,
      endTime,
      ofUserId
    });

    try {
      const response = await apiFetch(`${API_URL}/v1/api/shift/${clock}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
          of_user_id: ofUserId,
          shift_id: shiftId
        })
      });
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: data.message,
          shiftId: data?.data || null
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error(`Error during ${clock}:`, error);
      return { success: false, error: error.message };
    }
  },

  getMember: async (jwtToken: string) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/agency/member`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, data: data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching member data:", error);
      return { success: false, error: error.message };
    }
  },

  updateLastActivity: async (jwtToken: string) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/agency/members/activity`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating last activity:", error);
      return { success: false, error: error.message };
    }
  },

  closeActivityErrorModal: async (jwtToken: string) => {
    await apiFetch(`${API_URL}/v1/api/agency/member/close-error-modal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`
      }
    });
  },

  createCustomVault: async (jwtToken: string, vaultData: any) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/custom_vaults`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(vaultData)
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, custom_vault: data.vault_id };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching custom vault:", error);
      return { success: false, error: error.message };
    }
  },

  getCustomVault: async (
    jwtToken: string,
    agencyId: number,
    user_id: string
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault?agency_id=${agencyId}&user_id=${user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { status: "success", custom_vault: data.custom_vault };
      } else {
        return { status: "error", message: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching custom vault:", error);
      return { status: "error", message: error.message };
    }
  },

  getCustomVaultMedia: async (
    jwtToken: string,
    agencyId: number,
    userId: string,
    customVaultId: string | number,
    ofUser: string
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_media?agency_id=${agencyId}&user_id=${userId}&custom_vault_id=${customVaultId}&of_user=${ofUser}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, media: data.media };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching custom vault media:", error);
      return { success: false, error: error.message };
    }
  },

  addCustomVaultMedia: async (
    jwtToken: string,
    mediaData: FormData
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: string;
  }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/custom_vault_media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`
        },
        body: mediaData
      });
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: "Media added to custom vault",
          data: data.media_id
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error adding media to custom vault:", error);
      return { success: false, error: error.message };
    }
  },

  addCustomVaultFolder: async (
    jwtToken: string,
    folderData: FormData
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/custom_vault_folder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`
        },
        body: folderData
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Folder added to custom vault" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error adding folder to custom vault:", error);
      return { success: false, error: error.message };
    }
  },

  updateCustomVaultFolder: async (
    jwtToken: string,
    folderId: number,
    folderData: { name: string; description: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder/${folderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(folderData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: "Folder updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating folder:", error);
      return { success: false, error: error.message };
    }
  },

  getFoldersList: async (
    jwtToken: string,
    agencyId: string | number,
    userId: string,
    vaultId: string | number
  ): Promise<{ success: boolean; folders?: any[]; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folders?agency_id=${agencyId}&user_id=${userId}&vault_id=${vaultId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, folders: data.folders };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching folders list:", error);
      return { success: false, error: error.message };
    }
  },

  getCustomVaultFoldersWithMedia: async (
    jwtToken: string,
    agencyId: string | number,
    userId: string,
    vaultId: string | number,
    ofUserId: string | number
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folders_content?agency_id=${agencyId}&user_id=${userId}&vault_id=${vaultId}&of_user=${ofUserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, folders: data.folders };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching custom vault folders:", error);
      return { success: false, error: error.message };
    }
  },

  addMediaToFolder: async (
    jwtToken: string,
    folderId: string | number,
    mediaId: string[],
    vaultId: string | number
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder_media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            folder_id: folderId,
            media_id: mediaId,
            vault_id: vaultId
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error adding media to folder:", error);
      return { success: false, error: error.message };
    }
  },

  createCustomVaultSet: async (jwtToken: string, setData: any) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/custom_vault_set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(setData)
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, setId: data.set_id };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error creating custom vault set:", error);
      return { success: false, error: error.message };
    }
  },

  removeMediaFromFolder: async (
    jwtToken: string,
    folderId: string | number,
    mediaId: string,
    vaultId: string | number
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder_media`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            folder_id: folderId,
            media_id: mediaId,
            vault_id: vaultId
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Media removed from folder" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error removing media from folder:", error);
      return { success: false, error: error.message };
    }
  },

  addMediaToSet: async (
    jwtToken: string,
    setId: string | number,
    mediaId: string | number,
    vaultId: string | number
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_set_media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            set_id: setId,
            media_id: mediaId,
            vault_id: vaultId
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Media added to set" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error adding media to set:", error);
      return { success: false, error: error.message };
    }
  },

  deleteCustomVaultSet: async (
    jwtToken: string,
    setId: string | number
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_set/${setId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Custom vault set deleted" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error deleting custom vault set:", error);
      return { success: false, error: error.message };
    }
  },

  deleteCustomVaultFolder: async (jwtToken, folderId) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder/${folderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Folder deleted successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error deleting folder:", error);
      return { success: false, error: error.message };
    }
  },

  deleteCustomVaultMedia: async (jwtToken: string, mediaId: number) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_media/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Media deleted successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error deleting custom vault media:", error);
      return { success: false, error: error.message };
    }
  },

  getCustomVaultCollaborators: async (
    jwtToken: string,
    agencyId: string | number,
    vaultId: string | number
  ): Promise<{ success: boolean; collaborators?: any[]; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_collaborators?agency_id=${agencyId}&vault_id=${vaultId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, collaborators: data.collaborators };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching custom vault collaborators:", error);
      return { success: false, error: error.message };
    }
  },

  updateCustomVaultMedia: async (
    jwtToken: string,
    mediaId: number,
    mediaData: {
      agency_id: number;
      user_id: string;
      custom_vault_id: number;
      title?: string;
      description?: string;
      price?: string | number;
      type: string;
      tags?: string[];
      collaborators?: string[];
    }
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_media/${mediaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(mediaData)
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Media updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating custom vault media:", error);
      return { success: false, error: error.message };
    }
  },

  updateMediaOrder: async (jwtToken: string, mediaItems: MediaItem[]) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_media_order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            media_items: mediaItems.map((item) => ({
              id: item.id,
              order_index: item.order_index
            }))
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Order updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating media order:", error);
      return { success: false, error: error.message };
    }
  },

  updateFolderOrder: async (
    jwtToken: string,
    folderItems: { folder_id: string | number; folder_order_index: number }[]
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder_order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            folder_items: folderItems.map((item) => ({
              id: item.folder_id,
              order_index: item.folder_order_index
            }))
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Order updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating folder order:", error);
      return { success: false, error: error.message };
    }
  },

  updateFolderMediaOrder: async (
    jwtToken: string,
    mediaItems: MediaItem[],
    folderId: string | number
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_folder_media_order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            media_items: mediaItems.map((item) => ({
              folder_id: folderId,
              media_id: item.id,
              order_index: item.order_index
            }))
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Order updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating folder media order:", error);
      return { success: false, error: error.message };
    }
  },

  updateMediaSetOrder: async (
    jwtToken: string,
    setItems: { id: string | number; order_index: number }[]
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_vault_set_order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            set_items: setItems.map((item) => ({
              id: item.id,
              order_index: item.order_index
            }))
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Order updated successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error updating set order:", error);
      return { success: false, error: error.message };
    }
  },

  createCustomRequest: async (
    jwtToken: string,
    customRequestInput: CustomRequestInput
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/custom_request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(customRequestInput)
      });
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error creating custom request:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  fetchCustomRequestsByAccountUUID: async (
    UUID: string,
    jwtToken: string
  ): Promise<{ success: boolean; data?: CustomRequest[]; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_requests/account/${UUID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error fetching custom request:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  fetchCustomRequestsByUserUUID: async (
    UUID: string,
    jwtToken: string
  ): Promise<{ success: boolean; data?: CustomRequest[]; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_requests/user/${UUID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error fetching custom request:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  setCompletedStatusToCustomRequest: async (
    uuid: string,
    status: string,
    jwtToken: string
  ) => {
    try {
      const dataForUpdate = {
        uuid: uuid,
        completed_status: status
      };
      const response = await apiFetch(
        `${API_URL}/v1/api/custom_request/${uuid}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(dataForUpdate)
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, message: responseData.message };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error setting custom request status:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  storeOnlyFansMessages: async (
    jwtToken: string,
    data: OnlyFansMessageInput[]
  ) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(data)
      });
      const res = await response.json();
      if (response.ok) {
        return { success: true, message: "Message stored" };
      } else {
        return { success: false, error: res.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error storing message:", error);
      return { success: false, error: error.message };
    }
  },

  fetchOnlyFansMessagesByOfUserId: async (jwtToken: string, userId: string) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/messages/user/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error in fetching of messages:", error);
      return { success: false, error: error.message };
    }
  },

  storeUserAction: async (jwtToken: string, data: UserActionInput) => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/user_action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(data)
      });
      const res = await response.json();
      if (response.ok) {
        return { success: true, message: "User action stored" };
      } else {
        return { success: false, error: res.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error storing user action:", error);
      return { success: false, error: error.message };
    }
  },

  createOrUpdateMessagesWithFeedback: async (
    jwtToken: string,
    data: MessageWithFeedbackInput[]
  ) => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/messages-with-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify(data)
        }
      );
      const res = await response.json();
      if (response.ok) {
        return { success: true, message: "Message with feedback created" };
      } else {
        return { success: false, error: res.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error creating message with feedback:", error);
      return { success: false, error: error.message };
    }
  },

  createSentVaultMedia: async (
    jwtToken: string,
    userUUID: string,
    ofAccount: string,
    ofUser: string,
    vaultId: string | number,
    agencyId: string | number,
    mediaVaultId: string[] | number[],
    paymentId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/sent_vault_media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          user_id: userUUID,
          of_account: ofAccount,
          of_user: ofUser,
          vault_id: vaultId,
          agency_id: agencyId,
          media_vault_id: mediaVaultId,
          payment_id: paymentId
        })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: "Record created successfully" };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error creating sent vault media:", error);
      return { success: false, error: error.message };
    }
  },

  getUserAccount: async (jwtToken: string): Promise<any> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        }
      });
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error fetching user info:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  getUserPerformance: async (
    jwtToken: string
  ): Promise<GetUserPerformanceResponse> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/user-performance`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        }
      });
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, data: responseData.data };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(error);
      console.error("Error fetching user info:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  addSubscription: async (
    jwtToken: string,
    subscriptionData: {
      userName: string;
      userId: string;
      subPrice: string;
      subDuration: string;
      subDate: string;
      of_account: string;
    }
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiFetch(`${API_URL}/v1/api/add-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(subscriptionData)
      });
      const responseData = await response.json();
      if (response.ok) {
        return { success: true, message: "Subscription added successfully" };
      } else {
        return { success: false, error: responseData.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error adding subscription:", error);
      return { success: false, error: error.message };
    }
  },
  getSubscription: async (
    jwtToken: string,
    ofAccount: string,
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/subscription?of_account=${ofAccount}&userId=@${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        return { success: true, data: data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching subscription:", error);
      return { success: false, error: error.message };
    }
  },
  getDataForLeaderboard: async (
    jwtToken: string,
    userUuid: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    data?: {
      payments: Payment[];
      worked_hours: number;
      messages: OnlyFansMessageInput;
      messages_count: number;
      generated_messages: number;
      leaderboard: LeaderboardEntry[];
    };
    error?: string;
  }> => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/api/user_metrics?user_uuid=${userUuid}&start_date=${startDate}&end_date=${endDate}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: {
            payments: data.data.payments,
            worked_hours: data.data.worked_hours,
            messages: data.data.messages,
            messages_count: data.data.messages_count,
            generated_messages: data.data.generated_messages,
            leaderboard: data.data.leaderboard
          }
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      sentry.captureException(new Error(error));
      console.error("Error fetching leaderboard data:", error);
      return { success: false, error: error.message };
    }
  },
  getGlobalNotifications: async () => {
    const response = await axios.get(`${API_URL}/v1/api/maintenance`);
    return response.data;
  }
};
