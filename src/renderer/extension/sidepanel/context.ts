import React, { createContext } from "react";
import {
  PageName,
  type Model,
  type Logger,
  type Agency,
  type Message,
  type PaymentResponse,
  type Account,
  type User
} from "../config/types";

export type GlobalContext = {
  activePage: PageName;
  setActivePage: React.Dispatch<React.SetStateAction<PageName>>;
  isDebugMode: boolean;
  setDebugMode: React.Dispatch<React.SetStateAction<boolean>>;
  models: Model[];
  setModels: React.Dispatch<React.SetStateAction<any[]>>;
  userId?: string;
  setUserId: (user_id: string) => void;
  activeTab: PageName | null;
  setActiveTab: React.Dispatch<React.SetStateAction<PageName>>;
  debugMessage: string[] | null;
  logger: Logger;
  selectedModel: Model | null;
  setSelectedModel: (model: Model | null) => void;
  jwtToken?: string;
  chatJwtToken?: string;
  accountId: string | null;
  setAccountId: (accountId: string | null) => void;
  accountName: string | null;
  setAccountName: React.Dispatch<React.SetStateAction<string | null>>;
  agency: Agency | null;
  updateAgency: (agency: Agency) => void;
  payments: PaymentResponse;
  setPayments: React.Dispatch<React.SetStateAction<PaymentResponse>>;
  account: Account | null;
  updateAccount: (agency: Account) => void;
  currentUrl: string | null;
  setCurrentUrl: React.Dispatch<React.SetStateAction<string | null>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  chatter?: string;
  content?: Message | null;
  setContent: React.Dispatch<React.SetStateAction<Message | null>>;
  userUUID: string | null;
  shiftId: string;
  setShiftId: (id: string) => void;
  lastFanSpend: number;
  setLastFanSpend: (id: number) => void;
  customVaultId: number | string | null;
  setCustomVaultId: (id: number | string | null) => void;
  checkProcessingStatus: () => Promise<boolean>;
  customAccountName: string | null;
  setCustomAccountName: React.Dispatch<React.SetStateAction<string | null>>;
  autoPlayState: boolean;
  setAutoPlayState: React.Dispatch<React.SetStateAction<boolean>>;
  expandSimulateBlock: boolean;
  setExpandSimulateBlock: React.Dispatch<React.SetStateAction<boolean>>;
  autoGenerateResponseState: boolean;
  setAutoGenerateResponseState: React.Dispatch<React.SetStateAction<boolean>>;
  refreshOfPage: () => void;
  voiceGenAbility: boolean;
  globalNotificationMode: string;
  globalNotificationMessage: string | null;
  maintenanceFrom: string | null;
  maintenanceTo: string | null;
};

export const CurrentPageContext = createContext<GlobalContext>({
  activePage: null,
  setActivePage: () => {},
  isDebugMode: false,
  setDebugMode: () => {},
  models: [],
  setModels: () => {},
  userId: null,
  setUserId: () => {},
  activeTab: PageName.Message,
  setActiveTab: () => {},
  debugMessage: null,
  logger: {
    debug: () => {},
    clean: () => {}
  },
  selectedModel: null,
  setSelectedModel: () => {},
  jwtToken: null,
  chatJwtToken: null,
  accountId: null,
  setAccountId: () => {},
  accountName: null,
  setAccountName: () => {},
  agency: null,
  updateAgency: async () => {},
  payments: null,
  setPayments: () => {},
  account: null,
  updateAccount: async () => {},
  currentUrl: null,
  setCurrentUrl: () => {},
  user: null,
  setUser: () => {},
  chatter: null,
  content: null,
  setContent: () => {},
  userUUID: null,
  shiftId: null,
  setShiftId: () => {},
  customVaultId: null,
  setCustomVaultId: () => {},
  lastFanSpend: null,
  setLastFanSpend: () => {},
  customAccountName: null,
  setCustomAccountName: () => {},
  checkProcessingStatus: async () => false,
  autoPlayState: false,
  setAutoPlayState: () => {},
  expandSimulateBlock: false,
  setExpandSimulateBlock: () => {},
  autoGenerateResponseState: false,
  setAutoGenerateResponseState: () => {},
  refreshOfPage: () => {},
  voiceGenAbility: false,
  globalNotificationMode: "disabled",
  globalNotificationMessage: null,
  maintenanceFrom: null,
  maintenanceTo: null
});
