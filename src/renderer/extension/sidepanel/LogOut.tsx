import { Box, Button, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { api } from "./api";
import { useGlobal } from "./hooks/useGlobal";

const LogOutButton = ({ logout }) => {
  const { jwtToken, userId: user_id, shiftId } = useGlobal();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  useEffect(() => {
    if (shiftId) {
      setIsClockedIn(true);
    } else {
      setIsClockedIn(false);
    }
  }, [shiftId]);

  const handleClockOut = async () => {
    setClockingOut(true);
    await api.manageShift({
      jwtToken,
      clock: "clock_out",
      ofUserId: user_id,
      endTime: new Date().toISOString(),
      shiftId: shiftId
    });
    setIsClockedIn(false);
    window.location.reload();
  };

  return (
    <Box>
      <Text
        fontSize="sm"
        color="red.500"
        fontWeight="bold"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "50px"
        }}
      >
        Are you sure you want to log out?
      </Text>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginTop: "50px"
        }}
      >
        {isClockedIn && (
          <Button
            colorScheme="red"
            onClick={handleClockOut}
            isDisabled={clockingOut}
          >
            {clockingOut ? "Clocking Out..." : "Clock Out"}
          </Button>
        )}
        <Button
          isDisabled={clockingOut}
          onClick={async () => {
            if (shiftId) {
              await handleClockOut();
            }
            logout();
          }}
        >
          {isClockedIn ? "Clock Out and Logout" : "Logout"}
        </Button>
      </div>
    </Box>
  );
};

export default LogOutButton;
