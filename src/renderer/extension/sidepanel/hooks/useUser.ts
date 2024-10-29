import { useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import { useState, useEffect, useMemo } from "react";
import type { User } from "../../config/types";
import { sentry } from "../../sentryHelper";
import { api } from "../../sidepanel/api";

import { useGlobal } from "./useGlobal";
import { useMessages } from "./useMessages";

interface UseUserHookReturn {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  inputCustomUserName: string;
  setInputCustomUserName: React.Dispatch<React.SetStateAction<string>>;
  setUserData: (value: Partial<User>, force?: boolean) => void;
  updUserCustomName: () => void;
  updateUser: (userData: User) => Promise<User | undefined>;
  fetchUserError: unknown;
  fetchedUserData: any;
}

const useUserHook = (): UseUserHookReturn => {
  const { user, setUser, userId, account, jwtToken, content } = useGlobal();
  const [inputCustomUserName, setInputCustomUserName] = useState<string>(null);
  const toast = useToast();

  useEffect(() => {
    let customUsername = null;
    let username = null;
    if (content) {
      customUsername =
        content.customUsername && content.customUsername.length > 0
          ? content.customUsername
          : null;
      username = /\[.*\]/.test(content.username) ? null : content.username;
    }
    setUser((prevUser) => ({
      ...prevUser,
      currentUserName:
        prevUser?.custom_user_name || username || customUsername || userId
    }));
  }, [content, user?.custom_user_name, userId]);

  const { data: fetchedUserData, error: fetchUserError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.getUser(jwtToken, userId, account.uuid),
    enabled: !!userId && !!account?.uuid
  });

  const saveUserInfo = (newUser: User) => {
    api.updateUser(jwtToken, userId, account.uuid, newUser);
  };

  const debouncedSetUserData = debounce(saveUserInfo, 2000);

  const setUserData = (value: Partial<User>, force = false) => {
    const newUser = {
      ...user,
      ...value
    };
    setUser((prevUser) => ({ ...prevUser, ...newUser }));
    if (force) {
      saveUserInfo(newUser);
    } else {
      debouncedSetUserData(newUser);
    }
  };

  const updUserCustomName = () => {
    setUserData({ custom_user_name: inputCustomUserName });
    setInputCustomUserName(null);
  };

  const updateUser = async (userData: User): Promise<User | undefined> => {
    if (!userId || !account?.uuid) {
      toast({
        title: "Error",
        description: "User ID or Account UUID is missing",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return;
    }
    const response = await api.updateUser(jwtToken, userId, account.uuid, {
      ...user,
      ...userData
    });
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  };

  useEffect(() => {
    if (fetchedUserData) {
      if (fetchedUserData.success) {
        setUser(fetchedUserData.data);
      } else {
        toast({
          title: "Error",
          description: fetchedUserData.error,
          status: "error",
          duration: 1000,
          isClosable: true
        });
        sentry.captureException(fetchedUserData.error);
        console.error("Failed to fetch user data:", fetchedUserData.error);
      }
    }
  }, [fetchedUserData]);

  return {
    user,
    setUser,
    inputCustomUserName,
    setInputCustomUserName,
    setUserData,
    updUserCustomName,
    updateUser,
    fetchUserError,
    fetchedUserData
  };
};

export default useUserHook;
