import { useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../../sidepanel/api";

import { useGlobal } from "./useGlobal";

const useMember = () => {
  const { jwtToken, setShiftId } = useGlobal();
  const toast = useToast();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["chat-member"],
    queryFn: async () => {
      const response = await api.getMember(jwtToken);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!jwtToken,
    refetchInterval: 10000
  });

  useEffect(() => {
    if (data) {
      console.log("shiftId data", data);
      setShiftId(data.current_shift_id);
    }
  }, [data]);

  if (error) {
    toast({
      title: "Error",
      description: error.message,
      status: "error",
      duration: 1000,
      isClosable: true
    });
  }

  return { data, error, isLoading, refetch };
};

export default useMember;
