import {
  Button,
  Textarea,
  useToast,
  FormControl,
  FormLabel,
  Text
} from "@chakra-ui/react";
import React, { useState } from "react";

import { api } from "./api";
import { useGlobal } from "./hooks/useGlobal";

export function getProcessedUserMessageSettings(
  blank_user_message_settings?: string,
  name?: string
): string {
  let msg =
    blank_user_message_settings ||
    "<blank> INFORMATION: [usr] didn't respond to XOT's last message. XOT tries to restart dialogue with a seductive message ENDINFORMATION";
  // const processedName = (name || "XOT").toUpperCase();
  const processedName = name || "XOT";
  const finalName = processedName.replace(/AI$/, "");
  return msg.replace(/XOT/g, finalName);
}

function AIModelSettings() {
  const { selectedModel, jwtToken, agency, updateAgency, setSelectedModel } =
    useGlobal();
  // const [context, setContext] = useState("");
  const [blankUserMessageSettings, setBlankUserMessageSettings] =
    useState<string>(agency?.settings?.blank_user_message_settings || "");
  const toast = useToast();

  // useEffect(() => {
  //   if (selectedModel && selectedModel.y) {
  //     setContext(selectedModel.y);
  //   }
  // }, [selectedModel]);

  const handleSave = async () => {
    if (!selectedModel) {
      toast({
        title: "Please select an AI Model",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return;
    }

    try {
      await updateAgency({
        ...agency,
        settings: {
          ...agency.settings,
          blank_user_message_settings: blankUserMessageSettings
        }
      });

      await api.forceUpdateSettings(jwtToken);

      toast({
        title: "Agency settings updated successfully",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title:
          error.message ||
          "An unexpected error occurred while updating AI Model Context and WhatsApp Group Name",
        status: "error",
        duration: 1000,
        isClosable: true
      });
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {selectedModel && (
        <Text fontSize="md" color="gray.700" mb="1rem">
          Model: {selectedModel?.name}
        </Text>
      )}
      {/* <ModelSelect /> */}
      {/* <Textarea
        placeholder="AI Model Context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        style={{ marginBottom: "1rem", height: "200px" }}
      /> */}

      <FormControl style={{ marginBottom: "1rem" }}>
        <FormLabel>Blank User Message</FormLabel>
        <Textarea
          placeholder="Enter the message for when the user didn't respond"
          value={blankUserMessageSettings}
          onChange={(e) => setBlankUserMessageSettings(e.target.value)}
          style={{ height: "100px" }}
        />
      </FormControl>
      <Text fontSize="xs" color="gray.500" mb="1rem">
        {getProcessedUserMessageSettings(
          blankUserMessageSettings,
          selectedModel?.name
        )}
      </Text>
      <Button onClick={handleSave} colorScheme="teal" variant="solid">
        Save
      </Button>
    </div>
  );
}

export default AIModelSettings;
