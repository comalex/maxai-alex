import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, HStack, Spinner, Text } from "@chakra-ui/react";
import { useStorage } from "../../../plasmohq/messaging";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useState } from "react";
import { Status, STORAGE_KEYS } from "../../config/constants";
import { type Payment, PaymentType } from "../../config/types";
import { CustomRequestsIcon, PurchaseIcon, TipsIcon } from "../../icons";
import { api } from "../../sidepanel/api";
import SpinnerComponent from "../../sidepanel/components/Spinner";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";
import { useMessages } from "../../sidepanel/hooks/useMessages";
import { fetchAndSyncPayments } from "../../sidepanel/hooks/usePayments";
import useWindowSize from "../../sidepanel/hooks/useWindowSize";

import { PaymentSyncButton } from "./PaymentSyncButton";
import PaymentStats from "./PaymentsStats";
import PaymentsTags from "./PaymentsTags";

const roundToTwoDecimalPlaces = (num: number | string): string => {
  const number = typeof num === "string" ? parseFloat(num) : num;
  return isNaN(Number(number?.toFixed(2))) ? "0" : number?.toFixed(0);
};

const calculateTotalAmount = (
  userId: string,
  payments: Payment[],
  paymentType: PaymentType
): number => {
  return (
    payments
      ?.filter(
        (p) =>
          p.paidStatus === Status.paid &&
          p.type === paymentType &&
          p.user_id === userId
      )
      .reduce((acc, payment) => acc + (Number(payment.price) || 0), 0) || 0
  );
};

const calculateTotalCount = (
  userId: string,
  payments: Payment[],
  paymentType: PaymentType
): { totalCount: number; averageAmount: string } => {
  const filteredPayments =
    payments?.filter(
      (p) =>
        p.paidStatus === Status.paid &&
        p.type === paymentType &&
        p.user_id === userId
    ) || [];

  const totalCount = filteredPayments.length;
  const totalAmount = filteredPayments.reduce(
    (acc, payment) => acc + (Number(payment.price) || 0),
    0
  );
  const averageAmount =
    totalCount && totalCount > 0 && !isNaN(totalAmount / totalCount)
      ? (totalAmount / totalCount)?.toFixed(2)
      : "0.00";

  return { totalCount, averageAmount };
};

const calculateDaysAgo = (
  userId: string,
  payments: Payment[],
  paymentType: PaymentType
) => {
  const filteredPayments = payments.filter(
    (payment) =>
      payment.type === paymentType &&
      payment.paidStatus === Status.paid &&
      payment.user_id === userId
  );
  if (filteredPayments.length === 0)
    return {
      days: 0,
      price: 0
    };

  const lastPayment = filteredPayments.reduce((latest, current) => {
    const latestDate = new Date(latest.time);
    const currentDate = new Date(current.time);
    return latestDate > currentDate ? latest : current;
  });

  const lastPaymentDateUTC = new Date(lastPayment.time);
  const lastPaymentDateLocal = new Date(
    lastPaymentDateUTC.getUTCFullYear(),
    lastPaymentDateUTC.getUTCMonth(),
    lastPaymentDateUTC.getUTCDate(),
    lastPaymentDateUTC.getUTCHours(),
    lastPaymentDateUTC.getUTCMinutes(),
    lastPaymentDateUTC.getUTCSeconds()
  );

  const today = new Date();
  const differenceInTime = today.getTime() - lastPaymentDateLocal.getTime();
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

  return {
    days: differenceInDays || 0,
    price: Number(lastPayment?.price || 0)
  };
};

