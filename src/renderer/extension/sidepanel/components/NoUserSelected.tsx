import { RepeatIcon, WarningIcon } from "@chakra-ui/icons";
import { Box, IconButton, Text } from "@chakra-ui/react";
import React from "react";
import { useMessages } from "../../sidepanel/hooks/useMessages";

const NoUserSelected: React.FC = () => {
  const { getMessagesContent } = useMessages();
  return (
    <Box
      display="flex"
      alignItems="center"
      backgroundColor="yellow.100"
      p={2}
      borderRadius="md"
    >
      <WarningIcon color="orange.500" mr={2} />
      <Text fontSize="sm" color="orange.500" fontWeight="bold">
        Please select a chat thread on the Chat Tab, then click Sync{" "}
        <IconButton
          aria-label="Sync"
          icon={<RepeatIcon />}
          size="sm"
          colorScheme="gray"
          onClick={getMessagesContent}
        />
      </Text>
    </Box>
  );
};

export default NoUserSelected;
