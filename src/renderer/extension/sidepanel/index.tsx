import "../background/sockets-api";
import "../content";
import {
  Center,
  ChakraProvider,
  Spinner,
  useToast,
  Text,
  extendTheme,
  ColorModeScript
} from "@chakra-ui/react";
import { sendToBackground } from "../../plasmohq/messaging";
import { useStorage } from "../../plasmohq/messaging";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import ErrorBoundary from "../ErrorBoundary";
import { EXTENSION_MESSAGE_TYPES, STORAGE_KEYS } from "../config/constants";
import type {
  Account,
  Agency,
  Logger,
  Message,
  Model,
  PageName,
  PaymentResponse,
  User
} from "../config/types";
import { getActiveTabUrl, getCustomAccountName } from "../services/utils";
import MaintenanceMode from "../sidepanel/components/Maintenance/MaintenanceMode";
import { useGlobalNotifications } from "../sidepanel/hooks/useGlobalNotifications";

import Login from "./Login";
import MainLayout from "./MainLayout";
import { api } from "./api";
import { CurrentPageContext } from "./context";
import { sendLogToDatadogAsync } from "./logger";
import browserRuntime from "../browserRuntime";

const queryClient = new QueryClient();

const config = {
  initialColorMode: "system", // This uses the system color mode by default
  useSystemColorMode: true // Enables automatic color mode switching
};

const theme = extendTheme({ config });

const Loader: React.FC = () => {
  return (
    <Center height="100vh">
      <Spinner size="xl" />
    </Center>
  );
};

