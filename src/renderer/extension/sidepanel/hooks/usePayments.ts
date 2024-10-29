import { useToast } from "@chakra-ui/react";
import { useRef } from "react";
import { useCallback } from "react";
import { type Account, type Agency, type PaymentResponse } from "../../config/types";
import { sentry } from "../../sentryHelper";
import { api } from "../../sidepanel/api";

import { useGlobal } from "./useGlobal";
import { useMessages } from "./useMessages";

type LinkPaymentProps = {
  account: Account;
  customVaultId: string | number;
  agency: Agency;
  selectedMedia: number[];
};

export interface PaymentProps {
  paymentsData: PaymentResponse;
  userId?: string;
  syncPayments: () => Promise<PaymentResponse>;
  // totalTipAmount: number;
  // totalPurchaseAmount: number;
}

export const fetchAndSyncPayments = async (
  jwtToken: string,
  selectedModel: any,
  userId: string,
  accountId: string,
  messages: any,
  userUUID: string
) => {
  try {
    await api.syncPayments(jwtToken, {
      influencer_uuid: selectedModel.uuid,
      payments: messages.payments,
      accountId: messages.accountId,
      userUUID: userUUID
    });

    const response = await api.getPaymentsByUser(jwtToken, userId, accountId);
    return response;
  } catch (error) {
    throw new Error(error);
  }
};

export const usePayments = (): {
  paymentsData: PaymentResponse;
  linkPaymentToVault: (vaultData: LinkPaymentProps) => Promise<void>;
  syncPayments: () => Promise<
    PaymentResponse | { success: false; error: string }
  >;
} => {
  const {
    userId,
    logger,
    selectedModel,
    jwtToken,
    accountId,
    payments,
    setPayments,
    userUUID
  } = useGlobal();
  const { getMessagesContent } = useMessages();
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleError = useCallback(
    (error: string, title: string, description: string = "") => {
      console.error(error);
      sentry.captureException(new Error(error));
      toast({
        title,
        description,
        status: "error",
        duration: 1000,
        isClosable: true
      });
    },
    [toast]
  );

  const linkPaymentToVault = async ({
    account,
    customVaultId,
    agency,
    selectedMedia
  }) => {
    const messages = await getMessagesContent();
    const response = await fetchAndSyncPayments(
      jwtToken,
      selectedModel,
      userId,
      accountId,
      messages,
      userUUID
    );
    if (response.success) {
      response.payments.sort((a, b) => Number(a.id) - Number(b.id));
      const paymentId = response?.payments?.reverse()?.[0]?.id;
      if (paymentId)
        await api.createSentVaultMedia(
          jwtToken,
          userUUID,
          account.name,
          userId,
          customVaultId,
          agency.uuid,
          selectedMedia,
          paymentId
        );
    }
  };

  const syncPayments = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const messages = await getMessagesContent();
      const response = await fetchAndSyncPayments(
        jwtToken,
        selectedModel,
        userId,
        accountId,
        messages,
        userUUID
      );

      if (response.success) {
        if (!messages.user_id) {
          const errorMsg =
            "User_id is not defined, please refresh only fans page";
          logger.debug(errorMsg);
          logger.debug(messages);
          sentry.captureException(new Error(errorMsg));
          throw new Error(errorMsg);
        }
        // toast({
        //   title: "Payment history synchronized successfully",
        //   status: "success",
        //   duration: 3000,
        //   isClosable: true
        // });

        setPayments(response);
        return response;
      } else {
        handleError(
          response.error,
          "Error synchronizing payment history",
          response.error
        );
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        sentry.captureException(new Error(e));
        handleError(e.toString(), "Sync Failed");
        window.location.reload();
      }
    }
  };

  return {
    syncPayments,
    paymentsData: payments,
    linkPaymentToVault
  };
};