const PaymentSummary = ({
  loadPaymentsData,
  setLoadPaymentsData
}: {
  loadPaymentsData: boolean;
  setLoadPaymentsData: (loadPaymentsData: boolean) => void;
}) => {
  const {
    selectedModel,
    userId,
    accountName,
    logger,
    jwtToken,
    accountId,
    userUUID,
    agency,
    account,
    currentWebviewId,
  } = useGlobal();
  const { getMessagesContent } = useMessages();
  const [paymentsData, setPaymentsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalTipAmount, setTotalTipAmount] = useState<number | null>(null);
  const [updatingPaymentsData, setUpdatingPaymentsData] = useState(false);
  const [showAllStats, setShowAllStats] = useState<boolean>(false);
  const { width: extensionWidth } = useWindowSize();

  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState<number | null>(
    null
  );

  const [totalTipCount, setTotalTipCount] = useState<{
    totalCount: number;
    averageAmount: string;
  }>({ totalCount: 0, averageAmount: "0.00" });
  const [totalPurchaseCount, setTotalPurchaseCount] = useState<{
    totalCount: number;
    averageAmount: string;
  }>({ totalCount: 0, averageAmount: "0.00" });
  const [lastTipDaysAgo, setLastTipDaysAgo] = useState({
    days: 0,
    price: 0
  });
  const [lastPurchaseDaysAgo, setLastPurchaseDaysAgo] = useState({
    days: 0,
    price: 0
  });
  const [subs, setSubs] = useState<any>(null);
  const syncPayments = useCallback(
    async (updatePaymentsData: boolean = false) => {
      if (updatePaymentsData) {
        setUpdatingPaymentsData(true);
      } else {
        setIsLoading(true);
      }
      try {
        const messages = await getMessagesContent();
        const subs = await api.getSubscription(jwtToken, accountId, userId);
        setSubs(subs);
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
            throw new Error(errorMsg);
          }
          setPayments(response?.payments || []);

          return response;
        } else {
          setPaymentsData(null);
        }
      } catch (e) {
        console.log("error", e);
        if (e.name !== "AbortError") {
          window.location.reload();
        }
      } finally {
        setUpdatingPaymentsData(false);
      }
    },
    [jwtToken, selectedModel, userId, accountId, userUUID]
  );

  const {
    data: numberOfCustomRequests,
    error: numberOfCustomRequestsError,
    isLoading: isCustomRequestsLoading
  } = useQuery<
    { customRequestsByAccount: number; customRequestsByOtherAccounts: number },
    Error
  >({
    queryKey: ["customRequestsByUser"],
    queryFn: async () => {
      if (!jwtToken) {
        throw new Error("No JWT token found");
      }
      const response = await api.fetchCustomRequestsByUserUUID(
        userUUID,
        jwtToken
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch custom requests");
      }

      if (!response.data.length) {
        return { customRequestsByAccount: 0, customRequestsByOtherAccounts: 0 };
      }

      const numberOfCustomRequestByAccount = response.data.filter(
        (request) =>
          request.account_id === account.uuid && request.user_name === userId
      );
      const numberOfCustomRequestByOtherAccounts = response.data.filter(
        (request) =>
          request.account_id !== account.uuid && request.user_name === userId
      );

      return {
        customRequestsByAccount: numberOfCustomRequestByAccount.length,
        customRequestsByOtherAccounts:
          numberOfCustomRequestByOtherAccounts.length
      };
    }
  });

  useEffect(() => {
    let running = true;
    if (userId) {
      syncPayments()
        .then((response) => {
          if (running) {
            console.log("Payments updated", response);
            setPaymentsData(response);
          }
        })
        .catch((e) => {
          console.log("error", e);
          setPaymentsData(null);
          setPayments([]);
          running = false;
        })
        .finally(() => {
          setIsLoading(false);
          setUpdatingPaymentsData(false);
          setLoadPaymentsData(false);
          running = false;
        });
    }
    return () => {
      running = false;
    };
  }, [userId]);

  useEffect(() => {
    let running = true;
    if (loadPaymentsData) {
      syncPayments(true)
        .then((response) => {
          if (running) {
            console.log("Payments updated", response);
            setPaymentsData(response);
          }
        })
        .catch((e) => {
          console.log("error", e);
          setPaymentsData(null);
          setPayments([]);
          running = false;
        })
        .finally(() => {
          setIsLoading(false);
          setUpdatingPaymentsData(false);
          setLoadPaymentsData(false);
          running = false;
        });
    }
    return () => {
      running = false;
    };
  }, [loadPaymentsData, isLoading]);

  useEffect(() => {
    if (payments?.length) {
      const currentUserPayments = payments.filter(
        (payment) => payment.user_id === userId
      );
      if (userId) {
        const totalTip = calculateTotalAmount(
          userId,
          currentUserPayments,
          PaymentType.TIP
        );
        setTotalTipCount(
          calculateTotalCount(userId, currentUserPayments, PaymentType.TIP)
        );
        setTotalTipAmount(totalTip);

        const totalPurchases = calculateTotalAmount(
          userId,
          currentUserPayments,
          PaymentType.PURCHASE
        );
        setTotalPurchaseCount(
          calculateTotalCount(userId, currentUserPayments, PaymentType.PURCHASE)
        );
        setTotalPurchaseAmount(totalPurchases);
        const lastTipDaysAgo = calculateDaysAgo(
          userId,
          currentUserPayments,
          PaymentType.TIP
        );
        const lastPurchaseDaysAgo = calculateDaysAgo(
          userId,
          currentUserPayments,
          PaymentType.PURCHASE
        );
        setLastTipDaysAgo(lastTipDaysAgo);
        setLastPurchaseDaysAgo(lastPurchaseDaysAgo);
      }
    }
  }, [payments.length, userId, JSON.stringify(payments)]);

  useEffect(() => {
    if (userId === null) {
      setTotalTipAmount(null);
      setTotalPurchaseAmount(null);
      return;
    }
  }, [payments, userId]);

  const [messageThreshold] = useStorage<number | undefined>(currentWebviewId,
    STORAGE_KEYS.MESSAGE_THRESHOLD
  );

  const messages: any[] = [];
  const hasNoRecentActivity = () => {
    if (
      messageThreshold === undefined ||
      messages == null ||
      messages.length === 0
    )
      return false;
    const recentMessages = messages.slice(-messageThreshold);
    const recentPayments = payments.filter((payment) => true);
    return recentPayments.length === 1;
  };

  const creatorPurchasesCumulative =
    account?.settings?.creator_purchases_cumulative ||
    agency?.settings?.creator_purchases_cumulative ||
    20;
  const creatorTipsCumulative =
    account?.settings?.creator_tips_cumulative ||
    agency?.settings?.creator_tips_cumulative ||
    5;
  const creatorPurchasesDaysAgo =
    account?.settings?.creator_purchases_last ||
    agency?.settings?.creator_purchases_last ||
    5;
  const creatorTipsDaysAgo =
    account?.settings?.creator_tips_last ||
    agency?.settings?.creator_tips_last ||
    5;

  return (
    <>
      <Box display="flex" flexDirection="column" gap={4}>
        {/* <HStack>
          <Box
            borderRadius="4px"
            backgroundColor={
              subs?.data?.data?.subDuration ? "#00BB83" : "#FDD9D9"
            }
            px="9px"
            py={1}
          >
            <Text
              fontSize="12px"
              fontWeight={600}
              color={subs?.data?.data?.subDuration ? "white" : "#F45252"}
            >
              SUBSCRIPTION: {subs?.data?.data?.subDuration || "OFF"}
            </Text>
            <Text>
              Subscription date:{" "}
              {subs?.data?.data?.subDate
                ? new Date(subs.data.data.subDate).toDateString()
                : "No subscription"}
            </Text>
          </Box>
        </HStack> */}
        <Box display="flex" gap={1} alignItems="center">
          <PaymentsTags payments={payments} paymentsData={paymentsData} />
        </Box>
        {!showAllStats && (
          <Box width="100%" display="flex" gap={2} alignContent="center">
            <Box width="100%" display="flex" flexDirection="column" gap={2}>
              <Text fontSize="11px" fontWeight={700} color="#606060">
                Spending on {accountName || "You"}
              </Text>
              <Box display="flex" gap={2} alignItems="center">
                <Box
                  width="50%"
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  p={3}
                  backgroundColor="#EFEEEF"
                  borderRadius="10px"
                >
                  <Box height="100%" display="flex" alignItems="center" gap={1}>
                    <PurchaseIcon width="22px" height="22px" color="#606060" />
                    <Text
                      fontSize="11px"
                      fontStyle="normal"
                      fontWeight="500"
                      color="#0E0E0E"
                    >
                      Purchases
                    </Text>
                  </Box>
                  <Box display="flex" gap={12}>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Total
                      </Text>
                      <Text
                        fontSize="16px"
                        fontStyle="normal"
                        fontWeight="700"
                        color={
                          Number(roundToTwoDecimalPlaces(totalPurchaseAmount)) >
                          0
                            ? "#00BB83"
                            : "#F45252"
                        }
                      >
                        ${roundToTwoDecimalPlaces(totalPurchaseAmount)}
                      </Text>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Average
                      </Text>
                      <Text
                        fontSize="16px"
                        fontStyle="normal"
                        fontWeight="700"
                        color="black"
                      >
                        $
                        {roundToTwoDecimalPlaces(
                          totalPurchaseCount?.averageAmount
                        )}
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box
                  width="50%"
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  p={3}
                  backgroundColor="#EFEEEF"
                  borderRadius="10px"
                >
                  <Box height="100%" display="flex" alignItems="center" gap={1}>
                    <TipsIcon width="22px" height="22px" color="#606060" />
                    <Text
                      fontSize="11px"
                      fontStyle="normal"
                      fontWeight="500"
                      color="#0E0E0E"
                    >
                      Tips
                    </Text>
                  </Box>
                  <Box display="flex" gap={12}>
                    <Box display="flex" flexDirection={"column"} gap={2}>
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Total
                      </Text>
                      <Text
                        fontSize="16px"
                        fontStyle="normal"
                        fontWeight="700"
                        color={
                          Number(roundToTwoDecimalPlaces(totalTipAmount)) > 0
                            ? "#00BB83"
                            : "#F45252"
                        }
                      >
                        ${roundToTwoDecimalPlaces(totalTipAmount)}
                      </Text>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Average
                      </Text>
                      <Text
                        fontSize="16px"
                        fontStyle="normal"
                        fontWeight="700"
                        color="black"
                      >
                        ${roundToTwoDecimalPlaces(totalTipCount?.averageAmount)}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            {extensionWidth > 655 && (
              <Box width="100%" display="flex" flexDirection="column" gap={2}>
                <Text fontSize="11px" fontWeight={700} color="#606060">
                  Spending on other OF accounts
                </Text>
                <Box display="flex" gap={2} alignItems="center">
                  <Box
                    width="50%"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    p={3}
                    backgroundColor="#EFEEEF"
                    borderRadius="10px"
                  >
                    <Box
                      height="100%"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <TipsIcon width="22px" height="22px" color="#606060" />
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Purchases
                      </Text>
                    </Box>
                    <Box display="flex" gap={12}>
                      <Box display="flex" flexDirection={"column"} gap={2}>
                        <Text
                          fontSize="11px"
                          fontStyle="normal"
                          fontWeight="500"
                          color="#0E0E0E"
                        >
                          Total
                        </Text>
                        <Text
                          fontSize="16px"
                          fontStyle="normal"
                          fontWeight="700"
                          color={
                            Number(
                              roundToTwoDecimalPlaces(
                                paymentsData?.totalUserPayments || 0
                              )
                            ) > 0
                              ? "#00BB83"
                              : "#F45252"
                          }
                        >
                          $
                          {roundToTwoDecimalPlaces(
                            paymentsData?.totalUserPayments || 0
                          )}
                        </Text>
                      </Box>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Text
                          fontSize="11px"
                          fontStyle="normal"
                          fontWeight="500"
                          color="#0E0E0E"
                        >
                          Average
                        </Text>
                        <Text
                          fontSize="16px"
                          fontStyle="normal"
                          fontWeight="700"
                          color="black"
                        >
                          $
                          {roundToTwoDecimalPlaces(
                            paymentsData?.avgTotalUserPayments || 0
                          )}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    width="50%"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    p={3}
                    backgroundColor="#EFEEEF"
                    borderRadius="10px"
                  >
                    <Box
                      height="100%"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <TipsIcon width="22px" height="22px" color="#606060" />
                      <Text
                        fontSize="11px"
                        fontStyle="normal"
                        fontWeight="500"
                        color="#0E0E0E"
                      >
                        Tips
                      </Text>
                    </Box>
                    <Box display="flex" gap={12}>
                      <Box display="flex" flexDirection={"column"} gap={2}>
                        <Text
                          fontSize="11px"
                          fontStyle="normal"
                          fontWeight="500"
                          color="#0E0E0E"
                        >
                          Total
                        </Text>
                        <Text
                          fontSize="16px"
                          fontStyle="normal"
                          fontWeight="700"
                          color={
                            Number(
                              roundToTwoDecimalPlaces(
                                paymentsData?.totalUserTips || 0
                              )
                            ) > 0
                              ? "#00BB83"
                              : "#F45252"
                          }
                        >
                          $
                          {roundToTwoDecimalPlaces(
                            paymentsData?.totalUserTips || 0
                          )}
                        </Text>
                      </Box>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Text
                          fontSize="11px"
                          fontStyle="normal"
                          fontWeight="500"
                          color="#0E0E0E"
                        >
                          Average
                        </Text>
                        <Text
                          fontSize="16px"
                          fontStyle="normal"
                          fontWeight="700"
                          color="black"
                        >
                          $
                          {roundToTwoDecimalPlaces(
                            paymentsData?.avgTotalUserTips || 0
                          )}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
        {showAllStats && (
          <Box display="flex" flexDirection="column" gap={4}>
            <Box
              display="flex"
              flexDirection={extensionWidth > 600 ? "row" : "column"}
              gap={2.5}
              width="100%"
            >
              <PaymentStats
                title={
                  <Text
                    fontSize="11px"
                    fontStyle="normal"
                    fontWeight="500"
                    textColor="#606060"
                  >
                    <b>Purchases</b> on {accountName || "You"}
                  </Text>
                }
                stats={[
                  `$${roundToTwoDecimalPlaces(totalPurchaseAmount)}`,
                  `${totalPurchaseCount?.totalCount}`,
                  `$${roundToTwoDecimalPlaces(totalPurchaseCount?.averageAmount)}`,
                  `$${roundToTwoDecimalPlaces(lastPurchaseDaysAgo.price)}`,
                  `${lastPurchaseDaysAgo.days}`
                ]}
              />
              <PaymentStats
                title={
                  <Text
                    fontSize="11px"
                    fontStyle="normal"
                    fontWeight="500"
                    textColor="#606060"
                  >
                    <b>Tips</b> on {accountName || "You"}
                  </Text>
                }
                stats={[
                  `$${roundToTwoDecimalPlaces(totalTipAmount)}`,
                  `${totalTipCount?.totalCount}`,
                  `$${roundToTwoDecimalPlaces(totalTipCount?.averageAmount)}`,
                  `$${roundToTwoDecimalPlaces(lastTipDaysAgo.price)}`,
                  `${lastTipDaysAgo.days}`
                ]}
              />
            </Box>
            {isCustomRequestsLoading && <Spinner size="xs" />}
            {!isCustomRequestsLoading && numberOfCustomRequests && (
              <Box display="flex" gap={1} alignItems="center" color="#606060">
                <CustomRequestsIcon width="18px" height="18px" />
                <Text fontSize="11px" fontWeight={700}>
                  # of customs purchased on {accountName || "You"}:{" "}
                  {numberOfCustomRequests.customRequestsByAccount}
                </Text>
              </Box>
            )}
            <Box
              display="flex"
              flexDirection={extensionWidth > 600 ? "row" : "column"}
              gap={2.5}
              width="100%"
            >
              <PaymentStats
                title={
                  <Text
                    fontSize="11px"
                    fontStyle="normal"
                    fontWeight="500"
                    textColor="#606060"
                  >
                    <b>Purchases</b> on other OF accounts
                  </Text>
                }
                stats={[
                  `$${roundToTwoDecimalPlaces(paymentsData?.totalUserPayments || 0)}`,
                  `${paymentsData?.countTotalUserPayments}`,
                  `$${roundToTwoDecimalPlaces(paymentsData?.avgTotalUserPayments || 0)}`,
                  `$${roundToTwoDecimalPlaces(paymentsData?.totalUserPaymentDaysAgo?.paid || 0)}`,
                  `${paymentsData?.totalUserPaymentDaysAgo?.days_ago ?? 0}`
                ]}
              />
              <PaymentStats
                title={
                  <Text
                    fontSize="11px"
                    fontStyle="normal"
                    fontWeight="500"
                    textColor="#606060"
                  >
                    <b>Tips</b> on other OF accounts
                  </Text>
                }
                stats={[
                  `$${roundToTwoDecimalPlaces(paymentsData?.totalUserTips || 0)}`,
                  `${paymentsData?.countTotalUserTips}`,
                  `$${roundToTwoDecimalPlaces(paymentsData?.avgTotalUserTips || 0)}`,
                  `$${roundToTwoDecimalPlaces(paymentsData?.totalUserTipDaysAgo?.paid || 0)}`,
                  `${paymentsData?.totalUserTipDaysAgo?.days_ago ?? 0}`
                ]}
              />
            </Box>
            {isCustomRequestsLoading && <Spinner size="xs" />}
            {!isCustomRequestsLoading && numberOfCustomRequests && (
              <Box display="flex" gap={1} alignItems="center" color="#606060">
                <CustomRequestsIcon width="18px" height="18px" />
                <Text fontSize="11px" fontWeight={700}>
                  # of customs purchased on other OF accounts:{" "}
                  {numberOfCustomRequests.customRequestsByOtherAccounts}
                </Text>
              </Box>
            )}
          </Box>
        )}
        <Box
          width="100%"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <PaymentSyncButton syncPayments={() => syncPayments(true)} />
          {updatingPaymentsData && <Text color="green">...updating data</Text>}
          <Box
            display="flex"
            gap={1}
            alignItems="center"
            cursor="pointer"
            onClick={() => setShowAllStats(!showAllStats)}
          >
            <Text
              fontSize="11px"
              fontStyle="normal"
              fontWeight="500"
              textColor="#606060"
            >
              See All Stats
            </Text>
            {showAllStats ? (
              <ChevronUpIcon width="20px" height="20px" />
            ) : (
              <ChevronDownIcon width="20px" height="20px" />
            )}
          </Box>
        </Box>
      </Box>
      {/* <div>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>
              <PaymentSyncButton syncPayments={() => syncPayments(true)} />
            </Th>
            <Th
              textTransform="lowercase"
              color={updatingPaymentsData ? "green" : "black"}
            >
              {updatingPaymentsData ? "...updating data" : ""}
            </Th>
            <Th>Purchases</Th>
            <Th>Tips</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td sx={{ fontSize: 14 }}>
              <strong>{accountName || "You"}</strong>
            </Td>
            <Td sx={{ fontSize: 14 }}>Cumulative $/#, Avg $</Td>
            <Td>
              <Box display="flex" flexDirection="column">
                <Box
                  as="span"
                  backgroundColor={
                    totalPurchaseAmount === 0
                      ? "orange"
                      : totalPurchaseAmount >= creatorPurchasesCumulative
                        ? "green.200"
                        : "yellow"
                  }
                  color={
                    totalPurchaseAmount === 0
                      ? "black"
                      : totalPurchaseAmount >= creatorPurchasesCumulative
                        ? "white"
                        : "black"
                  }
                  padding="1px 2px"
                  borderRadius="2px"
                  fontSize="md"
                >
                  ${roundToTwoDecimalPlaces(totalPurchaseAmount)}
                  {totalPurchaseCount?.totalCount > 0 &&
                    ` (${totalPurchaseCount?.totalCount}), Avg$${roundToTwoDecimalPlaces(totalPurchaseCount?.averageAmount)}`}
                </Box>
              </Box>
            </Td>
            <Td>
              <Box display="flex" flexDirection="column">
                <Box
                  as="span"
                  backgroundColor={
                    totalTipAmount === 0
                      ? "orange"
                      : totalTipAmount >= creatorTipsCumulative
                        ? "green.200"
                        : "yellow"
                  }
                  color={
                    totalTipAmount === 0
                      ? "black"
                      : totalTipAmount >= creatorTipsCumulative
                        ? "white"
                        : "black"
                  }
                  padding="1px 2px"
                  borderRadius="2px"
                  fontSize="md"
                >
                  ${roundToTwoDecimalPlaces(totalTipAmount)}
                  {totalTipCount?.totalCount > 0 &&
                    ` (${totalTipCount?.totalCount}), Avg$${roundToTwoDecimalPlaces(totalTipCount?.averageAmount)}`}
                </Box>
              </Box>
            </Td>
          </Tr>
          <Tr />
          <Tr>
            <Td />
            <Td sx={{ fontSize: 14 }}>Last $/(# of days)</Td>
            <Td>
              <Box display="flex" flexDirection="column">
                <Box
                  as="span"
                  backgroundColor={
                    lastPurchaseDaysAgo.days === 0
                      ? "orange"
                      : lastPurchaseDaysAgo.days >= creatorPurchasesDaysAgo
                        ? "green.200"
                        : "yellow"
                  }
                  color={
                    lastPurchaseDaysAgo.days === 0
                      ? "black"
                      : lastPurchaseDaysAgo.days >= creatorPurchasesDaysAgo
                        ? "white"
                        : "black"
                  }
                  padding="1px 2px"
                  borderRadius="2px"
                  fontSize="md"
                >
                  {lastPurchaseDaysAgo.price !== 0 ? (
                    <div>
                      <p>{`$${roundToTwoDecimalPlaces(lastPurchaseDaysAgo.price)}`}</p>
                      <p>{`(${lastPurchaseDaysAgo.days <= 0 ? "today" : `${lastPurchaseDaysAgo.days} days ago`})`}</p>
                    </div>
                  ) : (
                    "$0.00"
                  )}
                </Box>
              </Box>
            </Td>
            <Td>
              <Box display="flex" flexDirection="column">
                <Box
                  as="span"
                  backgroundColor={
                    lastTipDaysAgo.days === 0
                      ? "orange"
                      : lastTipDaysAgo.days >= creatorTipsDaysAgo
                        ? "green.200"
                        : "yellow"
                  }
                  color={
                    lastTipDaysAgo.days === 0
                      ? "black"
                      : lastTipDaysAgo.days >= creatorTipsDaysAgo
                        ? "white"
                        : "black"
                  }
                  padding="1px 2px"
                  borderRadius="2px"
                  fontSize="md"
                >
                  {lastTipDaysAgo.price !== 0 ? (
                    <div>
                      <p>{`$${roundToTwoDecimalPlaces(lastTipDaysAgo.price)}`}</p>
                      <p>{`(${lastTipDaysAgo.days <= 0 ? "today" : `${lastTipDaysAgo.days} days ago`})`}</p>
                    </div>
                  ) : (
                    "$0.00"
                  )}
                </Box>
              </Box>
            </Td>
          </Tr>
          <Tr>
            <Td sx={{ fontSize: 14 }}>
              <strong>Other Creators</strong>
            </Td>
            <Td sx={{ fontSize: 14 }}>Cumulative $/#, Avg $</Td>
            <Td>
              <Text as="span" fontSize="md">
                ${roundToTwoDecimalPlaces(paymentsData?.totalUserPayments || 0)}{" "}
                {paymentsData?.countTotalUserPayments > 0 &&
                  `(${paymentsData?.countTotalUserPayments}), Avg$${roundToTwoDecimalPlaces(paymentsData?.avgTotalUserPayments || 0)}`}
              </Text>
            </Td>
            <Td>
              <Text as="span" fontSize="md">
                ${roundToTwoDecimalPlaces(paymentsData?.totalUserTips || 0)}{" "}
                {paymentsData?.countTotalUserTips > 0 &&
                  `(${paymentsData?.countTotalUserTips}), Avg$${roundToTwoDecimalPlaces(paymentsData?.avgTotalUserTips || 0)}`}
              </Text>
            </Td>
          </Tr>
          <Tr>
            <Td />
            <Td sx={{ fontSize: 14 }}>Last $/(# of days)</Td>
            <Td>
              <Text as="span" fontSize="md">
                <div>
                  <p>
                    $
                    {roundToTwoDecimalPlaces(
                      paymentsData?.totalUserPaymentDaysAgo?.paid || 0
                    )}{" "}
                  </p>
                  <p>
                    {paymentsData?.totalUserPaymentDaysAgo?.days_ago &&
                      `(${paymentsData?.totalUserPaymentDaysAgo?.days_ago <= 0 ? "today" : `${paymentsData?.totalUserPaymentDaysAgo?.days_ago} days ago`})`}
                  </p>
                </div>
              </Text>
            </Td>
            <Td>
              <Text as="span" fontSize="md">
                <div>
                  <p>
                    $
                    {roundToTwoDecimalPlaces(
                      paymentsData?.totalUserTipDaysAgo?.paid || 0
                    )}{" "}
                  </p>
                  <p>
                    {paymentsData?.totalUserTipDaysAgo?.days_ago &&
                      `(${paymentsData?.totalUserTipDaysAgo?.days_ago <= 0 ? "today" : `${paymentsData?.totalUserTipDaysAgo?.days_ago} days ago`})`}
                  </p>
                </div>
              </Text>
            </Td>
          </Tr>
        </Tbody>
      </Table>
      {hasNoRecentActivity() && (
        <Box>
          <Text
            fontSize="sm"
            backgroundColor="red"
            color="white"
            padding="2px 4px"
          >
            No purchases or tips in the last {messageThreshold} messages.
          </Text>
        </Box>
      )}
    </div> */}
    </>
  );
};
export default PaymentSummary;
