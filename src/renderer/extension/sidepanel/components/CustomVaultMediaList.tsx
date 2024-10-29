import {
  Box,
  Spinner,
  Text,
  useToast,
  HStack,
  Button,
  Icon
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { LuFolderPlus } from "react-icons/lu";
import { SORT_MEDIA_MODAL_KEYS } from "../../config/constants";
import { DownloadAudioIcon, SortIcon } from "../../icons";
import { api } from "../../sidepanel/api";
import FolderList from "../../sidepanel/components/FolderList";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import AddFolderButton from "./AddFolderButton";
import AddVaultMediaButton from "./AddVaultMediaButton";
import MediaGrid from "./MediaGrid";
import SortFoldersModal from "./SortFoldersModal";
import SortMediaModal from "./SortMediaModal";

type MediaItemType = {
  agency_id: number;
  description: string;
  id: number;
  media_url: string;
  name: string;
  price: number;
  tags: string[];
  type: "image" | "video" | "audio";
  user_id: string;
  uuid: string;
  vault_id: number;
  collaborators: string[] | null;
  order_index: number;
  payment_status: string;
  sent: boolean;
  created_at: string;
};

type SetMediaType = {
  agency_id: number;
  description: string;
  id: number | string;
  medias: MediaItemType[];
  name: string;
  user_id: string;
  uuid: string;
  vault_id: number;
};

export type FolderType = {
  folder_agency_id: number;
  folder_description: string;
  folder_id: number | string;
  folder_medias: MediaItemType[];
  folder_name: string;
  folder_user_id: string;
  folder_uuid: string;
  folder_vault_id: number;
  set_medias: SetMediaType[];
  folder_order_index: number;
};

function CustomVaultMediaList({ customVaultId }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const toast = useToast();
  const { jwtToken, agency, account, userId, activeTab } = useGlobal();
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);
  const [isFetchingFolders, setIsFetchingFolders] = useState(false);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isFolderCreating, setIsFolderCreating] = useState(false);
  const [quickMedia, setQuickMedia] = useState<MediaItemType[] | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [quickMediaFolderId, setQuickMediaFolderId] = useState<
    number | string | null
  >(null);
  const [isSortFoldersModalOpen, setIsSortFoldersModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchMediaItems();
      fetchFoldersList();
      fetchFolders();
    }
  }, [userId]);

  useEffect(() => {
    setIsSortModalOpen(false);
    setIsSortFoldersModalOpen(false);
  }, [activeTab]);

  const fetchMediaItems = async () => {
    try {
      setIsFetchingMedia(true);
      const response = await api.getCustomVaultMedia(
        jwtToken,
        agency.settings.agency_id,
        account.name,
        customVaultId,
        userId
      );
      if (response.success) {
        setMediaItems(response.media);
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
      setIsFetchingMedia(false);
      setIsFirstLoad(false);
    }
  };

  const fetchFoldersList = async () => {
    setIsFetchingFolders(true);
    try {
      setIsFetchingMedia(true);
      const response = await api.getFoldersList(
        jwtToken,
        agency.settings.agency_id,
        account.name,
        customVaultId
      );
      if (response.success) {
        setFolderList(response.folders);
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
      setIsFetchingMedia(false);
      setIsFirstLoad(false);
      setIsFetchingFolders(false);
    }
  };

  const fetchFolders = async () => {
    try {
      setIsFetchingMedia(true);
      const response = await api.getCustomVaultFoldersWithMedia(
        jwtToken,
        agency.settings.agency_id,
        account.name,
        customVaultId,
        userId
      );
      if (response.success) {
        const folders =
          response.folders.filter(
            (folder: FolderType) => folder.folder_name !== "Quick Media"
          ) || [];
        const quickMedia = response.folders.find(
          (folder: FolderType) => folder.folder_name === "Quick Media"
        );
        setFolders(folders);
        if (quickMedia?.folder_medias?.length > 0) {
          setQuickMedia(quickMedia.folder_medias);
          setQuickMediaFolderId(quickMedia.folder_id);
        } else {
          setQuickMedia(null);
          setQuickMediaFolderId(null);
        }
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
      setIsFetchingMedia(false);
      setIsFirstLoad(false);
    }
  };

  const refetchFolders = async () => {
    await fetchFolders();
  };

  const handleCreateFolder = async () => {
    setIsFolderCreating(true);
    try {
      const formData = new FormData();
      formData.append("user_id", account.name);
      formData.append("agency_id", agency.settings.agency_id.toString());
      formData.append("custom_vault_id", customVaultId);
      formData.append("name", newFolderName);
      formData.append("description", newFolderDescription);

      const response = await api.addCustomVaultFolder(jwtToken, formData);
      if (response.success) {
        toast({
          title: "Folder created successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setNewFolderName("");
        setNewFolderDescription("");
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
      setIsFolderCreating(false);
      fetchFoldersList();
      setNewFolderName("");
      setNewFolderDescription("");
    }
  };

  useEffect(() => {
    if (
      jwtToken &&
      agency?.settings?.agency_id &&
      account?.name &&
      customVaultId
    ) {
      fetchMediaItems();
      fetchFolders();
      fetchFoldersList();
    }
  }, [jwtToken, agency?.settings?.agency_id, account?.name, customVaultId]);

  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);
  const openSortFoldersModal = () => setIsSortFoldersModalOpen(true);
  const closeSortFoldersModal = () => setIsSortFoldersModalOpen(false);

  return (
    <Box display="flex" flexDirection="column" gap="20px">
      <HStack display="flex" justifyContent="center" gap={5}></HStack>
      {quickMedia && (
        <>
          <Text fontSize="16px" fontWeight={500}>
            Quick Media
          </Text>
          <MediaGrid
            mediaItems={quickMedia}
            isFetchingMedia={isFetchingMedia}
            isFetchingFolders={isFetchingFolders}
            fetchFoldersList={fetchFoldersList}
            isDeletingMedia={isDeletingMedia}
            fetchMediaItems={fetchMediaItems}
            quickMedia={quickMedia}
            quickMediaFolderId={quickMediaFolderId}
            refetchFolders={refetchFolders}
            folderList={folderList}
            isFolderCreating={isFolderCreating}
            newFolderName={newFolderName}
            newFolderDescription={newFolderDescription}
            setNewFolderName={setNewFolderName}
            setNewFolderDescription={setNewFolderDescription}
            handleCreateFolder={handleCreateFolder}
            setIsDeletingMedia={setIsDeletingMedia}
            isQuickMedia
            folders={folders}
            isAddingFolder={true}
            isAddingMedia={isAddingMedia}
            setIsAddingMedia={setIsAddingMedia}
            showMediaData={false}
            folderId={undefined}
          />
        </>
      )}
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="16px" fontWeight={500}>
          All categories
        </Text>
        {folders?.length > 0 && (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              cursor="pointer"
              onClick={() => setIsAddingFolder(true)}
            >
              <Icon
                as={LuFolderPlus}
                width="18px"
                height="18px"
                color="#5449F6"
              />
              <Text fontSize="14px" fontWeight={600} color="#5449F6">
                Add
              </Text>
            </Box>
            <Button
              variant="unstyled"
              px={2}
              py={1}
              display="flex"
              gap={1}
              alignItems="center"
              onClick={openSortFoldersModal}
            >
              <SortIcon width="18px" height="18px" color="#5449F6" mt={1} />
              <Text fontSize="14px" fontWeight={600} color="#5449F6">
                Reorder
              </Text>
            </Button>
          </Box>
        )}
      </HStack>
      {!isAddingMedia && isAddingFolder && (
        <AddFolderButton
          setIsAddingFolder={setIsAddingFolder}
          newFolderName={newFolderName}
          newFolderDescription={newFolderDescription}
          setNewFolderName={setNewFolderName}
          setNewFolderDescription={setNewFolderDescription}
          handleCreateFolder={handleCreateFolder}
        />
      )}
      {isFirstLoad ? (
        <Spinner />
      ) : folders?.length > 0 ? (
        <FolderList
          folders={folders}
          refetchMediaItems={refetchFolders}
          isFetchingMedia={isFetchingMedia}
          refetchFolders={refetchFolders}
          isFetchingFolders={isFetchingFolders}
          fetchFoldersList={fetchFoldersList}
          isDeletingMedia={isDeletingMedia}
          fetchMediaItems={fetchMediaItems}
          quickMedia={quickMedia}
          quickMediaFolderId={quickMediaFolderId}
          folderList={folderList}
          isFolderCreating={isFolderCreating}
          newFolderName={newFolderName}
          newFolderDescription={newFolderDescription}
          setNewFolderName={setNewFolderName}
          setNewFolderDescription={setNewFolderDescription}
          handleCreateFolder={handleCreateFolder}
          setIsDeletingMedia={setIsDeletingMedia}
          isAddingFolder={isAddingFolder}
          setIsAddingMedia={setIsAddingMedia}
          mediaItems={mediaItems}
        />
      ) : (
        <Text>
          {isFetchingMedia || isFetchingFolders ? (
            "Loading..."
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              <Text>No folders found</Text>
              {!isAddingFolder && (
                <Button
                  width="fit-content"
                  variant="unstyled"
                  p={4}
                  borderRadius="10px"
                  backgroundColor="#5433FF"
                  display="flex"
                  color="white"
                  _hover={{
                    backgroundColor: "#5433FF"
                  }}
                  alignItems="center"
                  gap={1}
                  cursor="pointer"
                  onClick={() => setIsAddingFolder(true)}
                >
                  <Icon
                    as={LuFolderPlus}
                    width="18px"
                    height="18px"
                    color="white"
                  />
                  <Text fontSize="14px" fontWeight={600} color="white">
                    Add category
                  </Text>
                </Button>
              )}
            </Box>
          )}
        </Text>
      )}
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="16px" fontWeight={500}>
          All Media
        </Text>
        {mediaItems?.length > 0 && (
          <Button
            variant="unstyled"
            px={2}
            py={1}
            display="flex"
            gap={1}
            alignItems="center"
            onClick={openSortModal}
          >
            <SortIcon width="18px" height="18px" color="#5449F6" mt={1} />
            <Text fontSize="14px" fontWeight={600} color="#5449F6">
              Reorder
            </Text>
          </Button>
        )}
      </HStack>
      {isFirstLoad ? (
        <Spinner />
      ) : mediaItems?.length > 0 ? (
        <Box width="100%" display="flex" flexDirection="column" gap={8}>
          {!isAddingFolder && isAddingMedia && (
            <AddVaultMediaButton
              customVaultId={customVaultId}
              onMediaAdded={fetchMediaItems}
              setIsAddingMedia={setIsAddingMedia}
              isAddingFolder={isAddingFolder}
              folderList={folderList}
              refetchFolders={refetchFolders}
              isFetchingFolders={isFetchingFolders}
              newFolderName={newFolderName}
              newFolderDescription={newFolderDescription}
              setNewFolderName={setNewFolderName}
              setNewFolderDescription={setNewFolderDescription}
              handleCreateFolder={handleCreateFolder}
              isFolderCreating={isFolderCreating}
            />
          )}
          <MediaGrid
            mediaItems={mediaItems}
            isFetchingMedia={isFetchingMedia}
            isFetchingFolders={isFetchingFolders}
            fetchFoldersList={fetchFoldersList}
            isDeletingMedia={isDeletingMedia}
            fetchMediaItems={fetchMediaItems}
            quickMedia={quickMedia}
            quickMediaFolderId={quickMediaFolderId}
            refetchFolders={refetchFolders}
            folderList={folderList}
            isFolderCreating={isFolderCreating}
            newFolderName={newFolderName}
            newFolderDescription={newFolderDescription}
            setNewFolderName={setNewFolderName}
            setNewFolderDescription={setNewFolderDescription}
            handleCreateFolder={handleCreateFolder}
            setIsDeletingMedia={setIsDeletingMedia}
            isQuickMedia={false}
            folders={folders}
            isAddingMedia={isAddingMedia}
            isAddingFolder={isAddingFolder}
            setIsAddingMedia={setIsAddingMedia}
            showMediaData={false}
            folderId={undefined}
          />
        </Box>
      ) : (
        <Text fontSize="md">
          {isFetchingMedia || isFetchingFolders ? (
            "Loading..."
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              <Text>No media found</Text>
              {!isAddingMedia && (
                <Button
                  width="fit-content"
                  variant="unstyled"
                  p={4}
                  borderRadius="10px"
                  backgroundColor="#5433FF"
                  display="flex"
                  color="white"
                  _hover={{
                    backgroundColor: "#5433FF"
                  }}
                  alignItems="center"
                  gap={1}
                  cursor="pointer"
                  onClick={() => setIsAddingMedia(true)}
                >
                  <DownloadAudioIcon color="white" width="18px" height="18px" />
                  <Text fontSize="14px" fontWeight={600} color="white">
                    Add media
                  </Text>
                </Button>
              )}
              {isAddingMedia && (
                <AddVaultMediaButton
                  customVaultId={customVaultId}
                  onMediaAdded={fetchMediaItems}
                  setIsAddingMedia={setIsAddingMedia}
                  isAddingFolder={isAddingFolder}
                  folderList={folderList}
                  refetchFolders={refetchFolders}
                  isFetchingFolders={isFetchingFolders}
                  newFolderName={newFolderName}
                  newFolderDescription={newFolderDescription}
                  setNewFolderName={setNewFolderName}
                  setNewFolderDescription={setNewFolderDescription}
                  handleCreateFolder={handleCreateFolder}
                  isFolderCreating={isFolderCreating}
                />
              )}
            </Box>
          )}
        </Text>
      )}
      <SortMediaModal
        isOpen={isSortModalOpen}
        onClose={closeSortModal}
        mediaItems={mediaItems}
        setMediaItems={setMediaItems}
        fetchMediaItems={fetchMediaItems}
        sortMediaModalKey={SORT_MEDIA_MODAL_KEYS.MEDIA}
      />
      <SortFoldersModal
        isOpen={isSortFoldersModalOpen}
        onClose={closeSortFoldersModal}
        folders={folders}
        setFolders={setFolders}
        fetchFolders={fetchFolders}
      />
    </Box>
  );
}

export default CustomVaultMediaList;
