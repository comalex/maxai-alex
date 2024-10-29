import {
  Box,
  Button,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Tag,
  Text,
  Textarea,
  useToast
} from "@chakra-ui/react";
import React, { useState } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { DownloadAudioIcon } from "../../icons";
import { api } from "../../sidepanel/api";
import useFileLoading from "../../sidepanel/hooks/useFileLoading";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import ConfirmSentMediaModal from "./ConfirmSentMediaModal";
import EditMediaModal from "./EditMediaModal";
import MediaItemBox from "./MediaItemBox";

export interface MediaItem {
  payment_status: string;
  sent: boolean;
  order_index: number;
  collaborators: string[];
  created_at: string;
  description: string;
  id: number;
  media_url: string;
  name: string;
  price: number;
  tags: string[];
  type: "image" | "video" | "audio";
  agency_id: number;
  user_id: string;
  uuid: string;
  vault_id: number;
}

export interface MediaItemWithFolderName extends MediaItem {
  folderNames?: string[];
}

export type MediaSetType = {
  agency_id: number;
  description: string;
  id: number | string;
  medias: MediaItem[];
  name: string;
  user_id: string;
  uuid: string;
  vault_id: number;
  order_index: number;
};

type FolderType = {
  created_at: string;
  description: string;
  id: number;
  name: string;
};

