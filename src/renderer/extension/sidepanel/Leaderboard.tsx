"use client";

import {
  Text,
  Box,
  Icon,
  Table,
  Thead,
  Tr,
  Td,
  Tbody,
  Tooltip,
  Spinner
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import {
  PageName,
  type LeaderboardEntry,
  type OnlyFansMessageInput,
  type Payment
} from "../config/types";

import { api } from "./api";
import { useGlobal } from "./hooks/useGlobal";
import useMember from "./hooks/useMember";
import useWindowSize from "./hooks/useWindowSize";

const now = new Date();

const getStartDate = (days) => {
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);
  return startDate.toISOString();
};

const getStartMonth = (months) => {
  const startDate = new Date();
  startDate.setMonth(now.getMonth() - months);
  return startDate.toISOString();
};

function formatToISO8601(dateString) {
  const date = new Date(dateString);

  return date.toISOString();
}

interface DateFilter {
  id: number;
  content: string;
  start_date: string;
  end_date: string;
}

const datesFilterData: DateFilter[] = [
  {
    id: 0,
    content: "24 h",
    start_date: getStartDate(1),
    end_date: now.toISOString()
  },
  {
    id: 1,
    content: "3 d",
    start_date: getStartDate(3),
    end_date: now.toISOString()
  },
  {
    id: 2,
    content: "7 d",
    start_date: getStartDate(7),
    end_date: now.toISOString()
  },
  {
    id: 3,
    content: "1 m",
    start_date: getStartMonth(1),
    end_date: now.toISOString()
  },
  {
    id: 4,
    content: "3 m",
    start_date: getStartMonth(3),
    end_date: now.toISOString()
  },
  {
    id: 5,
    content: "6 m",
    start_date: getStartMonth(6),
    end_date: now.toISOString()
  }
];

function useDataForLeaderboard(
  token: string,
  userUuid: string,
  dateFilter: DateFilter,
  activeTab: string
) {
  return useQuery<
    {
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
    },
    Error
  >({
    queryKey: ["leaderboard-metrics", dateFilter],
    queryFn: async () => {
      if (!token) {
        throw new Error("No JWT token found");
      }
      return api.getDataForLeaderboard(
        token,
        userUuid,
        dateFilter.start_date,
        dateFilter.end_date
      );
    },
    enabled: !!token && activeTab === PageName.Leaderboard
  });
}

type ResultItem = {
  account_id: string;
  total_sales: number;
  ppv_conversion: number;
};

function transformDataForAccountsActivity(data: Payment[]): ResultItem[] {
  const groupedData: { [key: string]: Payment[] } = data.reduce(
    (acc, curr) => {
      if (!acc[curr.account_id]) {
        acc[curr.account_id] = [];
      }
      acc[curr.account_id].push(curr);
      return acc;
    },
    {} as { [key: string]: Payment[] }
  );

  const result: ResultItem[] = Object.keys(groupedData).map((accountId) => {
    const accountData = groupedData[accountId];

    const paidPurchases = accountData.filter(
      (item) => item.paidStatus === "Paid"
    );
    const totalPurchases = accountData.filter(
      (item) => item.type === "purchase"
    );

    const totalSales = paidPurchases.reduce(
      (sum, item) => sum + Number(item.price),
      0
    );

    const ppvConversion =
      totalPurchases.length > 0
        ? paidPurchases.length / totalPurchases.length
        : 0;

    return {
      account_id: accountId,
      total_sales: totalSales,
      ppv_conversion: ppvConversion
    };
  });

  return result;
}

interface LeaderboardProps {}

