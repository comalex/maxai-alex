import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../../../sidepanel/api";
import { useGlobal } from "../../../sidepanel/hooks/useGlobal";

type InactiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refetchMember: () => Promise<any>;
};

const InactiveModal: React.FC<InactiveModalProps> = ({
  isOpen,
  onClose,
  refetchMember
}) => {
  const { jwtToken, userId: user_id, shiftId } = useGlobal();
  const [clockingOut, setClockingOut] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisableButtons, setIsDisableButtons] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClockOut = async () => {
    setClockingOut(true);
    await api.manageShift({
      jwtToken,
      clock: "clock_out",
      ofUserId: user_id,
      endTime: new Date().toISOString(),
      shiftId: shiftId
    });
    await refetchMember();
    setClockingOut(false);
  };

  const handleContinueWork = async () => {
    setIsLoading(true);
    await api.updateLastActivity(jwtToken);
    await refetchMember();
    setIsLoading(false);
  };

  // Function to start the timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeLeft(100); // Reset timer to 120 seconds
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          setIsDisableButtons(true); // Auto clock out when time runs out
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      startTimer(); // Start countdown when modal opens
    } else {
      clearInterval(timerRef.current!); // Stop the timer if modal is closed
      setTimeLeft(100); // Reset timer when modal is closed
      setIsDisableButtons(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current); // Cleanup timer on unmount
      }
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={"350px"}>
        <ModalHeader pb={0} textAlign={"center"}>
          <Text fontSize={"18px"} fontWeight={"500"}>
            You’ve been inactive for 10 minutes
          </Text>
        </ModalHeader>
        <ModalBody
          pt={1}
          px={4}
          gap={4}
          display={"flex"}
          flexDirection={"column"}
          color={"#606060"}
        >
          <Text fontSize={"xs"}>
            Your session about to expire in {timeLeft} seconds due to
            inactivity.
          </Text>
          <Text fontSize={"xs"}>Do you want to continue?</Text>
        </ModalBody>

        <ModalFooter display={"flex"} gap={4}>
          <Button
            onClick={handleClockOut}
            isDisabled={clockingOut || isLoading || isDisableButtons}
            isLoading={clockingOut}
            width={"50%"}
            fontWeight={500}
            textColor="#5449F6"
            borderRadius="10px"
            border="2px solid #5449F6"
            _hover={{
              backgroundColor: "#CFE0FC"
            }}
          >
            No
          </Button>
          <Button
            width={"50%"}
            backgroundColor="#5449F6"
            color="white"
            _disabled={{
              backgroundColor: "#5449F6",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#360FFF"
            }}
            onClick={handleContinueWork}
            isDisabled={clockingOut || isLoading || isDisableButtons}
            isLoading={isLoading}
          >
            Yes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InactiveModal;