function IndexSidePanel() {
  const [activePage, setActivePage] = useState<PageName>(null);
  const [isDebugMode, setDebugMode] = useStorage<boolean>(
    STORAGE_KEYS.DEBUG_MODE,
    false
  );
  const [storedModel, setStoredModel] = useStorage<Model>(
    STORAGE_KEYS.SELECTED_MODEL
  );

  const [chatter, setChatter] = useStorage<string>(STORAGE_KEYS.CHATTER, null);

  const [accountIdIsLoading, setAccountIdIsLoading] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<string>(null);

  const [accountName, setAccountName] = useState<string>(null);
  const [selectedModel, setSelectedModel] = useState<Model>(null);
  const [models, setModels] = useState();
  const [autoPlayState, setAutoPlayState] = useState<boolean>(false);
  const [expandSimulateBlock, setExpandSimulateBlock] =
    useState<boolean>(false);
  const [autoGenerateResponseState, setAutoGenerateResponseState] =
    useState<boolean>(false);

  const [userId, setUserId] = useState<string>();
  const [debugMessage, setDebugMessage] = useState<string[]>([]);
  const [agency, setAgency] = useState<Agency>(null);

  const [account, setAccount] = useState<Account>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<PageName>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(null);

  const [payments, setPayments] = useState<PaymentResponse>(null);

  const [content, setContent] = useState<Message | null>(null);

  const [jwtToken, setJwtToken] = useStorage<string>(STORAGE_KEYS.JWT_TOKEN);

  const [customVaultId, setCustomVaultId] = useStorage<string | number>(
    STORAGE_KEYS.CUSTOM_VAULT_ID
  );

  const [customAccountName, setCustomAccountName] = useStorage<string>(
    STORAGE_KEYS.CUSTOM_ACCOUNT_NAME
  );

  const [chatJwtToken, setChatJwtToken] = useStorage<string>(
    STORAGE_KEYS.CHAT_JWT_TOKEN
  );

  const [userUUID, setUserUUID] = useStorage<string>(STORAGE_KEYS.USER_UUID);

  const [voiceGenAbility, setVoiceGenAbility] = useStorage<boolean>(
    STORAGE_KEYS.VOICE_GENERATION_ABILITY
  );

  const [lastFanSpend, setLastFanSpend] = useStorage<number>(
    STORAGE_KEYS.LAST_FAN_SPEND
  );

  const [shiftId, setShiftId] = useState<string>(null);

  const toast = useToast();

  const [user, setUser] = useState<User>(null);

  const chatterRef = useRef<string>(null);

  const {
    global_notification_mode: globalNotificationMode,
    global_notification_message: globalNotificationMessage,
    maintenance_from: maintenanceFrom,
    maintenance_to: maintenanceTo,
    isLoadingGlobalNotifications
  } = useGlobalNotifications();

  useEffect(() => {
    if (chatter) {
      // Perform any necessary actions when chatter updates
      chatterRef.current = chatter;
      // You can add more logic here as needed
    }
  }, [chatter]);
  const logger: Logger = useMemo(
    () => ({
      debug: (...args) => {
        console.log(...args);
        sendLogToDatadogAsync(JSON.stringify(args), {
          userId: chatterRef?.current
        });
        setDebugMessage((prevMessages) => {
          const newMessages = [
            ...prevMessages,
            args
              .map((arg) => {
                try {
                  return JSON.stringify(arg);
                } catch {
                  return arg.toString();
                }
              })
              .join("::")
          ];
          if (newMessages.length > 50) {
            newMessages.splice(0, newMessages.length - 50);
          }
          return newMessages;
        });
      },
      clean: () => {
        setDebugMessage([]);
      }
    }),
    []
  );

  useEffect(() => {
    const setListener = async () => {
      const { success, data } = await sendToBackground({
        name: "retrieve-data",
        body: {
          type: EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS
        }
      });
      return data;
    };
    if (accountId) {
      setListener();
    }
  }, [accountId]);

  const checkProcessingStatus = async () => {
    const { success, data } = await sendToBackground({
      name: "retrieve-data",
      body: {
        type: EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE
      }
    });
    return data;
  };

  const refreshOfPage = async () => {
    const { success, data } = await sendToBackground({
      name: "retrieve-data",
      body: {
        type: EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE
      }
    });
    return data;
  };

  const updateActivePage = useCallback(async () => {
    try {
      const activeTabUrl = await getActiveTabUrl();
      // logger.debug("updateActivePage", activeTabUrl)
      setCurrentUrl(activeTabUrl);
    } catch (error) {
      console.error("Failed to get the current page:", error);
    }
  }, []);

  useEffect(() => {
    updateActivePage();
  }, []);

  const onMessage = (message, sender, sendResponse) => {
    const { type } = message;
    switch (type) {
      case EXTENSION_MESSAGE_TYPES.URL_CHANGE_LISTENER: {
        const { payload } = message;
        setCurrentUrl(payload.newUrl);
        break;
      }
      case EXTENSION_MESSAGE_TYPES.CHECK_URL: {
        const { payload } = message;
        if (payload.newUrl !== currentUrl) {
          setCurrentUrl(payload.newUrl);
        }
        break;
      }
      default:
        // Handle other message types if necessary
        break;
    }
  };

  useEffect(() => {
    browserRuntime.onMessage.addListener(onMessage);

    return () => {
      browserRuntime.onMessage.removeListener(onMessage);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { success, data } = await sendToBackground({
        name: "retrieve-data",
        body: {
          type: EXTENSION_MESSAGE_TYPES.ADD_LISTENERS
        }
      });
      // logger.debug("ADD_LISTENERS", data, success)
      return data;
    };

    const intervalId = setInterval(async () => {
      const data = await fetchData();
      if (data && data > 0) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchAccount = async () => {
      if (jwtToken && accountId) {
        try {

          const accountData = await api.getAccount(jwtToken, accountId);
          console.log("accountData", accountData);
          setAccount(accountData);
          setCustomAccountName(getCustomAccountName(accountData));
          updateSelectedModel(accountData?.settings?.model);
          setAutoPlayState(accountData?.settings?.auto_play_state);
          setAutoGenerateResponseState(
            accountData?.settings?.auto_generate_response_state
          );

          // logger.debug("Account:", accountData);
          // logger.debug("Set account", accountData)
        } catch (error) {
          if (error.message.includes("401")) {
            // Perform logout action here
            logout();
          }
          console.log(error);
          console.error("Failed to fetch agency data:", error);
        }
      }
    };

    fetchAccount();
  }, [jwtToken, accountId]);

  useEffect(() => {
    const fetchData = async () => {
      setAccountIdIsLoading(true);
      try {
        const data = await api.retrieveDataFromPage();
        console.log("data", data);
        if (!data.accountId) {
          toast({
            title: "Opening OnlyFans page...",
            status: "loading",
            duration: 1000,
            isClosable: true,
            position: "bottom"
          });
          return;
        }
        setAccountId(data.accountId);
        setAccountName(data.accountName);
      } catch (error) {
    
        logger.debug(`Failed to fetch accountId ${error}`);
      } finally {
        setAccountIdIsLoading(false);
      }
    };

    const intervalId = setInterval(() => {
      if (!accountId) {
        fetchData();
      } else {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [accountId]);

  useEffect(() => {
    const fetchAgency = async () => {
      setIsLoading(true);
      if (jwtToken) {
        try {
          const agencyData = await api.getAgency(jwtToken);
          setAgency(agencyData);
          // logger.debug("Agency:", agencyData);
        } catch (error) {
          console.error("Failed to fetch agency data:", error);
        }
      }
      setIsLoading(false);
    };

    fetchAgency();
  }, [jwtToken]);

  const updateAccount = async (data) => {
    const accountData = await api.updateAccount(jwtToken, accountId, data);
    // logger.debug("Set account", accountData)
    setAccount(accountData.data);
  };

  const updateAgency = async (data) => {
    const agencyData = await api.updateAgency(jwtToken, data);
    setAgency(agencyData.data);
  };
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setIsFlashScreen(false);
  //   }, 2000);

  //   return () => clearTimeout(timeout);
  // }, []);

  // useEffect(() => {
  //   if (storedModel && !selectedModel) {
  //     setSelectedModel(storedModel);
  //   }
  // }, [storedModel]);

  const updateSelectedModel = (model: Model) => {
    // we want to store in local store selected model since there is some bug
    // setStoredModel(model);
    console.log("Model:", model)
    setSelectedModel(model);
  };

  const login = async ({
    jwtChatToken,
    jwtToken,
    memberUUID,
    email,
    voiceGenAbility
  }) => {
    setUserUUID(memberUUID);
    setJwtToken(jwtToken);
    setChatJwtToken(jwtChatToken);
    setChatter(email);
    setVoiceGenAbility(Boolean(voiceGenAbility));
    refreshOfPage();
  };

  const logout = () => {
    setJwtToken("");
    setUserUUID("");
    setChatJwtToken("");
    setCustomVaultId("");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      status: "success",
      duration: 1000,
      isClosable: true
    });
  };

  let component;

  if (isLoading || isLoadingGlobalNotifications) {
    component = <Loader />;
  } else {
    if (globalNotificationMode === "maintenance") {
      component = (
        <MaintenanceMode
          endTime={maintenanceTo}
          message={globalNotificationMessage}
        />
      );
    } else if (!jwtToken || jwtToken === "") {
      component = <Login onLoginSuccess={login} />;
    } else {
      component = <MainLayout logout={logout} />;
    }
  }

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <QueryClientProvider client={queryClient}>
        <CurrentPageContext.Provider
          value={{
            activePage,
            setActivePage,
            isDebugMode,
            setDebugMode,
            models,
            setModels,
            userId,
            setUserId,
            activeTab,
            setActiveTab,
            debugMessage,
            logger,
            selectedModel,
            setSelectedModel: updateSelectedModel,
            jwtToken,
            chatJwtToken,
            accountId,
            setAccountId,
            agency,
            updateAgency,
            payments,
            setPayments,
            account,
            updateAccount,
            currentUrl,
            setCurrentUrl,
            accountName,
            setAccountName,
            user,
            setUser,
            chatter,
            content,
            setContent,
            userUUID,
            shiftId,
            setShiftId,
            customVaultId,
            setCustomVaultId,
            lastFanSpend,
            setLastFanSpend,
            checkProcessingStatus,
            customAccountName,
            setCustomAccountName,
            autoPlayState,
            setAutoPlayState,
            expandSimulateBlock,
            setExpandSimulateBlock,
            autoGenerateResponseState,
            setAutoGenerateResponseState,
            refreshOfPage,
            voiceGenAbility,
            globalNotificationMode,
            globalNotificationMessage,
            maintenanceFrom,
            maintenanceTo
          }}
        >
          {component}
        </CurrentPageContext.Provider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

const IndexSidePanelWithErrorBoundary = () => (
  <ErrorBoundary>
    {/*<DragAndDrop />*/}
    <IndexSidePanel />
  </ErrorBoundary>
);

export default IndexSidePanelWithErrorBoundary;
