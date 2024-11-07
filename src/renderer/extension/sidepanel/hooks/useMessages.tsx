import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  type Message,
  type OnlyFansMessage,
  type OnlyFansMessageInput
} from "../../config/types";
import { checkIsOnlyFanMessageThreadSelected } from "../../services/utils";
import { retrieveMessageHistory } from "../../services/utils";
import { api } from "../../sidepanel/api";

import { useGlobal } from "./useGlobal";

interface StoreOFMessagesProps {
  jwtToken: string;
  selectedModel: any;
  userId: string;
  accountId: string;
  messages: OnlyFansMessage[];
  userUUID: string;
}

export const useMessages = (): {
  getMessagesContent: () => Promise<Message | null>;
  content: Message | null;
  errorGettingMessagesContent: string | null;
  setErrorGettingMessagesContent: React.Dispatch<React.SetStateAction<string>>;
} => {
  const {
    logger,
    setUserId,
    setAccountId,
    setAccountName,
    selectedModel,
    jwtToken,
    setPayments,
    content,
    setContent,
    userUUID,
    setLastFanSpend,
    currentWebviewId,
  } = useGlobal();

  const [errorGettingMessagesContent, setErrorGettingMessagesContent] =
    useState<string | null>(null);

  const storeOnlyFansMessages = async ({
    jwtToken,
    selectedModel,
    userId,
    accountId,
    messages,
    userUUID
  }: StoreOFMessagesProps) => {
    try {
      const formattedMessages = messages.map((message) => {
        const messageType =
          message.content.startsWith("<") && message.content.endsWith(">")
            ? "media"
            : "text";
        // const formattedContent =
        //   messageType === "text"
        //     ? require("crypto")
        //         .createHash("sha256")
        //         .update(JSON.stringify(message.content))
        //         .digest("hex")
        //     : message.content;
        const formattedContent = message.content;
        return {
          external_id: message.id,
          user_id: userId,
          influencer_id: selectedModel.uuid,
          account_id: accountId,
          user_uuid: userUUID,
          role: message.role,
          content: formattedContent,
          type: messageType
        };
      });

      const response = await api.storeOnlyFansMessages(
        jwtToken,
        formattedMessages as OnlyFansMessageInput[]
      );

      return response;
    } catch (error) {
      throw new Error(error);
    }
  };

  const mutation = useMutation<
    { success: boolean; message: string } | { success: boolean; error: any },
    Error,
    StoreOFMessagesProps
  >({
    mutationFn: storeOnlyFansMessages
  });

  const getMessagesContent = async (): Promise<Message | null> => {
    try {
      console.log("currentWebviewId", currentWebviewId)
      const isOnlyFanMessageThreadSelected =
        await checkIsOnlyFanMessageThreadSelected(currentWebviewId);
      let description = "";

      if (!isOnlyFanMessageThreadSelected) {
        description = "The OnlyFans message thread is not selected";
      }
      if (description) {
        return
        // throw new Error(description);
      }
      const retrievedContent = (await retrieveMessageHistory(currentWebviewId)) as Message;
      console.log("retrievedContent", retrievedContent)
      setContent(retrievedContent);

      const tipRegex = /<[^>]+_tip>/;
      const purchasedRegex = /<purchased_[^>]+>/;

      let maxTipIndex = -1;
      let maxPurchasedIndex = -1;
      let messagesAgoTip = -1;
      let messagesAgoPurchased = -1;

      if (retrievedContent?.messages) {
        retrievedContent.messages.forEach((message, index) => {
          if (tipRegex.test(message.content)) {
            maxTipIndex = index;
          }
          if (purchasedRegex.test(message.content)) {
            maxPurchasedIndex = index;
          }
        });

        if (maxTipIndex !== -1) {
          messagesAgoTip = retrievedContent.messages.length - 1 - maxTipIndex;
        }
        if (maxPurchasedIndex !== -1) {
          messagesAgoPurchased =
            retrievedContent.messages.length - 1 - maxPurchasedIndex;
        }

        const lastSpendAgo = Math.min(
          messagesAgoTip !== -1 ? messagesAgoTip : Infinity,
          messagesAgoPurchased !== -1 ? messagesAgoPurchased : Infinity
        );
        setLastFanSpend(lastSpendAgo);
      } else {
        setLastFanSpend(Infinity);
      }

      if (retrievedContent && retrievedContent.user_id) {
        setUserId(retrievedContent.user_id);
        setAccountId(retrievedContent.accountId);
        setAccountName(retrievedContent.accountName);

        if (
          jwtToken &&
          selectedModel &&
          retrievedContent.user_id &&
          retrievedContent.accountId &&
          retrievedContent
        ) {
          // fetchAndSyncPayments(
          //   jwtToken,
          //   selectedModel,
          //   retrievedContent.user_id,
          //   retrievedContent.accountId,
          //   retrievedContent,
          //   userUUID
          // ).then((response) => {
          //   if (response.success !== false) {
          //     return setPayments(response);
          //   } else {
          //     console.log("Payment sync failed: " + response.error);
          //   }
          // });
          if (retrievedContent.messages.length > 0 && !mutation.isPending) {
            mutation.mutate({
              jwtToken,
              selectedModel,
              userId: retrievedContent.user_id,
              accountId: retrievedContent.accountId,
              messages: retrievedContent.messages,
              userUUID
            });
          }
        }
      }

      return retrievedContent;
    } catch (error) {
      logger.debug("useMessages getMessagesContent Error: " + error.toString());
      setErrorGettingMessagesContent(error);
      console.error("Error retrieving content:", error);
      throw error;
    }
  };

  return {
    getMessagesContent,
    content,
    errorGettingMessagesContent,
    setErrorGettingMessagesContent
  };
};
