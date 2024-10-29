import { useEffect } from "react";
import { sendNotificationToSlack } from "../../services/utils";

import { useGlobal } from "./useGlobal";

interface TimeoutNotificationParams {
  loading: boolean;
  msg?: string;
  timeoutDuration?: number;
}

const useTimeoutNotification = ({
  loading,
  msg = "error",
  timeoutDuration = 20000
}: TimeoutNotificationParams) => {
  const { logger, account, chatter, agency } = useGlobal();
  useEffect(() => {
    let timer;

    if (loading) {
      timer = setTimeout(() => {
        logger.debug(
          "Error: isGeneratingResponse was not set to false within the expected time frame."
        );
        sendNotificationToSlack(
          `Agency ID: ${agency?.name}, Account ID: ${account?.name}, Chatter: ${chatter}: ${msg}`
        );
      }, timeoutDuration);
    }

    return () => clearTimeout(timer);
  }, [loading]);
};

export default useTimeoutNotification;
