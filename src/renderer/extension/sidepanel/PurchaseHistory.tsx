import { RepeatIcon } from "@chakra-ui/icons";
import {
  VStack,
  Text,
  Heading,
  HStack,
  Button,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { PageName, type Payment, PaymentType } from "../config/types";
import { CardPurchaseHistory } from "../sidepanel/components/CardPurchaseHistory";
import { CardTipHistory } from "../sidepanel/components/CardTipHistory";
import SpinnerComponent from "../sidepanel/components/Spinner";
import { useGlobal } from "../sidepanel/hooks/useGlobal";
import { useMessages } from "../sidepanel/hooks/useMessages";

import { api } from "./api";
import NoUserSelected from "./components/NoUserSelected";
import { fetchAndSyncPayments } from "./hooks/usePayments";

function PurchaseHistory() {
  const {
    userId,
    selectedModel,
    activeTab,
    jwtToken,
    user,
    accountId,
    userUUID
  } = useGlobal();
  const [updatingPaymentsData, setUpdatingPaymentsData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getMessagesContent } = useMessages();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState(null);

  const syncPayments = useCallback(
    async (updatePaymentsData: boolean = false) => {
      if (!updatePaymentsData) {
        setIsLoading(true);
      }
      try {
        const messages = await getMessagesContent();
        const subs = await api.getSubscription(jwtToken, accountId, userId);
        setSubscription(subs);
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
            throw new Error(errorMsg);
          }
          setPayments(response.payments || []);
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
    [
      getMessagesContent,
      jwtToken,
      selectedModel,
      userId,
      accountId,
      userUUID,
      setPayments
    ]
  );

  useEffect(() => {
    let running = true;
    if (userId && activeTab === PageName.PurchaseHistory) {
      syncPayments()
        .then(() => {
          if (running) console.log("Payment history has been updated");
        })
        .catch((e) => {
          console.log("error", e);
          setPayments([]);
          running = false;
        })
        .finally(() => {
          setIsLoading(false);
          setUpdatingPaymentsData(false);
          running = false;
        });
    }
    return () => {
      running = false;
    };
  }, [userId, activeTab]);

  if (isLoading) {
    return <SpinnerComponent />;
  }

  if (!userId) {
    return <NoUserSelected />;
  }

  return (
    <VStack align="stretch" spacing={4} width="100%" padding={4}>
      <HStack>
        {/*<Box>*/}
        {/*  <Text>*/}
        {/*    Subscription for:{" "}*/}
        {/*    {subscription?.data?.data?.subDuration || "No subscription"}*/}
        {/*  </Text>*/}
        {/*  <Text>*/}
        {/*    Subscription date:{" "}*/}
        {/*    {subscription?.data?.data?.subDate*/}
        {/*      ? new Date(subscription.data.data.subDate).toDateString()*/}
        {/*      : "No subscription"}*/}
        {/*  </Text>*/}
        {/*</Box>*/}
      </HStack>
      <HStack justifyContent="space-between" width="full">
        <Heading fontWeight={500} fontSize={16} as="h1" noOfLines={1}>
          User: {user?.currentUserName}
        </Heading>
      </HStack>
      <Box width={"100%"}>
        <Tabs isFitted width={"100%"}>
          <Box display={"flex"} gap={"8px"} width={"100%"}>
            <TabList
              backgroundColor={"#E9E9E9"}
              borderRadius={"10px"}
              padding={"4px"}
              width={"100%"}
            >
              <Tab
                _selected={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  fontWeight: 600
                }}
                paddingY={"16px"}
                fontWeight={500}
                color={"#2F3341"}
                fontSize={14}
                lineHeight={"15.4px"}
              >
                Purchase History
              </Tab>
              <Tab
                _selected={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  fontWeight: 600
                }}
                paddingY={"16px"}
                fontWeight={500}
                color={"#2F3341"}
                fontSize={14}
                lineHeight={"15.4px"}
              >
                Tip History
              </Tab>
            </TabList>
            <Tooltip
              label="Synchronize payment history"
              aria-label="Sync Payments Tooltip"
            >
              <Button
                onClick={() => {
                  setUpdatingPaymentsData(true);
                  syncPayments(true);
                }}
                colorScheme="teal"
                height={"100%"}
                paddingX={"17px"}
                paddingY={"15.5px"}
                iconSpacing={0}
                backgroundColor={"#FFFDFD"}
                border={"1px"}
                borderRadius={"10px"}
                borderColor={"#E8E8E8"}
                _hover={{
                  backgroundColor: "#E8E8E8"
                }}
                // variant="solid"
                isDisabled={isLoading || updatingPaymentsData}
                leftIcon={
                  <RepeatIcon
                    color={"#2F3341"}
                    width={"24px"}
                    height={"24px"}
                  />
                }
                isLoading={isLoading || updatingPaymentsData}
              />
            </Tooltip>
          </Box>

          <TabPanels marginTop={"16px"}>
            <TabPanel
              padding={0}
              display={"flex"}
              flexDirection={"column"}
              gap={"16px"}
            >
              {payments?.filter((p) => p.type === PaymentType.PURCHASE)
                .length === 0 && (
                <Text fontSize="md" textAlign="center" color="gray.500">
                  No purchase history to display
                </Text>
              )}
              {payments
                ?.filter((p) => p.type === PaymentType.PURCHASE)
                .sort(
                  (a, b) =>
                    new Date(b.time).getTime() - new Date(a.time).getTime()
                )
                .map((purchase) => (
                  <CardPurchaseHistory
                    key={`purchase_${purchase.id}`}
                    {...purchase}
                  />
                ))}
            </TabPanel>
            <TabPanel
              padding={0}
              display={"flex"}
              flexDirection={"column"}
              gap={"16px"}
            >
              {payments?.filter((p) => p.type === PaymentType.TIP).length ===
                0 && (
                <Text fontSize="md" textAlign="center" color="gray.500">
                  No tip history to display
                </Text>
              )}
              {payments
                ?.filter((p) => p.type === PaymentType.TIP)
                .sort(
                  (a, b) =>
                    new Date(b.time).getTime() - new Date(a.time).getTime()
                )
                .map((tip) => (
                  <CardTipHistory key={`tip_${tip.id}`} {...tip} />
                ))}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </VStack>
  );
}

export default PurchaseHistory;
