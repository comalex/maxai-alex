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
import React, { useState } from "react";
import { api } from "../../../sidepanel/api";
import { useGlobal } from "../../../sidepanel/hooks/useGlobal";

type InactiveErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refetchMember: () => Promise<any>;
};

const InactiveErrorModal: React.FC<InactiveErrorModalProps> = ({
  isOpen,
  onClose,
  refetchMember
}) => {
  const { jwtToken } = useGlobal();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleOkClick = async () => {
    try {
      setIsLoading(true);
      await api.closeActivityErrorModal(jwtToken);
      await refetchMember();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={"350px"}>
        <ModalHeader pb={0} textAlign={"center"}>
          <Text fontSize={"18px"} fontWeight={"500"}>
            Inactivity detected
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
            You have been automatically clocked out due to inactivity.
          </Text>
        </ModalBody>

        <ModalFooter px={4}>
          <Button
            onClick={handleOkClick}
            isDisabled={isLoading}
            isLoading={isLoading}
            width={"100%"}
            fontWeight={500}
            backgroundColor="#5449F6"
            color="white"
            borderRadius={"10px"}
            _disabled={{
              backgroundColor: "#5449F6",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#360FFF"
            }}
          >
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InactiveErrorModal;