const Leaderboard = () => {
  const { width: windowWidth } = useWindowSize();
  const { jwtToken, userUUID, activeTab, agency } = useGlobal();

  const {
    data: member,
    isLoading: isLoadingMember,
    refetch: refetchMember
  } = useMember();

  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>(
    datesFilterData[2]
  );

  const { data: currentLeaderboardData, isLoading } = useDataForLeaderboard(
    jwtToken,
    userUUID,
    selectedDateFilter,
    activeTab
  );

  const stats = useMemo(() => {
    if (currentLeaderboardData && currentLeaderboardData.data) {
      let total_sales = 0;
      let average_sales = 0;
      let hour_sales = 0;
      let ppv_sent = 0;
      let ppv_unlocked = 0;
      let ppv_conversion = 0;
      let ai_utilization =
        currentLeaderboardData.data.generated_messages >
        currentLeaderboardData.data.messages_count
          ? 100
          : (
              (currentLeaderboardData.data.generated_messages /
                currentLeaderboardData.data.messages_count) *
              100
            ).toFixed(0);
      let messages_count = currentLeaderboardData.data.messages_count;

      if (currentLeaderboardData.data.payments.length) {
        total_sales = currentLeaderboardData.data.payments
          .filter((payment) => payment.paidStatus === "Paid")
          .reduce((sum, payment) => {
            return sum + Number(payment.price);
          }, 0);
        average_sales =
          currentLeaderboardData.data.payments.filter(
            (payment) => payment.paidStatus === "Paid"
          ).length > 0
            ? total_sales /
              currentLeaderboardData.data.payments.filter(
                (payment) => payment.paidStatus === "Paid"
              ).length
            : 0;
        hour_sales = Number(
          (total_sales / currentLeaderboardData.data.worked_hours).toFixed(0)
        );
        ppv_sent = currentLeaderboardData.data.payments.filter(
          (payment) => payment.type === "purchase"
        ).length;
        ppv_unlocked = currentLeaderboardData.data.payments.filter(
          (payment) =>
            payment.type === "purchase" && payment.paidStatus === "Paid"
        ).length;
        ppv_conversion = Number(((ppv_unlocked / ppv_sent) * 100).toFixed(0));

        return {
          total_sales,
          average_sales,
          hour_sales,
          ppv_sent,
          ppv_unlocked,
          ppv_conversion,
          ai_utilization,
          messages_count
        };
      } else {
        return {
          total_sales: 0,
          average_sales: 0,
          hour_sales: 0,
          ppv_sent: 0,
          ppv_unlocked: 0,
          ppv_conversion: 0,
          ai_utilization,
          messages_count
        };
      }
    } else {
      return {
        total_sales: 0,
        average_sales: 0,
        hour_sales: 0,
        ppv_sent: 0,
        ppv_unlocked: 0,
        ppv_conversion: 0,
        ai_utilization: 0,
        messages_count: 0
      };
    }
  }, [currentLeaderboardData]);

  const leaderboardUpdatedData: LeaderboardEntry[] = useMemo(() => {
    if (currentLeaderboardData && currentLeaderboardData.data) {
      let updatedData = [];
      if (currentLeaderboardData.data.leaderboard.length > 9) {
        updatedData = currentLeaderboardData.data.leaderboard.filter(
          (item, index) => index <= 9
        );
      } else {
        updatedData = currentLeaderboardData.data.leaderboard;
      }

      const currentUserData = currentLeaderboardData.data.leaderboard.find(
        (item) => item.user_uuid === userUUID
      );
      if (
        currentUserData &&
        updatedData.every((item) => item.user_uuid !== userUUID)
      ) {
        updatedData.push(currentUserData);
      }

      return updatedData;
    } else {
      return [];
    }
  }, [currentLeaderboardData]);

  const ofAccountsActivityData = useMemo(() => {
    if (currentLeaderboardData && currentLeaderboardData.data) {
      if (currentLeaderboardData.data.payments.length) {
        return transformDataForAccountsActivity(
          currentLeaderboardData.data.payments
        );
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [currentLeaderboardData]);

  return (
    <Box
      width="100%"
      backgroundColor="white"
      opacity={isLoading ? "30%" : "100%"}
      p={4}
      borderRadius="10px"
      display="flex"
      flexDirection="column"
      gap={4}
      cursor={isLoading ? "not-allowed" : "auto"}
      position="relative"
    >
      {isLoading && (
        <Spinner size="xl" position="absolute" top={"20%"} left={"40%"} />
      )}
      <Box
        backgroundColor="#EFEEEF"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={4}
        borderRadius="10px"
      >
        {datesFilterData.map((date) => {
          return (
            <Box
              borderRadius="10px"
              key={date.content}
              width={`${100 / datesFilterData.length}%`}
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              backgroundColor={
                selectedDateFilter.id === date.id ? "#5433FF" : "#EFEEEF"
              }
              cursor="pointer"
              onClick={() => setSelectedDateFilter(datesFilterData[date.id])}
            >
              <Text
                fontSize={selectedDateFilter.id === date.id ? "12px" : "10px"}
                fontWeight={selectedDateFilter.id === date.id ? 600 : 500}
                color={selectedDateFilter.id === date.id ? "white" : "#7C7C7C"}
              >
                {date.content}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box display="flex" flexDirection="column" gap={1.5}>
        <Text fontSize="11px" fontWeight={700} color="#606060">
          Chatter leaderboard
        </Text>
        <Box backgroundColor="#EFEEEF" p={2} borderRadius="10px">
          <Table maxWidth="100%" variant="unstyled">
            <Thead>
              <Tr p={0} fontSize="10px" fontWeight={400} color="#606060">
                <Td textAlign="center" p={0}>
                  Rank
                </Td>
                <Td textAlign="center" p={0}>
                  Name
                </Td>
                <Td textAlign="center" p={0}>
                  $ Purchases
                </Td>
                <Td textAlign="center" p={0}>
                  $Tips
                </Td>
                <Td textAlign="center" p={0}>
                  $ per hour
                </Td>
              </Tr>
            </Thead>
            <Tbody>
              {leaderboardUpdatedData.map((item, index) => {
                const isLastRow =
                  index === leaderboardUpdatedData.length - 1 &&
                  item.user_uuid === userUUID;
                return (
                  <Tr
                    p={0}
                    key={item.rank + item.name}
                    fontSize="10px"
                    sx={{
                      borderTop: isLastRow ? "0.2px solid #7C7C7C" : "none",
                      color:
                        isLastRow || item.user_uuid === userUUID
                          ? "#5433FF"
                          : "inherit"
                    }}
                  >
                    <Td textAlign="center" p={0} fontWeight={700}>
                      {item.rank}
                    </Td>
                    <Td textAlign="center" p={0} fontWeight={400}>
                      {item.name}
                    </Td>
                    <Td textAlign="center" p={0} fontWeight={500}>
                      {item.purchases.toFixed(0)}
                    </Td>
                    <Td textAlign="center" p={0} fontWeight={400}>
                      {item.tips.toFixed(0)}
                    </Td>
                    <Td textAlign="center" p={0} fontWeight={400}>
                      {item.worked_hours > 0
                        ? (
                            item.total_payments_amount / item.worked_hours
                          ).toFixed(0)
                        : 0}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
      <Box
        backgroundColor="#EFEEEF"
        display="flex"
        flexDirection="column"
        gap={4}
        p={4}
        borderRadius="10px"
      >
        <Text fontSize="16px" fontWeight={500}>
          Total sales (all accounts)
        </Text>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text fontSize="32px" fontWeight={700}>
            ${stats.total_sales.toFixed(0)}
          </Text>
          <Text fontSize="12px" fontWeight={500}>
            Average: ${stats.average_sales.toFixed(0)}
          </Text>
        </Box>
      </Box>
      <Box width="100%" display="flex" gap={2} alignItems="center">
        <Box
          width="33%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={2}
          backgroundColor="#EFEEEF"
          borderRadius="10px"
          height={windowWidth > 425 ? "auto" : "80px"}
        >
          <Text fontSize="11px" fontWeight={700}>
            Sales/ hour
          </Text>
          <Text fontSize="16px" fontWeight={700} color="#00BB83">
            ${stats.hour_sales}
          </Text>
        </Box>
        <Box
          width="33%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={2}
          backgroundColor="#EFEEEF"
          borderRadius="10px"
          height={windowWidth > 425 ? "auto" : "80px"}
        >
          <Text fontSize="11px" fontWeight={700}>
            PPV conversion
          </Text>
          <Text fontSize="16px" fontWeight={700} color="#00BB83">
            {stats.ppv_conversion}%
          </Text>
        </Box>
        <Box
          width="33%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={2}
          backgroundColor="#EFEEEF"
          borderRadius="10px"
          height={windowWidth > 425 ? "auto" : "80px"}
        >
          <Text fontSize="11px" fontWeight={700}>
            MAX AI utilization
          </Text>
          <Text fontSize="16px" fontWeight={700} color="#00BB83">
            {stats.ai_utilization}%
          </Text>
        </Box>
      </Box>
      <Box
        backgroundColor="#EFEEEF"
        display="flex"
        flexDirection="column"
        gap={4}
        p={4}
        borderRadius="10px"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" flexDirection="column" gap={2}>
            <Text fontSize="10px" fontWeight={500}>
              Message count
            </Text>
            <Text fontSize="32px" fontWeight={700}>
              {stats.messages_count}
            </Text>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            <Text fontSize="12px" fontWeight={500}>
              PPV sent:{" "}
              <span style={{ color: "#FF0092" }}>{stats.ppv_sent}</span>
            </Text>
            <Text fontSize="12px" fontWeight={500}>
              PPV unlocked:{" "}
              <span style={{ color: "#00BB83" }}>{stats.ppv_unlocked}</span>
            </Text>
          </Box>
        </Box>
        {/* <Box display="flex" justifyContent="center" alignItems="center">
          <Text fontSize="32px" fontWeight={700}>
            CHART
          </Text>
        </Box> */}
      </Box>
      <Box width="100%" display="flex" flexDirection="column" gap={2}>
        {member && Boolean(member.individual_challenge_activity) && (
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Text fontSize="11px" fontWeight={700} color="#606060">
              Individual challenge
            </Text>
            <Tooltip
              hasArrow
              borderRadius="10px"
              label={
                <Box display="flex" flexDirection="column" gap={1}>
                  <Text>
                    {`Start date: ${member.individual_challenge_start_date}`}
                  </Text>
                  <Text>
                    {`End date: ${member.individual_challenge_end_date}`}
                  </Text>
                </Box>
              }
            >
              <Box
                p={4}
                display="flex"
                alignItems="center"
                gap={2}
                backgroundColor={
                  selectedDateFilter.id === datesFilterData.length
                    ? "#266188"
                    : "#266188"
                }
                borderRadius="8px"
                cursor="pointer"
                onClick={() =>
                  setSelectedDateFilter({
                    id: datesFilterData.length,
                    content: "Individual challenge",
                    start_date: formatToISO8601(
                      member.individual_challenge_start_date
                    ),
                    end_date: formatToISO8601(
                      member.individual_challenge_end_date
                    )
                  })
                }
                sx={{
                  boxShadow:
                    selectedDateFilter.id === datesFilterData.length
                      ? "inset 0px 0px 12px rgba(0, 0, 0, 0.4), inset 0px 0px 8px rgba(38, 97, 136, 0.5)"
                      : "0px 4px 12px rgba(0, 0, 0, 0.2), 0px 0px 10px rgba(38, 97, 136, 0.7)",
                  transform:
                    selectedDateFilter.id === datesFilterData.length
                      ? "scale(0.98)"
                      : "scale(1)",
                  transition: "all 0.2s ease-in-out"
                }}
              >
                <Icon as={FaStar} width="10px" height="10px" color="#FFD74B" />
                <Text fontSize="12px" fontWeight={600} color="white">
                  {member.individual_challenge_description}
                </Text>
              </Box>
            </Tooltip>
          </Box>
        )}
        {agency &&
          agency.settings &&
          Boolean(agency.settings.global_challange_activity) && (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Text fontSize="11px" fontWeight={700} color="#606060">
                Global challenge
              </Text>
              <Tooltip
                hasArrow
                borderRadius="10px"
                label={
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Text>
                      {`Start date: ${agency.settings.global_challange_start_date}`}
                    </Text>
                    <Text>
                      {`End date: ${agency.settings.global_challange_end_date}`}
                    </Text>
                  </Box>
                }
              >
                <Box
                  p={4}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  cursor="pointer"
                  backgroundColor={
                    selectedDateFilter.id === datesFilterData.length + 1
                      ? "#FF9114"
                      : "#FF9114"
                  }
                  borderRadius="8px"
                  sx={{
                    boxShadow:
                      selectedDateFilter.id === datesFilterData.length + 1
                        ? "inset 0px 0px 12px rgba(0, 0, 0, 0.4), inset 0px 0px 8px rgba(255, 145, 20, 0.5)"
                        : "0px 4px 12px rgba(0, 0, 0, 0.2), 0px 0px 10px rgba(255, 145, 20, 0.7)",
                    transform:
                      selectedDateFilter.id === datesFilterData.length + 1
                        ? "scale(0.98)"
                        : "scale(1)",
                    transition: "all 0.2s ease-in-out"
                  }}
                  onClick={() =>
                    setSelectedDateFilter({
                      id: datesFilterData.length + 1,
                      content: "Global challenge",
                      start_date: formatToISO8601(
                        agency.settings.global_challange_start_date
                      ),
                      end_date: formatToISO8601(
                        agency.settings.global_challange_end_date
                      )
                    })
                  }
                >
                  <Icon
                    as={FaStar}
                    width="10px"
                    height="10px"
                    color="#FFD74B"
                  />
                  <Text fontSize="12px" fontWeight={600} color="white">
                    {agency.settings.global_challange_description}
                  </Text>
                </Box>
              </Tooltip>
            </Box>
          )}
      </Box>
      <Box display="flex" flexDirection="column" gap={1.5}>
        <Text fontSize="11px" fontWeight={700} color="#606060">
          Activity by OF account
        </Text>
        <Box backgroundColor="#EFEEEF" p={2} borderRadius="10px">
          <Table maxWidth="100%" variant="unstyled">
            <Thead>
              <Tr p={0} fontSize="10px" fontWeight={400} color="#606060">
                <Td textAlign="center" p={0}>
                  Name
                </Td>
                <Td textAlign="center" p={0}>
                  $ Total sales
                </Td>
                <Td textAlign="center" p={0}>
                  PPV conv
                </Td>
              </Tr>
            </Thead>
            <Tbody>
              {ofAccountsActivityData
                .sort((a, b) => b.total_sales - a.total_sales)
                .map((item, index) => {
                  return (
                    <Tr p={0} key={item.account_id} fontSize="10px">
                      <Td textAlign="center" p={0} fontWeight={600}>
                        {item.account_id}
                      </Td>
                      <Td textAlign="center" p={0} fontWeight={400}>
                        {item.total_sales.toFixed(0)}
                      </Td>
                      <Td textAlign="center" p={0} fontWeight={400}>
                        {(item.ppv_conversion * 100).toFixed(0)}%
                      </Td>
                    </Tr>
                  );
                })}
            </Tbody>
          </Table>
        </Box>
      </Box>
      {member &&
        member.commission >= 0 &&
        Boolean(member.commission_visibility) && (
          <Box
            backgroundColor="#EFEEEF"
            display="flex"
            flexDirection="column"
            gap={4}
            p={4}
            borderRadius="10px"
          >
            <Text fontSize="16px" fontWeight={500}>
              My{" "}
              {member.commission > 0
                ? member.commission
                : agency.settings.chatter_comission}
              % commission
            </Text>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="24px" fontWeight={700}>
                $
                {(
                  (stats.total_sales *
                    (member.commission > 0
                      ? member.commission
                      : agency.settings.chatter_comission)) /
                  100
                ).toFixed(0)}
              </Text>
            </Box>
          </Box>
        )}
    </Box>
  );
};

export default Leaderboard;
