import { ViewIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Code,
  VStack,
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

interface DebugProps {}

const Debug: React.FC<DebugProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMessage, setModalMessage] = useState<string[]>([]);

  const { debugMessage, logger, setDebugMode } = useGlobal();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatMessage = (message: string) => {
    try {
      const json = JSON.parse(message);
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return message;
    }
  };

  const openModal = (message) => {
    const parts = message.split("::");
    const formattedParts = parts.map((part) => formatMessage(part));
    setModalMessage(formattedParts);
    onOpen();
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="sm" color="green.500" fontWeight="bold">
          Debug Mode Enabled
        </Text>
        <Button
          onClick={() => setDebugMode(false)}
          bg="red"
          color="white"
          p="5px 10px"
          borderRadius="5px"
          cursor="pointer"
          disabled
        >
          <span>Disable Debug Mode</span>
        </Button>
        {"      "}
        <Button
          onClick={() => logger.clean()}
          bg="blue"
          color="white"
          p="5px 10px"
          borderRadius="5px"
          cursor="pointer"
        >
          <span>Clear</span>
        </Button>
      </Box>
      <Box>
        <pre>
          {debugMessage?.map((message, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                backgroundColor:
                  hoveredIndex === index ? "#d3d3d3" : "transparent"
              }}
            >
              {hoveredIndex === index && (
                <IconButton
                  onClick={() => openModal(message)}
                  icon={<ViewIcon />}
                  bg="gray.500"
                  color="white"
                  size="xs"
                  borderRadius="3px"
                  cursor="pointer"
                  marginLeft="5px"
                  aria-label="Format Message"
                />
              )}
              <Code
                as="button"
                onClick={() => openModal(message)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {index}: {message.replace("::", " ")}
              </Code>
              <br />
            </div>
          ))}
        </pre>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay zIndex="99998" />
        <ModalContent
          mt="18vh"
          containerProps={{
            zIndex: "99999"
          }}
        >
          <ModalHeader>Formatted Message</ModalHeader>
          <ModalCloseButton color="red" />
          <ModalBody>
            <pre>
              {modalMessage.map((line, index) => (
                <div
                  key={index}
                  style={{ maxWidth: "100%", whiteSpace: "pre-wrap" }}
                >
                  {line}
                </div>
              ))}
            </pre>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
export default Debug;