const MediaGrid = ({
  mediaItems,
  isFetchingMedia,
  isFetchingFolders,
  fetchFoldersList,
  isDeletingMedia,
  fetchMediaItems,
  quickMedia,
  quickMediaFolderId,
  refetchFolders,
  folderList,
  isFolderCreating,
  newFolderName,
  newFolderDescription,
  setNewFolderName,
  setNewFolderDescription,
  handleCreateFolder,
  setIsDeletingMedia,
  isQuickMedia,
  folders,
  isAddingFolder,
  isAddingMedia,
  setIsAddingMedia,
  showMediaData,
  folderId
}) => {
  const { jwtToken, customVaultId } = useGlobal();
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isAssigningToFolder, setIsAssigningToFolder] = useState(false);
  const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] =
    useState<MediaItemWithFolderName | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { fileLoading } = useFileLoading();
  const toast = useToast();

  const handleMediaSelect = (mediaId) => {
    setSelectedMedia((prevSelected) =>
      prevSelected.includes(mediaId)
        ? prevSelected.filter((id) => id !== mediaId)
        : [...prevSelected, mediaId]
    );
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (mediaItem: MediaItem) => {
    const folderNames: string[] = folders
      .filter((folder) =>
        folder.folder_medias.some((media) => media.id === mediaItem.id)
      )
      .map((folder) => folder.folder_name);

    if (quickMedia.some((item) => item.id === mediaItem.id)) {
      folderNames.push("Quick Media");
    }

    setEditingMedia({ ...mediaItem, folderNames });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const assignMediaToFolder = async (folderId: string) => {
    setIsAssigningToFolder(true);
    try {
      const response = await api.addMediaToFolder(
        jwtToken,
        folderId,
        selectedMedia,
        customVaultId
      );
      if (response.success) {
        toast({
          title: response.message,
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setSelectedMedia([]);
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
        isClosable: true,
        position: "bottom"
      });
    } finally {
      setIsAssigningToFolder(false);
    }
  };

  const handleAssignMediaToFolder = async () => {
    if (selectedFolder) {
      setIsAssigningToFolder(true);
      if (
        quickMedia &&
        quickMediaFolderId &&
        selectedFolder === quickMediaFolderId &&
        quickMedia?.length >= 3
      ) {
        toast({
          title: "Quick Media folder can only contain up to 3 items",
          status: "warning",
          duration: 1000,
          isClosable: true
        });
        return;
      }

      await assignMediaToFolder(selectedFolder);
      closeModal();
      refetchFolders();
      setIsAssigningToFolder(false);
    } else {
      toast({
        title: "Please select a category",
        status: "warning",
        duration: 1000,
        isClosable: true
      });
    }
  };

  const handleFolderSelect = (event) => {
    if (event.target.value === "create_new_folder") {
      setShowCreateFolderForm(true);
    } else {
      setSelectedFolder(event.target.value);
    }
  };

  const deleteSelectedMedia = async () => {
    setIsDeletingMedia(true);
    try {
      const promises = selectedMedia.map((mediaId) =>
        api.deleteCustomVaultMedia(jwtToken, mediaId)
      );
      const results = await Promise.all(promises);
      const success = results.every((result) => result.success);
      if (success) {
        toast({
          title: "Media deleted successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setSelectedMedia([]);
      } else {
        toast({
          title: "Failed to delete some media items",
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
      setIsDeletingMedia(false);
      fetchMediaItems();
      refetchFolders();
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    item: MediaItem,
    mediaItems: MediaItem[],
    selectedMedia: number[]
  ) => {
    event.dataTransfer.clearData();
    if (selectedMedia?.length > 0) {
      const selectedItemsUrls = mediaItems
        .filter((mediaItem: MediaItem) => selectedMedia.includes(mediaItem.id))
        .map(({ media_url }) => media_url);
      const uniqueUrls = Array.from(new Set([...selectedItemsUrls]));
      event.dataTransfer.setData("text/plain", JSON.stringify(uniqueUrls));
    } else {
      setSelectedMedia([item.id]);
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify([item.media_url])
      );
    }
  };

  const handleDeleteFromFolder = async () => {
    setIsDeletingMedia(true);
    try {
      let mediaFolderId;
      if (folderId) {
        mediaFolderId = folderId;
      } else {
        mediaFolderId = folderList.find(
          (folder: FolderType) => folder.name === "Quick Media"
        )?.id;
      }
      if (mediaFolderId) {
        const promises = selectedMedia.map((mediaId) =>
          api.removeMediaFromFolder(
            jwtToken,
            mediaFolderId,
            mediaId,
            customVaultId
          )
        );
        const results = await Promise.all(promises);
        const success = results.every((result) => result.success);
        setSelectedMedia([]);
        if (success) {
          toast({
            title: "Media removed from folder successfully",
            status: "success",
            duration: 1000,
            isClosable: true
          });
          setSelectedMedia([]);
        } else {
          toast({
            title: "Failed to remove some media from folder",
            status: "error",
            duration: 1000,
            isClosable: true
          });
        }
      }
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 1000,
        isClosable: true
      });
    } finally {
      setIsDeletingMedia(false);
      fetchMediaItems();
      refetchFolders();
    }
  };

  const handleDragEnd = () => {
    setIsConfirmModalOpen(true);
  };

  const onCloseSentMediaModal = () => {
    setSelectedMedia([]);
    setIsConfirmModalOpen(false);
  };

  const sortedMediaItems = mediaItems.sort(
    (a: MediaItem, b: MediaItem) => a.order_index - b.order_index
  );

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="center"
      width="100%"
      gap="10px"
      // maxHeight="540px"
      overflowY="auto"
      opacity={isFetchingMedia || isFetchingFolders ? 0.5 : 1}
    >
      {!isAddingFolder && !isAddingMedia && (
        <Button
          variant="unstyled"
          borderRadius="12px"
          backgroundColor="#5449F6"
          p={1}
          width={"150px"}
          height={"150px"}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          onClick={() => {
            setIsAddingMedia(true);
          }}
        >
          <DownloadAudioIcon color="white" width="24px" height="24px" />
          <Text fontSize="12px" fontWeight={600} color="white">
            {"Add media"}
          </Text>
        </Button>
      )}
      {!showMediaData &&
        sortedMediaItems?.map((item: MediaItem) => (
          <MediaItemBox
            key={item.id}
            item={item}
            selectedMedia={selectedMedia}
            mediaItems={mediaItems}
            handleMediaSelect={handleMediaSelect}
            openEditModal={openEditModal}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
          />
        ))}
      {showMediaData &&
        sortedMediaItems?.map((item: MediaItem) => (
          <Box
            key={item.id}
            width="100%"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <MediaItemBox
              item={item}
              selectedMedia={selectedMedia}
              mediaItems={mediaItems}
              handleMediaSelect={handleMediaSelect}
              openEditModal={openEditModal}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              size="130px"
            />
            <Box display="flex" flexDirection="column" gap={1}>
              <Text fontSize="14px" fontWeight={700}>
                {item.name}
              </Text>
              <Text fontSize="12px" fontWeight={400} color="#606060">
                {item.description}
              </Text>
              {item?.collaborators?.length > 0 && (
                <Box display="flex" gap={2} flexWrap="wrap">
                  {item?.collaborators?.map((tag, collabIndex) => (
                    <Tag
                      key={tag + collabIndex}
                      borderRadius="full"
                      backgroundColor="#5433FF"
                      display="flex"
                      gap={1}
                      justifyContent="space-between"
                      alignItems="center"
                      color="#FFFDFD"
                    >
                      <Icon as={IoPeopleSharp} w="14px" h="14px" />
                      <Text fontSize="12px" fontWeight={600}>
                        {tag}
                      </Text>
                    </Tag>
                  ))}
                </Box>
              )}
              {item?.tags?.length > 0 && (
                <Box display="flex" gap={2} flexWrap="wrap">
                  {item?.tags?.map((tag, tagIndex) => (
                    <Tag
                      key={tag + tagIndex}
                      borderRadius="full"
                      backgroundColor="#5433FF"
                      display="flex"
                      gap={1}
                      justifyContent="space-between"
                      alignItems="center"
                      color="#FFFDFD"
                    >
                      <Text fontSize="12px" fontWeight={600}>
                        {tag}
                      </Text>
                    </Tag>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      {selectedMedia?.length > 0 && (
        <Box
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          display="flex"
          flexWrap="wrap"
          justifyContent="center"
          gap={4}
          mt={5}
          width="100%"
          zIndex="200"
          p={4}
        >
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
            onClick={() => {
              fetchFoldersList();
              openModal();
            }}
            boxShadow="0px 0px 6px 3px rgba(0, 0, 0, 0.40)"
            isDisabled={isFetchingMedia || isFetchingFolders || isDeletingMedia}
          >
            Add to category
          </Button>
          <Button
            variant="unstyled"
            display="flex"
            p={4}
            borderRadius="10px"
            backgroundColor="#F45252"
            boxShadow="0px 0px 6px 3px rgba(0, 0, 0, 0.40)"
            color="white"
            _disabled={{
              backgroundColor: "#F45252",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#F45252"
            }}
            onClick={() => {
              if (folderId) {
                handleDeleteFromFolder();
              } else {
                if (isQuickMedia) {
                  handleDeleteFromFolder();
                } else {
                  deleteSelectedMedia();
                }
              }
            }}
            isDisabled={isFetchingMedia || isFetchingFolders || isDeletingMedia}
            isLoading={isDeletingMedia}
          >
            {folderId ? "Remove" : "Delete"}
          </Button>
          {folderId && (
            <Button
              variant="unstyled"
              display="flex"
              p={4}
              borderRadius="10px"
              border="1px solid #F45252"
              boxShadow="0px 0px 6px 3px rgba(0, 0, 0, 0.40)"
              color="#F45252"
              _disabled={{
                opacity: "30%"
              }}
              _hover={{
                backgroundColor: "#FDD9D9"
              }}
              onClick={() => {
                if (isQuickMedia) {
                  handleDeleteFromFolder();
                } else {
                  deleteSelectedMedia();
                }
              }}
              isDisabled={
                isFetchingMedia || isFetchingFolders || isDeletingMedia
              }
              isLoading={isDeletingMedia}
            >
              Delete from MaxVault
            </Button>
          )}
        </Box>
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalOverlay zIndex="99998" />
        <ModalContent
          mt="18vh"
          containerProps={{
            zIndex: "99999"
          }}
        >
          <ModalHeader>Select Category</ModalHeader>
          <ModalBody display="flex" flexDirection="column" gap="10px">
            <Select
              variant="unstyled"
              borderRadius="16px"
              border="1px solid #E8E8E8"
              backgroundColor="#FFFDFD"
              sx={{ padding: "16px" }}
              value={isFetchingFolders ? -1 : selectedFolder}
              onChange={handleFolderSelect}
              defaultValue={isFetchingFolders ? -1 : null}
              isDisabled={
                isFetchingFolders ||
                isFolderCreating ||
                showCreateFolderForm ||
                isAssigningToFolder
              }
            >
              {(isFetchingFolders ||
                isFolderCreating ||
                isAssigningToFolder) && <option value={-1}>Loading...</option>}
              <option value={null}>Select category</option>
              <option value="create_new_folder">+ Create new category</option>
              {folderList.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </Select>
            {showCreateFolderForm && (
              <Box display="flex" flexDirection="column" gap="10px">
                <Input
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  placeholder="Category Name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Textarea
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  placeholder="Category Description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  style={{
                    resize: "none",
                    width: "100%",
                    height: "100px",
                    overflow: "auto"
                  }}
                />
              </Box>
            )}
          </ModalBody>
          {showCreateFolderForm ? (
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
                onClick={() => {
                  setNewFolderName("");
                  setNewFolderDescription("");
                  setShowCreateFolderForm(false);
                }}
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
                onClick={() => {
                  handleCreateFolder();
                  setShowCreateFolderForm(false);
                }}
                colorScheme="blue"
                isDisabled={
                  !newFolderName || isFetchingFolders || isFolderCreating
                }
                isLoading={isFolderCreating}
              >
                Create Category
              </Button>
            </ModalFooter>
          ) : (
            <ModalFooter display="flex" justifyContent="center" gap="10px">
              {!isAssigningToFolder && (
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
                  onClick={closeModal}
                >
                  Cancel
                </Button>
              )}
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
                onClick={handleAssignMediaToFolder}
                colorScheme="blue"
                isLoading={isAssigningToFolder}
                isDisabled={isFetchingFolders || isFolderCreating}
              >
                Assign
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
      <ConfirmSentMediaModal
        fileLoading={fileLoading}
        isOpen={isConfirmModalOpen}
        selectedMedia={selectedMedia}
        onClose={onCloseSentMediaModal}
        mediaItems={mediaItems}
        fetchMediaItems={fetchMediaItems}
        refetchFolders={refetchFolders}
      />
      <EditMediaModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editingMedia={editingMedia}
        setEditingMedia={setEditingMedia}
        fetchMediaItems={fetchMediaItems}
        refetchFolders={refetchFolders}
      />
    </Box>
  );
};

export default MediaGrid;
