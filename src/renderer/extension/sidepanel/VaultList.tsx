import { Box, Button, useToast, Spinner } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { api } from "../sidepanel/api";
import { useGlobal } from "../sidepanel/hooks/useGlobal";

import CustomVaultMediaList from "./components/CustomVaultMediaList";

function VaultList() {
  const [showForm, setShowForm] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);
  const [isCheckingVault, setIsCheckingVault] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const toast = useToast();
  const { jwtToken, agency, account, customVaultId, setCustomVaultId } =
    useGlobal();

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const response = await api.getCustomVault(
          jwtToken,
          agency.settings.agency_id,
          account.name
        );
        if (response.status === "success") {
          setVaultExists(true);
          setCustomVaultId(response.custom_vault?.id);
        } else {
          setVaultExists(false);
          await createVault();
        }
      } catch (error) {
        toast({
          title: error.message,
          status: "error",
          duration: 1000,
          isClosable: true
        });
      } finally {
        setIsCheckingVault(false);
      }
    };

    if (jwtToken && agency?.settings?.agency_id && account?.name) {
      setIsCheckingVault(true);
      fetchVault();
    }
  }, [jwtToken, agency?.settings?.agency_id, account?.name]);

  const createVault = async () => {
    setIsCreatingVault(true);
    try {
      const reqData = {
        user_id: account.name,
        agency_id: agency.settings.agency_id
      };
      const response = await api.createCustomVault(jwtToken, reqData);
      if (response.success) {
        toast({
          title: "Vault created successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setVaultExists(true);
        setCustomVaultId(response.custom_vault);
      } else {
        toast({
          title: response.error,
          status: "error",
          duration: 1000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 1000,
        isClosable: true
      });
    } finally {
      setIsCreatingVault(false);
    }
  };

  if (!jwtToken || !agency?.settings?.agency_id || !account?.name)
    return <Spinner />;

  return (
    <div style={{ width: "100%" }}>
      {((isCheckingVault && !vaultExists) || isCreatingVault) && <Spinner />}
      {vaultExists && !isCheckingVault && !isCreatingVault && (
        <Box>
          <CustomVaultMediaList customVaultId={customVaultId} />
        </Box>
      )}
    </div>
  );
}

export default VaultList;
