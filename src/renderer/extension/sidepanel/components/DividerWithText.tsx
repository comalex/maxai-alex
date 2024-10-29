import { Divider, Text, Flex } from "@chakra-ui/react";
import React from "react";

const DividerWithText = ({ children }) => {
  return (
    <Flex align="center" width="100%" gap={2}>
      <Divider borderColor="#7C7C7C" />
      <Text px={4} color="#7C7C7C" fontWeight={400} fontSize="13px">
        {children}
      </Text>
      <Divider borderColor="#7C7C7C" />
    </Flex>
  );
};

export default DividerWithText;
