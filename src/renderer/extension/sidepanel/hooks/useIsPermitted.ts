import { useState, useEffect } from "react";
import { PERMITTED_ROLES } from "../../config/constants";
import { api } from "../../sidepanel/api";

import { useGlobal } from "./useGlobal";

export const useIsPermitted = (ROLES: number[] | null = null) => {
  const { jwtToken } = useGlobal();
  const [isPermitted, setIsPermitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getUserAccount(jwtToken);
        if (response.success && response.data?.role) {
          const rolesToCheck = ROLES ?? PERMITTED_ROLES;
          setIsPermitted(rolesToCheck.includes(response.data.role_id));
        } else {
          setError("Failed to fetch user role from server");
        }
      } catch (error) {
        setError("Error fetching user role: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (jwtToken) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [jwtToken]);

  return { isPermitted, loading, error };
};
