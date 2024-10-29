import { Box, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

const ClockOutButton = () => {
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
    <Box width="100%">
      {isClockedIn && (
        <Button
          width="100%"
          variant="unstyled"
          display="flex"
          p={4}
          borderRadius="10px"
          backgroundColor="#2F3341"
          color="white"
          onClick={handleClockOut}
          isDisabled={clockingOut}
          _disabled={{
            backgroundColor: "#2F3341",
            opacity: "30%"
          }}
          _hover={{
            backgroundColor: "#2F3341"
          }}
        >
          {clockingOut ? "Clocking Out..." : "Clock Out"}
        </Button>
      )}
    </Box>
  );
};

export default ClockOutButton;
