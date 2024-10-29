import { InfoIcon } from "@chakra-ui/icons";
import { Box, Text } from "@chakra-ui/react";
import React from "react";

interface PageInfoProps {
  title: string;
  text: string;
}

const PageInfo: React.FC<PageInfoProps> = ({ title, text }) => {
  return (
    <>
      <Text fontSize="2xl" fontWeight="bold">
        {title}
      </Text>
      <Box
        border="1px"
        borderColor="gray.300"
        backgroundColor="gray.50"
        p={3}
        borderRadius="md"
        display="flex"
        alignItems="center"
      >
        <InfoIcon color="gray.500" mr={2} />
        <Text fontSize="sm" color="gray.600">
          {text}
        </Text>
      </Box>
    </>
  );
};

export default PageInfo;
