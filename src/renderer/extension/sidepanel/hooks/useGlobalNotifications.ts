import { useEffect, useState } from "react";
import { api } from "../../sidepanel/api";

type useGlobalNotificationsType = {
  global_notification_message: string | null;
  global_notification_mode: "maintenance" | "disabled" | "reminder";
  maintenance_from: string | null;
  maintenance_to: string | null;
  isLoadingGlobalNotifications: boolean;
};
export const useGlobalNotifications = (
  refetchInterval = 30000
): useGlobalNotificationsType => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    global_notification_message: string | null;
    global_notification_mode: "maintenance" | "disabled" | "reminder";
    maintenance_from: string | null;
    maintenance_to: string | null;
  } | null>(null);

  const fetchData = async () => {
    try {
      const response = await api.getGlobalNotifications();
      setData(response.data);
    } catch (error) {
      setData({
        global_notification_mode: "maintenance",
        global_notification_message: null,
        maintenance_to: null,
        maintenance_from: null
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval]);

  return {
    global_notification_mode: data?.global_notification_mode ?? "disabled",
    global_notification_message: data?.global_notification_message ?? null,
    maintenance_from: data?.maintenance_from ?? null,
    maintenance_to: data?.maintenance_to ?? null,
    isLoadingGlobalNotifications: isLoading
  };
};
