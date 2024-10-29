import {
  Box,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useToast
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import type { FolderType } from "./CustomVaultMediaList";
import FolderItem from "./FolderItem";
import MediaItem from "./MediaItem";

function FolderList({
  folders,
  refetchMediaItems,
  isFetchingMedia,
  refetchFolders,
  isFetchingFolders,
  isDeletingMedia,
  fetchMediaItems,
  quickMedia,
  quickMediaFolderId,
  fetchFoldersList,
  folderList,
  isFolderCreating,
  newFolderName,
  newFolderDescription,
  setNewFolderName,
  setNewFolderDescription,
  handleCreateFolder,
  setIsDeletingMedia,
  isAddingFolder,
  setIsAddingMedia,
  mediaItems
}) {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFolderDetails, setSelectedFolderDetails] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedFolderData, setUpdatedFolderData] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const { jwtToken, activeTab } = useGlobal();
  const toast = useToast();

  useEffect(() => {
    setIsFolderModalOpen(false);
    setIsDeleteModalOpen(false);
  }, [activeTab]);

  const openFolderModal = (folder) => {
    if (folder?.folder_medias && folder?.folder_medias?.length > 0) {
      setSelectedFolderDetails(folder);
      setIsFolderModalOpen(true);
    } else {
      toast({
        title: "No items in this folder",
        status: "info",
        duration: 1000,
        isClosable: true
      });
    }
  };

  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
    setSelectedFolderDetails(null);
  };

  const openDeleteModal = (folder) => {
    setFolderToDelete(folder);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setFolderToDelete(null);
  };

  const openEditModal = (folder) => {
    setUpdatedFolderData({
      name: folder.folder_name,
      description: folder.folder_description
    });
    setFolderToEdit(folder);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setFolderToEdit(null);
    setUpdatedFolderData(null);
  };

  const handleEditFolder = async () => {
    try {
      setIsLoading(true);
      const response = await api.updateCustomVaultFolder(
        jwtToken,
        folderToEdit.folder_id,
        updatedFolderData
      );
      if (response.success) {
        toast({
          title: "Folder edited successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        refetchFolders();
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
      setIsLoading(false);
      closeEditModal();
    }
  };

  const handleDeleteFolder = async () => {
    try {
      setIsLoading(true);
      const response = await api.deleteCustomVaultFolder(
        jwtToken,
        folderToDelete.folder_id
      );
      if (response.success) {
        toast({
          title: "Folder deleted successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        refetchMediaItems();
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
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  const sortedFolders = folders.sort(
    (a: FolderType, b: FolderType) =>
      a.folder_order_index - b.folder_order_index
  );

  return (
    <Box display="flex" flexDirection="column" gap="10px">
      {sortedFolders.map((folder: FolderType) => (
        <FolderItem
          key={folder.folder_id}
          folder={folder}
          isFetchingMedia={isFetchingMedia}
          openFolderModal={openFolderModal}
          openDeleteModal={openDeleteModal}
          openEditModal={openEditModal}
          isFetchingFolders={isFetchingFolders}
          isDeletingMedia={isDeletingMedia}
          fetchMediaItems={fetchMediaItems}
          quickMedia={quickMedia}
          quickMediaFolderId={quickMediaFolderId}
          fetchFoldersList={fetchFoldersList}
          refetchFolders={refetchFolders}
          folderList={folderList}
          isFolderCreating={isFolderCreating}
          newFolderName={newFolderName}
          newFolderDescription={newFolderDescription}
          setNewFolderName={setNewFolderName}
          setNewFolderDescription={setNewFolderDescription}
          handleCreateFolder={handleCreateFolder}
          setIsDeletingMedia={setIsDeletingMedia}
          folders={folders}
          isAddingFolder={isAddingFolder}
          setIsAddingMedia={setIsAddingMedia}
          mediaItems={mediaItems}
          refetchMediaItems={refetchMediaItems}
        />
      ))}
      {selectedFolderDetails && (
        <Modal isOpen={isFolderModalOpen} onClose={closeFolderModal} size="xl">
          <ModalOverlay zIndex="99998" />
          <ModalContent
            mt="18vh"
            containerProps={{
              zIndex: "99999"
            }}
          >
            <ModalHeader fontSize="xl" fontWeight="bold">
              {selectedFolderDetails.folder_name}
            </ModalHeader>
            <ModalBody display="flex" flexDirection="column" gap="10px">
              <Text fontSize="md">
                {selectedFolderDetails.folder_description}
              </Text>
              <Text fontSize="md">
                Content Items:{" "}
                {selectedFolderDetails.folder_medias?.length || 0}
              </Text>
              {/*Left to restore the Set management functionality, if necessary*/}

              {/*<Text fontSize="md">*/}
              {/*  Sets: {selectedFolderDetails.set_medias?.length || 0}*/}
              {/*</Text>*/}
              <MediaItem
                onClose={closeFolderModal}
                refetchMediaItems={refetchMediaItems}
                mediaItems={selectedFolderDetails.folder_medias}
                mediaSetItems={selectedFolderDetails.set_medias}
                folderId={selectedFolderDetails.folder_id}
                refetchFolders={refetchFolders}
              />
            </ModalBody>
            <ModalFooter>
              <Button onClick={closeFolderModal}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      {folderToDelete && (
        <Modal
          isCentered
          motionPreset="slideInBottom"
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          size="xs"
        >
          <ModalOverlay zIndex="99998" bg="none" />
          <ModalContent
            containerProps={{
              zIndex: "99999"
            }}
            py={2}
            borderRadius="20px"
            boxShadow="0px 0px 10px 5px rgba(62, 100, 242, 0.12)"
          >
            {/* <ModalHeader>Confirm Delete</ModalHeader> */}
            <ModalBody display="flex" justifyContent="center">
              <Text fontSize="14px" fontWeight={700}>
                Do you really want to delete?
                {/* {` "${folderToDelete.folder_name}"`}? */}
              </Text>
            </ModalBody>
            <ModalFooter display="flex" justifyContent="center" gap="10px">
              <Button
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
                onClick={closeDeleteModal}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="unstyled"
                display="flex"
                p={4}
                borderRadius="10px"
                backgroundColor="#F45252"
                color="white"
                _disabled={{
                  backgroundColor: "#F45252",
                  opacity: "30%"
                }}
                _hover={{
                  backgroundColor: "#F45252"
                }}
                onClick={handleDeleteFolder}
                isDisabled={isLoading}
                isLoading={isLoading}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      {folderToEdit && (
        <Modal
          isCentered
          motionPreset="slideInBottom"
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          size="md"
        >
          <ModalOverlay zIndex="99998" bg="none" />
          <ModalContent
            containerProps={{
              zIndex: "99999"
            }}
            py={2}
            borderRadius="20px"
            boxShadow="0px 0px 10px 5px rgba(62, 100, 242, 0.12)"
          >
            <ModalBody display="flex" flexDirection="column" gap={3}>
              <Text fontSize="16px" fontWeight={500}>
                Edit category
              </Text>
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Name
                </Text>
                <Input
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  placeholder="Name"
                  value={updatedFolderData.name}
                  onChange={(e) =>
                    setUpdatedFolderData({
                      ...updatedFolderData,
                      name: e.target.value
                    })
                  }
                />
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Description
                </Text>
                <Textarea
                  variant="unstyled"
                  placeholder="Description"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  value={updatedFolderData.description}
                  onChange={(e) =>
                    setUpdatedFolderData({
                      ...updatedFolderData,
                      description: e.target.value
                    })
                  }
                  style={{
                    resize: "none",
                    width: "100%",
                    height: "100px",
                    overflow: "auto"
                  }}
                />
              </Box>
            </ModalBody>
            <ModalFooter display="flex" justifyContent="center" gap="10px">
              <Button
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
                onClick={closeEditModal}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="unstyled"
                p={4}
                borderRadius="10px"
                backgroundColor="#5433FF"
                display="flex"
                color="white"
                _hover={{
                  backgroundColor: "#360FFF"
                }}
                _disabled={{
                  backgroundColor: "#5433FF",
                  opacity: "30%"
                }}
                onClick={handleEditFolder}
                isDisabled={
                  isLoading ||
                  (updatedFolderData.name === folderToEdit.folder_name &&
                    updatedFolderData.description ===
                      folderToEdit.folder_description)
                }
                isLoading={isLoading}
              >
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

export default FolderList;
