import { Center, Spinner, Text } from "@chakra-ui/react";
import moment from "moment";
import React from "react";

type MaintenanceModeProps = {
  endTime?: string;
  message?: string;
};
const MaintenanceMode: React.FC<MaintenanceModeProps> = ({
  endTime,
  message
}) => {
  return (
    <Center height="100vh" flexDirection="column">
      <Spinner size="xl" mb={4} />
      <Text fontSize="xl" fontWeight="bold">
        We are currently in maintenance mode.
      </Text>
      {message && (
        <Text fontSize="lg" mt={2}>
          {message}
        </Text>
      )}
      {endTime && (
        <Text textAlign={"center"} fontSize="lg" mt={2}>
          The service will be back online by{" "}
          {moment(endTime).utc().format("DD/MM/YYYY HH:mm:ss")} UTC.
        </Text>
      )}
    </Center>
  );
};

export default MaintenanceMode;
