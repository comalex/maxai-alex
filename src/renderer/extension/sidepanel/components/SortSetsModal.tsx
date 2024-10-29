import { CopyIcon } from "@chakra-ui/icons";
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
  HStack,
  Text,
  VStack
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import type { MediaSetType } from "./MediaGrid";

type SortSetsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mediaSetItems: MediaSetType[];
  setMediaSetItems: (mediaSetItems: MediaSetType[]) => void;
  fetchMediaItems: () => void;
};

const SortSetsModal = ({
  isOpen,
  onClose,
  mediaSetItems,
  setMediaSetItems,
  fetchMediaItems
}: SortSetsModalProps) => {
  const { jwtToken } = useGlobal();
  const toast = useToast();
  const [localMediaSetItems, setLocalMediaSetItems] = useState(mediaSetItems);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalMediaSetItems(mediaSetItems);
    }
  }, [isOpen, mediaSetItems]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localMediaSetItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedMediaSetItemsWithOrder = items.map((item, idx) => {
      if (typeof item !== "object" || item === null) {
        throw new Error("Item must be an object");
      }
      return {
        ...item,
        order_index: idx + 1
      } as MediaSetType;
    });

    setLocalMediaSetItems(updatedMediaSetItemsWithOrder);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      const response = await api.updateMediaSetOrder(
        jwtToken,
        localMediaSetItems
      );
      if (response.success) {
        toast({
          title: "Order updated successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setMediaSetItems(localMediaSetItems);
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay zIndex="99998" />
      <ModalContent
        mt="18vh"
        containerProps={{
          zIndex: "99999"
        }}
      >
        <ModalHeader>Sort Sets</ModalHeader>
        <ModalBody>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="mediaSetItems">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {localMediaSetItems.map((item, index) => (
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
                            <Box>
                              <CopyIcon width="24px" height="24px" />
                            </Box>
                            <VStack
                              display="flex"
                              width="100%"
                              alignItems="center"
                              p="10px"
                            >
                              <Text fontSize="md" fontWeight="bold">
                                {item.name}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {item.description}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {item?.medias?.length} items
                              </Text>
                            </VStack>
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
        <ModalFooter>
          <Button
            onClick={handleSaveOrder}
            colorScheme="blue"
            mr={3}
            isLoading={isSaving}
          >
            Save
          </Button>
          <Button
            onClick={() => {
              setLocalMediaSetItems(mediaSetItems);
              onClose();
            }}
            isDisabled={isSaving}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SortSetsModal;
