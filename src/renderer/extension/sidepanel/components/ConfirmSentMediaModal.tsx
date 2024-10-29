import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Image,
  Spinner,
  Progress
} from "@chakra-ui/react";
import React, { useState } from "react";
import { FadeLoader } from "react-spinners";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";
import { usePayments } from "../../sidepanel/hooks/usePayments";

import type { MediaItem } from "./MediaGrid";

interface ConfirmDragEndModalProps {
  isOpen: boolean;
  fileLoading: { status: string; progress: number | null };
  selectedMedia: number[];
  onClose: () => void;
  mediaItems: MediaItem[];
  refetchFolders: () => void;
  fetchMediaItems: () => void;
}

const ConfirmDragEndModal: React.FC<ConfirmDragEndModalProps> = ({
  isOpen,
  selectedMedia,
  onClose,
  mediaItems,
  refetchFolders,
  fetchMediaItems,
  fileLoading
}) => {
  const { account, customVaultId, agency, checkProcessingStatus } = useGlobal();
  const { linkPaymentToVault } = usePayments();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingInOF, setIsProcessingInOf] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      let isProcessing = await checkProcessingStatus();
      while (isProcessing) {
        setIsProcessingInOf(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        isProcessing = await checkProcessingStatus();
      }
      setIsProcessingInOf(false);
      await linkPaymentToVault({
        account,
        customVaultId,
        agency,
        selectedMedia
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      refetchFolders();
      fetchMediaItems();
      onClose();
    }
  };

  const selectedMediaItems = mediaItems.filter((item) =>
    selectedMedia.includes(item.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay zIndex="99998" />
      <ModalContent
        mt="18vh"
        p={4}
        borderRadius="10px"
        containerProps={{
          zIndex: "99999"
        }}
      >
        <ModalHeader display="flex" justifyContent="center" p={0}>
          <Text fontSize="16px" fontWeight={500}>
            Confirm media transfer
          </Text>
        </ModalHeader>
        <ModalBody px={0} py={1} display="flex" flexDirection="column" gap={4}>
          {/* {fileLoading && fileLoading.status === "loading" && (
            <Box width="100%" display="flex" alignItems="center">
              <Spinner size="sm" color="teal" mr={2} />
              <Progress
                value={fileLoading.progress || 0}
                size="lg"
                colorScheme="teal"
                flex="1"
              />
            </Box>
          )} */}

          <Text fontSize="12px" fontWeight={400} color="#606060">
            Are you sure you want to set the next media items as sent?
          </Text>
          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="center"
            width="100%"
            gap="10px"
            maxHeight="540px"
            overflowY="auto"
          >
            {selectedMediaItems.map((mediaItem) => (
              <Box
                key={mediaItem.id}
                borderWidth="1px"
                borderRadius="12px"
                overflow="hidden"
                width="160px"
                height="160px"
                justifyContent="center"
                alignItems="center"
                display="flex"
                bg="black"
              >
                {mediaItem.type === "image" && (
                  <Image src={mediaItem.media_url} alt={mediaItem.name} />
                )}
                {mediaItem.type === "video" && (
                  <Box as="video" src={mediaItem.media_url} />
                )}
                {mediaItem.type === "audio" && (
                  <audio controls src={mediaItem.media_url} />
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" justifyContent={isLoading ? "center" : ""}>
            {isLoading && <FadeLoader height={8} width={4} />}
            {!isLoading && (
              <Text fontSize="12px" fontWeight={400} color="#F45252">
                IMPORTANT: Before confirming the transfer of media files, be
                sure to click send and wait until the chat media is fully
                loaded. Only then confirm the transfer.
              </Text>
            )}
          </Box>
          {isProcessingInOF && (
            <Text color="#F45252" fontSize="12px" fontWeight={400}>
              Please wait until media is uploaded...
            </Text>
          )}
        </ModalBody>
        <ModalFooter
          px={0}
          pt={3}
          pb={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
        >
          <Button
            onClick={onClose}
            isDisabled={isLoading}
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
            _disabled={{
              backgroundColor: "#5449F6",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#360FFF"
            }}
            onClick={handleConfirm}
            isDisabled={isLoading}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDragEndModal;
