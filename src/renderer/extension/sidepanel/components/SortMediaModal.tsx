import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  Image,
  HStack,
  Text,
  VStack
} from "@chakra-ui/react";
import { Icon } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { SORT_MEDIA_MODAL_KEYS } from "../../config/constants";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import type { MediaItem } from "./MediaGrid";

export const AudioIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
  </Icon>
);

type SortMediaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  setMediaItems: (mediaItems: MediaItem[]) => void;
  fetchMediaItems: () => void;
  sortMediaModalKey: string;
  folderId?: string | number;
};

const SortMediaModal = ({
  isOpen,
  onClose,
  mediaItems,
  setMediaItems,
  fetchMediaItems,
  sortMediaModalKey,
  folderId
}: SortMediaModalProps) => {
  const { jwtToken } = useGlobal();
  const toast = useToast();
  const [localMediaItems, setLocalMediaItems] = useState(mediaItems);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalMediaItems(mediaItems);
    }
  }, [isOpen, mediaItems]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localMediaItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedMediaItemsWithOrder = items.map((item, idx) => {
      if (typeof item !== "object" || item === null) {
        throw new Error("Item must be an object");
      }
      return {
        ...item,
        order_index: idx + 1
      } as MediaItem;
    });

    setLocalMediaItems(updatedMediaItemsWithOrder);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      let response:
        | { success: boolean; message: string; error?: undefined }
        | { success: boolean; error: any; message?: undefined };
      if (sortMediaModalKey === SORT_MEDIA_MODAL_KEYS.FOLDER_MEDIA) {
        response = await api.updateFolderMediaOrder(
          jwtToken,
          localMediaItems,
          folderId
        );
      } else if (sortMediaModalKey === SORT_MEDIA_MODAL_KEYS.MEDIA) {
        response = await api.updateMediaOrder(jwtToken, localMediaItems);
      }
      if (response.success) {
        toast({
          title: "Order updated successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setMediaItems(localMediaItems);
        fetchMediaItems();
      } else {
        toast({
          title: response.error,
          status: "error",
          duration: 1000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 1000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay zIndex="99998" />
      <ModalContent
        mt="18vh"
        containerProps={{
          zIndex: "99999"
        }}
      >
        <ModalHeader>Sort Media</ModalHeader>
        <ModalBody maxHeight="400px" overflow="hidden" overflowY="scroll">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="mediaItems">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {localMediaItems.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          p={2}
                          mb={2}
                          borderWidth="1px"
                          borderRadius="lg"
                          bg="white"
                        >
                          <HStack>
                            {item.type === "image" && (
                              <Box
                                width="200px"
                                maxHeight="100px"
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                <Image
                                  src={item.media_url}
                                  alt={item.name}
                                  width="100%"
                                  maxHeight="100%"
                                />
                              </Box>
                            )}
                            {item.type === "video" && (
                              <Box
                                width="200px"
                                maxHeight="100px"
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                <Box
                                  as="video"
                                  src={item.media_url}
                                  width="100%"
                                  maxHeight="100%"
                                />
                              </Box>
                            )}
                            {item.type === "audio" && (
                              <Box
                                width="200px"
                                minHeight="80px"
                                borderRadius="lg"
                                overflow="hidden"
                                border="1px solid lightGray"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                backgroundColor="black"
                              >
                                {/* <AudioIcon boxSize={12} color="blue.500" /> */}
                                <Box
                                  as="audio"
                                  src={item.media_url}
                                  width="100%"
                                  minHeight="100%"
                                  color="black"
                                />
                              </Box>
                            )}
                            <Box
                              width="100%"
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                            >
                              <VStack>
                                <Text fontSize="sm" color="gray.500">
                                  Type: {item.type}
                                </Text>
                                <Text fontSize="md" fontWeight="bold">
                                  {item.name}
                                </Text>
                                <Text
                                  maxW="160px"
                                  fontSize="sm"
                                  fontWeight="bold"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                >
                                  {item.description}
                                </Text>
                              </VStack>
                            </Box>
                          </HStack>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </ModalBody>
        <ModalFooter display="flex" gap={2}>
          <Button
            width="100%"
            variant="unstyled"
            display="flex"
            p={4}
            borderRadius="10px"
            backgroundColor="#2F3341"
            color="white"
            _disabled={{
              backgroundColor: "#2F3341",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#2F3341"
            }}
            onClick={() => {
              setLocalMediaItems(mediaItems);
              onClose();
            }}
            isDisabled={isSaving}
          >
            Close
          </Button>
          <Button
            width="100%"
            variant="unstyled"
            p={4}
            borderRadius="10px"
            backgroundColor="#5433FF"
            display="flex"
            color="white"
            _hover={{
              backgroundColor: "#360FFF"
            }}
            onClick={handleSaveOrder}
            colorScheme="blue"
            mr={3}
            isLoading={isSaving}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SortMediaModal;
