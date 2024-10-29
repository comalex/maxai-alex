import { Center, Flex, Spinner, Text } from "@chakra-ui/react";
import React from "react";

const MainLoader: React.FC = () => {
  return (
    <Center h={`calc(100vh - 220px)`}>
      <Flex
        alignItems={"center"}
        justifyContent={"center"}
        flexDirection={"column"}
        gap={4}
      >
        {/*<Text textAlign="center">Loading...</Text>*/}
        <Spinner size="lg" />
        <Text textAlign={"center"} fontSize="sm" color="gray.500">
          If loading takes a long time, please refresh the page and reopen the
          extension.
        </Text>
      </Flex>
    </Center>
  );
};

export default MainLoader;
