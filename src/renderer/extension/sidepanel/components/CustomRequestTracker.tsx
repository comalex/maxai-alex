import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon
} from "@chakra-ui/icons";
import {
  Box,
  Table,
  Tbody,
  Td,
  Text,
  Thead,
  Tooltip,
  Tr
} from "@chakra-ui/react";
import React, { useState } from "react";
import type { CustomRequest } from "../../config/types";

interface CustomRequestsTrackerProps {
  customRequests: CustomRequest[];
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CustomRequestsTracker({
  customRequests
}: CustomRequestsTrackerProps) {
  const [showCustomRequests, setShowCustomRequests] = useState<boolean>(false);

  return (
    <>
      <Box mt={4} backgroundColor="white" p={4} borderRadius="10px">
        <Text
          color="teal"
          width="full"
          fontSize="md"
          fontWeight={500}
          cursor="pointer"
          onClick={() => setShowCustomRequests(!showCustomRequests)}
        >
          Custom Requests Tracker
          {showCustomRequests ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Text>
        {showCustomRequests && (
          <Box maxHeight="350px" overflowY="scroll">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    №
                  </Td>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    User Name
                  </Td>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    Amount
                  </Td>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    Due Date
                  </Td>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    Title
                  </Td>
                  <Td p={1} fontSize="xs" fontWeight={500}>
                    Status
                  </Td>
                </Tr>
              </Thead>
              <Tbody>
                {customRequests.map(
                  (customRequest: CustomRequest, index: number) => {
                    const customRequestAmount = customRequest.turnaround_price
                      ? Number(customRequest.base_price) +
                        Number(customRequest.turnaround_price)
                      : Number(customRequest.base_price);
                    return (
                      <Tr key={index}>
                        <Td p={1}>{index + 1}</Td>
                        <Td p={1}>{customRequest.user_name}</Td>
                        <Td p={1}>{customRequestAmount}</Td>
                        <Td p={1}>
                          {formatDate(customRequest.promised_delivery_date)}
                        </Td>
                        <Td p={1}>{customRequest.title}</Td>
                        <Td p={1}>
                          <Tooltip
                            label={customRequest.completed_status}
                            aria-label={customRequest.completed_status}
                          >
                            {customRequest.completed_status === "Completed" ? (
                              <CheckIcon color="green.500" />
                            ) : (
                              <CloseIcon color="red.500" />
                            )}
                          </Tooltip>
                        </Td>
                      </Tr>
                    );
                  }
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </>
  );
}
