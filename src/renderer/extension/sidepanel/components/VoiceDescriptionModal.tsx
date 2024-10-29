import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  useToast
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";
import { useMessages } from "../../sidepanel/hooks/useMessages";

interface VoiceDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

const VoiceDescriptionModal: React.FC<VoiceDescriptionModalProps> = ({
  isOpen,
  onClose,
  text
}) => {
  const {
    userId: user_id,
    account,
    agency,
    jwtToken,
    checkProcessingStatus
  } = useGlobal();
  const { getMessagesContent } = useMessages();
  const [savingDescription, setSavingDescription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textDescription, setTextDescription] = useState(text);
  const toast = useToast();
  const saveProcessRef = useRef<Promise<void> | null>(null);
  const [warningMessage, setWarningMessage] = useState(false);

  useEffect(() => {
    setTextDescription(text);
  }, [text]);

  const saveDescription = async () => {
    let content = await getMessagesContent();
    const messages = content?.messages;
    const message = [...messages]
      ?.reverse()
      .find(
        (msg) => msg.role === "influencer" && msg.content.includes("audio>")
      );
    const messageWithDescription = {
      ...message,
      attachments: JSON.stringify(message.attachments),
      description: textDescription,
      user_id,
      external_id: message.id,
      agency_uuid: agency.uuid,
      account_uuid: account.uuid
    };
    try {
      await api.savePostMedia(jwtToken, [messageWithDescription]);
      toast({
        title: "Success",
        description: "Description saved",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    } catch (error) {
      console.error("Error storing message with description", error);
      toast({
        title: "Error",
        description: error.toString(),
        status: "error",
        duration: 1000,
        isClosable: true
      });
    } finally {
      setSavingDescription(false);
      onClose();
    }
  };

  const onModalSave = async () => {
    setWarningMessage(false);
    setSavingDescription(true);

    let isProcessing = await checkProcessingStatus();
    if (isProcessing) {
      setIsProcessing(true);
      while (isProcessing) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        isProcessing = await checkProcessingStatus();
      }
      setIsProcessing(false);
      await saveDescription();
    } else {
      let content = await getMessagesContent();
      const lastMessage = content?.messages
        ? [...content.messages]
            .reverse()
            .slice(0, 2)
            .find(
              (m) => m.role === "influencer" && m.content.includes("audio>")
            )
        : null;
      if (lastMessage) {
        await saveDescription();
      } else {
        setWarningMessage(true);
        setSavingDescription(false);
      }
    }
  };

  useEffect(() => {
    if (saveProcessRef.current) {
      saveProcessRef.current = null;
      setSavingDescription(false);
      setIsProcessing(false);
      onClose();
    }
  }, [user_id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <ModalOverlay zIndex="99998" />
      <ModalContent
        mt="18vh"
        borderRadius="18px"
        p={4}
        containerProps={{
          zIndex: "99999"
        }}
      >
        <ModalHeader display="flex" justifyContent="center" p={0}>
          <Text fontSize="16px" fontWeight={500}>
            Save audio description
          </Text>
        </ModalHeader>
        <ModalBody
          mt={2}
          px={0}
          py={1}
          display="flex"
          flexDirection="column"
          gap={4}
        >
          <Text fontSize="12px" fontWeight={400} color="#606060">
            Are you sure you want to save this text (that you just typed to
            generate audio) as audio description?
          </Text>
          <Text fontSize="12px" fontWeight={400} color="#F45252">
            IMPORTANT: Click Save button only after you have sent the audio
            message. Be sure to wait until the audio message is fully loaded
            into the chat message scope, only then you can save the description
            for your audio correctly
          </Text>
          <Box fontSize="15px" fontWeight={400}>
            Description to save:
          </Box>
          <Textarea
            variant="unstyled"
            placeholder="Write a description about the media here"
            borderRadius="16px"
            border="1px solid #E8E8E8"
            backgroundColor="#FFFDFD"
            p={4}
            style={{
              resize: "none",
              width: "100%",
              height: "100px",
              overflow: "auto"
            }}
            value={textDescription}
            onChange={(e) => setTextDescription(e.target.value)}
          />
          {warningMessage && (
            <Box
              fontSize="12px"
              fontWeight={400}
              color="#F45252"
              textAlign="center"
            >
              You must send the audio message first before saving the
              description
            </Box>
          )}
        </ModalBody>
        <ModalFooter width="100%" display="flex" flexDirection="column" gap={4}>
          {isProcessing ? (
            <Box
              display="flex"
              gap={2}
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              Please wait until audio is uploaded... <Spinner size="sm" />
            </Box>
          ) : savingDescription ? (
            <Box
              display="flex"
              gap={2}
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              Saving, please wait... <Spinner size="sm" />
            </Box>
          ) : null}
          <HStack width="100%">
            <Button
              variant="unstyled"
              width="100%"
              p={2}
              borderRadius="10px"
              border="2px solid #5449F6"
              backgroundColor="#F1F6FE"
              fontSize="16px"
              fontWeight={500}
              color="#5449F6"
              display="flex"
              alignItems="center"
              _hover={{
                backgroundColor: "#CFE0FC"
              }}
              onClick={() => {
                saveProcessRef.current = null;
                setSavingDescription(false);
                setIsProcessing(false);
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="unstyled"
              backgroundColor="#5449F6"
              borderRadius="10px"
              color="white"
              width="100%"
              py="8px"
              px="16px"
              display="flex"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
              _disabled={{
                backgroundColor: "#5449F6",
                opacity: "30%"
              }}
              _hover={{
                backgroundColor: "#360FFF"
              }}
              onClick={onModalSave}
              isLoading={savingDescription}
            >
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VoiceDescriptionModal;
