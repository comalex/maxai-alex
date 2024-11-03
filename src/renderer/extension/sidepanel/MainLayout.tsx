import {
  Center,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
  Text,
  Button,
  VStack,
  Box,
  useColorMode,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Modal,
  Flex
} from "@chakra-ui/react";
import { useStorage } from "../../plasmohq/messaging";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { IoStatsChartOutline } from "react-icons/io5";
import { getListOfModels } from "../background/api";
import { STORAGE_KEYS } from "../config/constants";
import { type Model, PageName } from "../config/types";
import {
  CustomRequestsIcon,
  HistoryIcon,
  MessagesIcon,
  SettingsIcon,
  VaultIcon,
  VoiceIcon,
  GeneralSettingsIcon,
  VideoChatIcon,
  LogOut,
  ExclamationMarkIcon,
  ChessIcon,
  TimerIcon
} from "../icons";
import { REGEX_PATTERNS, isValidPage } from "../services/utils";
import Chat from "../sidepanel/Chat";
import LogOutButton from "../sidepanel/LogOut";
import PurchaseHistory from "../sidepanel/PurchaseHistory";
import VaultList from "../sidepanel/VaultList";
import { api } from "../sidepanel/api";
import MainLoader from "../sidepanel/components/MainLoader";
import InactiveErrorModal from "../sidepanel/components/Modals/InactiveErrorModal";
import InactiveModal from "../sidepanel/components/Modals/InactiveModal";
import MyGoalProgressBar from "../sidepanel/components/MyGoalProgressBar";
import { useGlobal } from "../sidepanel/hooks/useGlobal";
import useMember from "../sidepanel/hooks/useMember";

import AIModelSettings from "./AIModelSettings";
import CustomRequests from "./CustomRequests";
import GeneralSettings from "./GeneralSettings";
import Help from "./Help";
import Leaderboard from "./Leaderboard";
import VideoChatBooking from "./VideoChatBooking";
import VoicePage from "./VoicePage";
import Debug from "./components/Debug";
import MaintenanceMessage from "./components/Maintenance/MaintenanceMessage";
import { useIsPermitted } from "./hooks/useIsPermitted";

const UrlCheckWrapper = ({ regex, text, children }) => {
  const { currentUrl } = useGlobal();

  const isValidCheck = useMemo(
    () => !currentUrl || isValidPage(regex, currentUrl),
    [regex, currentUrl]
  );

  if (!isValidCheck) {
    return (
      <Center height="100%">
        <VStack>
          <Text fontSize="xl" fontWeight="bold">
            {text}
          </Text>
          <Button onClick={() => window.location.reload()}>Force reload</Button>
        </VStack>
      </Center>
    );
  }

  return <>{children}</>;
};

