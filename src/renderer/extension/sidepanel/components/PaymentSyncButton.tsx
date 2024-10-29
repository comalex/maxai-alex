import { RepeatIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";
import { SyncPaymentsIcon } from "../../icons";

interface PaymentSyncButtonProps {
  syncPayments: () => void;
}

export const PaymentSyncButton: React.FC<PaymentSyncButtonProps> = ({
  syncPayments
}) => (
  <HStack display="flex" gap={15}>
    <Tooltip label="Resync messages" aria-label="Resync Messages">
      <IconButton
        size="sm"
        aria-label="Resync messages"
        icon={<SyncPaymentsIcon width="24px" height="24px" />}
        onClick={syncPayments}
        backgroundColor="white"
        border="1px solid #E8E8E8"
        borderRadius="10px"
        px={4}
        py={5}
      />
    </Tooltip>
  </HStack>
);
