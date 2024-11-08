import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Status } from "../../config/constants";
import {
  PaymentType,
  type OnlyFansMessageInput,
  type Payment
} from "../../config/types";
import { BasketIcon } from "../../icons";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import PaymentsTag, { DataForTagNumber } from "./PaymentsTag";

interface PaymentsTagsProps {
  payments: Payment[];
  paymentsData: any;
}

type Period = {
  unit: "days" | "weeks" | "months" | "all_time";
  value: number;
};

type PaymentSums = {
  currentUserSum: number;
  otherUserSum: number;
};

const calculatePercentageOfPaidPurchases = (
  userId: string,
  payments: Payment[],
  paymentType: PaymentType
): string => {
  const amoutOfPayments = payments.filter(
    (p) => p.type === paymentType && p.user_id === userId
  ).length;
  const amountOfPaidPayments = payments.filter(
    (p) =>
      p.paidStatus === Status.paid &&
      p.type === paymentType &&
      p.user_id === userId
  ).length;
  const percentage =
    amountOfPaidPayments && amoutOfPayments
      ? amountOfPaidPayments / amoutOfPayments
      : 0;

  return (percentage * 100).toFixed(0);
};

const calculatePaidPaymentsForPeriod = (
  payments: Payment[],
  currentAccountId: string,
  period: Period
): PaymentSums => {
  const now = new Date();
  let periodStartDate: Date | null = new Date(now);

  if (period.unit === "all_time") {
    periodStartDate = null;
  } else if (period.unit === "days") {
    periodStartDate.setDate(now.getDate() - period.value);
  } else if (period.unit === "weeks") {
    periodStartDate.setDate(now.getDate() - period.value * 7);
  } else if (period.unit === "months") {
    periodStartDate.setMonth(now.getMonth() - period.value);
  }

  const filteredPaidPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.time);
    return (
      payment.paidStatus === "Paid" &&
      (periodStartDate === null ||
        (paymentDate >= periodStartDate && paymentDate <= now))
    );
  });

  const currentUserPayments = filteredPaidPayments.filter(
    (payment) => payment.account_id === currentAccountId
  );
  const otherUserPayments = filteredPaidPayments.filter(
    (payment) => payment.account_id !== currentAccountId
  );

  const sumPayments = (payments: Payment[]): number =>
    payments.reduce(
      (total, payment) => total + parseFloat(String(payment.price)),
      0
    );

  const currentUserSum = sumPayments(currentUserPayments);
  const otherUserSum = sumPayments(otherUserPayments);

  return {
    currentUserSum,
    otherUserSum
  };
};

const PaymentsTags = ({ payments, paymentsData }: PaymentsTagsProps) => {
  const { userUUID, user, jwtToken, userId, accountId, agency } = useGlobal();
  const [OFuserMessages, setOFUserMessages] = useState<
    OnlyFansMessageInput[] | null
  >(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  useEffect(() => {
    const fetchOFUserMessages = async () => {
      const messages = await api.fetchOnlyFansMessagesByOfUserId(
        jwtToken,
        user.name
      );
      setOFUserMessages(messages.data);
      setIsLoadingMessages(false);
    };
    if (user.name && !isLoadingMessages) {
      setIsLoadingMessages(true);
      fetchOFUserMessages();
    }
  }, [user.name]);

  const calculatePaidPaymentsForPeriodMemoized = useCallback(
    (period: Period) =>
      calculatePaidPaymentsForPeriod(payments, accountId, period),
    [payments, accountId]
  );

  const currentUserSumForAllTime = useMemo(
    () =>
      calculatePaidPaymentsForPeriodMemoized({ unit: "all_time", value: 1 })
        .currentUserSum,
    [calculatePaidPaymentsForPeriodMemoized]
  );

  const currentUserSumForMonth = useMemo(
    () =>
      calculatePaidPaymentsForPeriodMemoized({ unit: "months", value: 1 })
        .currentUserSum,
    [calculatePaidPaymentsForPeriodMemoized]
  );

  const currentUserSumForWeek = useMemo(
    () =>
      calculatePaidPaymentsForPeriodMemoized({ unit: "weeks", value: 1 })
        .currentUserSum,
    [calculatePaidPaymentsForPeriodMemoized]
  );

  const numberOfSentMessages = useMemo(
    () =>
      OFuserMessages?.filter((msg) => msg.user_uuid === userUUID).length ?? 0,
    [OFuserMessages, userUUID]
  );

  const recentlyPurchasedPayments = useMemo(() => {
    if (!payments) return false;
    if (!payments.length) return false;

    const filteredPayments = payments.filter(({ time }) => {
      const paymentDate = new Date(time);
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - paymentDate.getTime();
      const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

      return daysDifference <= 6;
    });

    return filteredPayments.some(({ paidStatus }) => paidStatus === "Paid");
  }, [payments]);

  const persentageOfPaidPurchases = useMemo(() => {
    return (
      calculatePercentageOfPaidPurchases(
        userId,
        payments,
        PaymentType.PURCHASE
      ) ?? 0
    );
  }, [userId, payments]);

  const whaleThreshold = useMemo(() => {
    return agency.settings.whale_threshold ?? 500;
  }, [agency]);

  if (isLoadingMessages) {
    return (
      <Flex
        width={"100%"}
        justifyContent={"center"}
        alignItems={"center"}
        height={"60px"}
      >
        <Spinner size="xs" />
      </Flex>
    );
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      <Box
        display="flex"
        px="9px"
        py={1}
        gap={1.5}
        alignItems="center"
        justifyContent="center"
        backgroundColor={
          Number(persentageOfPaidPurchases) === 0 ? "#F45252" : "#00BB83"
        }
        fontSize="12px"
        fontWeight={600}
        color="white"
        borderRadius="20px"
      >
        <BasketIcon width="10px" height="10px" />
        <Text>{persentageOfPaidPurchases}%</Text>
      </Box>
      {currentUserSumForMonth >= whaleThreshold && (
        <PaymentsTag
          dataForTagNumber={DataForTagNumber.WHALE}
          whaleThreshold={whaleThreshold}
        />
      )}
      {paymentsData?.totalUserPayments > 0 && (
        <PaymentsTag dataForTagNumber={DataForTagNumber.KNOWN_SPENDER} />
      )}
      {currentUserSumForWeek === 0 && (
        <PaymentsTag
          dataForTagNumber={DataForTagNumber.NO_PURCHASE_LAST_WEEK}
        />
      )}
      {numberOfSentMessages < 12 && (
        <PaymentsTag dataForTagNumber={DataForTagNumber.NEW_CONVERSATION} />
      )}
      {numberOfSentMessages >= 12 && currentUserSumForAllTime === 0 && (
        <PaymentsTag dataForTagNumber={DataForTagNumber.NEVER_PURCHASED} />
      )}
      {recentlyPurchasedPayments && currentUserSumForWeek !== 0 && (
        <PaymentsTag dataForTagNumber={DataForTagNumber.RECENTLY_PURCHASED} />
      )}
    </Box>
  );
};

export default PaymentsTags;