function MainLayout({ logout }) {
  const {
    activePage,
    setModels,
    setActiveTab,
    activeTab,
    isDebugMode,
    selectedModel,
    logger,
    userId,
    jwtToken,
    chatJwtToken,
    account,
    currentUrl,
    setShiftId,
    accountName,
    globalNotificationMode,
    globalNotificationMessage,
    currentWebviewId,
  } = useGlobal();

  const {
    isPermitted,
    loading: isPermittedLoading,
    error: isPermittedError
  } = useIsPermitted();

  const [_, setModelsStore] = useStorage<Model[]>(currentWebviewId, STORAGE_KEYS.MODELS);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    data: member,
    isLoading: isLoadingMember,
    refetch: refetchMember
  } = useMember();

  useEffect(() => {
    if (colorMode === "dark") {
      toggleColorMode();
    }
  }, [colorMode]);

  useEffect(() => {
    if (!isLoadingMember && member?.current_shift_id) {
      setIsClockedIn(true);
    } else {
      setIsClockedIn(false);
    }
  }, [member]);

  useEffect(() => {
    const fetchModels = async () => {
      if (jwtToken) {
        const models = await getListOfModels(jwtToken);
        setModelsStore(models);
        setModels(models);
      }
    };
    fetchModels();
  }, [jwtToken]);


  const handleClockIn = async () => {
    setIsClockedIn(true);
    const startTime = new Date();
    const response = await api.manageShift({
      jwtToken,
      clock: "clock_in",
      ofUserId: accountName,
      startTime: startTime.toISOString()
    });
    setShiftId(response.shiftId);
    toast({
      title: "Clocked In!",
      description: `Clocked in successfully at ${startTime.toLocaleString()}. You can clock out on the Logout tab.`,
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "bottom"
    });
  };
  console.log("Account details:", account, "Clock-in status:", isClockedIn);
  const tabComponents = [
    {
      name: PageName.Message,
      title: "Messaging",
      icon: <MessagesIcon />,
      component: (
        <UrlCheckWrapper
          text="Please select a message thread to generate a response"
          regex={REGEX_PATTERNS.ONLYFANS_MESSAGE_THREAD}
        >
          {account ? (
            !isClockedIn ? (
              <Button colorScheme="green" width="100%" onClick={handleClockIn}>
                Clock In
              </Button>
            ) : (
              <Chat chatJwtToken={chatJwtToken} />
            )
          ) : (
            <MainLoader />
          )}
        </UrlCheckWrapper>
      )
    },
    {
      name: PageName.VoicePage,
      title: "Voice Generation",
      icon: <VoiceIcon />,
      component: <VoicePage />
    },
    {
      name: PageName.VaultList,
      title: "MaxVault",
      icon: <VaultIcon />,
      component: <VaultList />
    },
    {
      name: PageName.CustomRequests,
      title: "Custom Request",
      icon: <CustomRequestsIcon />,
      component: <CustomRequests />
    },
    {
      name: PageName.VideoChat,
      title: "Video Chat",
      icon: <VideoChatIcon />,
      component: <VideoChatBooking />
    },
    {
      name: PageName.Leaderboard,
      title: "Leaderboard",
      icon: <IoStatsChartOutline />,
      component: <Leaderboard />,
      disabled: false
    },
    {
      name: PageName.PurchaseHistory,
      title: "Purchase History",
      icon: <HistoryIcon />,
      component: (
        <UrlCheckWrapper
          regex={REGEX_PATTERNS.ONLYFANS_MESSAGE_THREAD}
          text="Please select a user to view their Purchase History"
        >
          <PurchaseHistory />
        </UrlCheckWrapper>
      )
    },
    {
      name: PageName.GeneralSettings,
      title: "General Settings",
      icon: <GeneralSettingsIcon />,
      component: account ? (
        <GeneralSettings logout={logout} isPermitted={isPermitted} />
      ) : null
    },
    {
      name: PageName.Help,
      title: "Help",
      icon: <ExclamationMarkIcon />,
      component: (
        <UrlCheckWrapper
          regex={REGEX_PATTERNS.ONLYFANS_BASE_URL}
          text="Please open the OnlyFans page"
        >
          <Help />
        </UrlCheckWrapper>
      )
    },
    {
      name: PageName.LogOut,
      title: "Log Out",
      icon: <LogOut />,
      component: <LogOutButton logout={logout} />
    }
  ];

  useEffect(() => {
    setActiveTab(tabComponents[0].name);
  }, []);

  const tabIndex = useMemo(() => {
    const index = tabComponents.findIndex((tab) => tab.name === activeTab);
    return index === -1 ? 0 : index;
  }, [tabComponents, activePage]);

  const handleTabChange = (index) => {
    const selectedTab = tabComponents[index];
    // setActivePage(selectedTab.name);
    setActiveTab(selectedTab.name);
    api.updateLastActivity(jwtToken);
  };

  if (
    member &&
    Object.prototype.hasOwnProperty.call(member, "isDisabled") &&
    member.isDisabled === 1
  ) {
    return (
      <Box p={4}>
        <Text color="red" fontSize="xl">
          Your account has been disabled, please contact your administrator.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <InactiveErrorModal
        isOpen={member?.is_show_activity_error_modal ?? 0}
        onClose={onClose}
        refetchMember={refetchMember}
      />
      <InactiveModal
        isOpen={member?.is_show_activity_modal ?? 0}
        onClose={onClose}
        refetchMember={refetchMember}
      />
      <Tabs
        variant="unstyled"
        index={tabIndex}
        onChange={handleTabChange}
        backgroundColor={colorMode === "light" ? "#F4F4F4" : "black"}
      >
        <TabList
          p={2}
          width="100%"
          display="flex"
          flexWrap="wrap"
          position="sticky"
          top="0"
          zIndex="99"
          backgroundColor={colorMode === "light" ? "white" : "#2C2C2E"}
          gap={2}
        >
          {tabComponents.map((tab, index) => (
            <Box
              key={tab.name}
              width="18%"
              display="flex"
              flexDirection="column"
              gap="3px"
            >
              <Tab
                width="100%"
                title={tab.title}
                _selected={{ color: "white", bg: "#5449F6" }}
                borderRadius="10px"
                backgroundColor={colorMode === "light" ? "#EFEEEF" : "#393939"}
                p="11px"
                pointerEvents={
                  tab.disabled ||
                  (!isClockedIn &&
                    tab.name !== PageName.LogOut &&
                    tab.name !== PageName.Message)
                    ? "none"
                    : "auto"
                }
              >
                {tab.icon}
              </Tab>
              <Text
                fontSize="8px"
                fontWeight={tab.name === activeTab ? "700" : "400"}
                whiteSpace="nowrap"
                textAlign="center"
              >
                {tab.title}
              </Text>
            </Box>
          ))}
          <MyGoalProgressBar />
          {globalNotificationMode === "reminder" && (
            <Flex width={"100%"} mt={2}>
              <MaintenanceMessage text={globalNotificationMessage} />
            </Flex>
          )}
        </TabList>

        <TabPanels>
          {tabComponents.map((tab) => (
            <TabPanel key={tab.name}>{tab.component}</TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      {isDebugMode && isPermitted && <Debug />}
    </>
  );
}
export default MainLayout;
