import { Box, Flex, Text } from "@chakra-ui/react";
import React from "react";

type MaintenanceMessageProps = {
  text: string;
};
const MaintenanceMessage: React.FC<MaintenanceMessageProps> = ({ text }) => {
  return (
    <Flex
      p={2}
      width={"100%"}
      bg={
        "linear-gradient(0deg, rgba(255, 255, 255, 0.80) 0%, rgba(255, 255, 255, 0.80) 100%), var(--info-blue, #3281F1)"
      }
      alignItems={"center"}
    >
      <Flex gap={2} alignItems={"center"} justifyContent={"center"}>
        <Text fontSize={"30px"}>👷</Text>
        <Box fontSize={14} fontWeight={500}>
          <Text>{text}</Text>
          {/*<Text>11AM-11:15 PDT</Text>*/}
        </Box>
      </Flex>
    </Flex>
  );
};

export default MaintenanceMessage;
