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
  VStack
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import type { FolderType } from "./CustomVaultMediaList";

const SortFoldersModal = ({
  isOpen,
  onClose,
  folders,
  setFolders,
  fetchFolders
}) => {
  const { jwtToken } = useGlobal();
  const toast = useToast();
  const [localFolders, setLocalFolders] = useState(folders);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalFolders(folders);
    }
  }, [isOpen, folders]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localFolders);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalFolders(items);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      const updatedFolders = localFolders.map(
        (folder: FolderType, index: number) => ({
          ...folder,
          folder_order_index: index
        })
      );
      console.log({ updatedFolders });
      const response = await api.updateFolderOrder(jwtToken, updatedFolders);
      if (response.success) {
        toast({
          title: "Order updated successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setFolders(updatedFolders);
        fetchFolders();
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
        <ModalHeader>Sort Folders</ModalHeader>
        <ModalBody maxHeight="400px" overflow="hidden" overflowY="scroll">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="folders">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {localFolders.map((folder, index) => (
                    <Draggable
                      key={folder.folder_id}
                      draggableId={folder.folder_id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          p={3}
                          mb={2}
                          borderWidth="1px"
                          borderRadius="lg"
                          bg="white"
                        >
                          <HStack
                            alignItems="center"
                            justifyContent="space-between"
                            gap={10}
                          >
                            <CopyIcon width="24px" height="24px" />
                            <VStack>
                              <Box fontSize="md" fontWeight="bold">
                                {folder.folder_name}
                              </Box>
                              <Box
                                fontSize="xs"
                                color="gray.500"
                                maxWidth="120px"
                              >
                                {folder.folder_description}
                              </Box>
                            </VStack>
                            <VStack>
                              <Box fontSize="sm" color="gray.500">
                                Content Items: {folder?.folder_medias?.length}
                              </Box>
                              {/*Left to restore the Set management functionality, if necessary*/}

                              {/*<Box fontSize="sm" color="gray.500">*/}
                              {/*  Sets: {folder.folder_sets?.length}*/}
                              {/*</Box>*/}
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
              setLocalFolders(folders);
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
            isLoading={isSaving}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SortFoldersModal;
