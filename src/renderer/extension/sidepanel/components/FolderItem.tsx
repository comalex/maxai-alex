import { ChevronUpIcon } from "@chakra-ui/icons";
import {
  AvatarGroup,
  Box,
  HStack,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack
} from "@chakra-ui/react";
import { useState } from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import { SORT_MEDIA_MODAL_KEYS } from "../../config/constants";
import useWindowSize from "../../sidepanel/hooks/useWindowSize";

import type { FolderType } from "./CustomVaultMediaList";
import MediaGrid from "./MediaGrid";
import type { MediaItemType } from "./MediaItem";
import SortMediaModal from "./SortMediaModal";

interface FolderItemProps {
  folder: FolderType;
  isFetchingMedia: boolean;
  openFolderModal: (folder: FolderType) => void;
  openDeleteModal: (folder: any) => void;
  openEditModal: (folder: any) => void;
  isFetchingFolders: any;
  isDeletingMedia: any;
  fetchMediaItems: any;
  quickMedia: any;
  quickMediaFolderId: any;
  fetchFoldersList: any;
  refetchFolders: any;
  folderList: any;
  isFolderCreating: any;
  newFolderName: any;
  newFolderDescription: any;
  setNewFolderName: any;
  setNewFolderDescription: any;
  handleCreateFolder: any;
  setIsDeletingMedia: any;
  folders: any;
  isAddingFolder: any;
  setIsAddingMedia: any;
  mediaItems: any;
  refetchMediaItems: any;
}

const FolderItem = ({
  folder,
  isFetchingMedia,
  openFolderModal,
  openDeleteModal,
  openEditModal,
  isFetchingFolders,
  isDeletingMedia,
  fetchMediaItems,
  quickMedia,
  quickMediaFolderId,
  fetchFoldersList,
  refetchFolders,
  folderList,
  isFolderCreating,
  newFolderName,
  newFolderDescription,
  setNewFolderName,
  setNewFolderDescription,
  handleCreateFolder,
  setIsDeletingMedia,
  folders,
  isAddingFolder,
  setIsAddingMedia,
  mediaItems,
  refetchMediaItems
}: FolderItemProps) => {
  const { width: windowWidth } = useWindowSize();
  const [expandedState, setExpandedState] = useState<boolean>(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortMediaItems, setSortMediaItems] = useState(folder.folder_medias);
  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  const sortedMediaItems = sortMediaItems.sort(
    (a: MediaItemType, b: MediaItemType) => a.order_index - b.order_index
  );

  return (
    <Box
      key={folder.folder_id}
      border="1px solid #E8E8E8"
      borderRadius="20px"
      boxShadow="0px 6px 6px 0px rgba(62, 100, 242, 0.12)"
      p={4}
      width="100%"
      // height={expandedState ? `${((folder.folder_medias.length) * 130) + 132 + (folder.folder_medias.length * 10)}px` : "150px"}
      // transition="height 0.7s ease, opacity 0.7s ease"
      onClick={() => {
        if (!isFetchingMedia && !expandedState) {
          setExpandedState(true);
        }
      }}
      cursor={expandedState ? "auto" : "pointer"}
      backgroundColor="white"
      opacity={isFetchingMedia ? 0.5 : 1}
    >
      <HStack
        display="flex"
        flexDirection="column"
        gap={2}
        justifyContent="space-between"
        alignItems="center"
        width="100%"
      >
        <HStack
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          gap={2}
        >
          <VStack
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="start"
            gap={1}
          >
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text fontSize="14px" fontWeight={700}>
                {folder.folder_name}
              </Text>
              {expandedState && (
                <Menu isLazy>
                  <MenuButton
                    variant="unstyled"
                    as={IconButton}
                    icon={
                      <Icon
                        as={HiDotsHorizontal}
                        width="24px"
                        height="24px"
                        fontWeight={700}
                      />
                    }
                  ></MenuButton>
                  <MenuList
                    width="100%"
                    bg="#F1F6FE"
                    p={0}
                    fontSize="17px"
                    color="#0E0E0E"
                  >
                    <MenuItem
                      display="flex"
                      justifyContent="center"
                      borderBottom="1px solid #E8E8E8"
                      bg="#F1F6FE"
                      _hover={{ color: "#5433FF", fontWeight: "600" }}
                      onClick={() => openSortModal()}
                    >
                      Reorder
                    </MenuItem>
                    <MenuItem
                      display="flex"
                      justifyContent="center"
                      borderBottom="1px solid #E8E8E8"
                      bg="#F1F6FE"
                      _hover={{ color: "#5433FF", fontWeight: "600" }}
                      onClick={() => openEditModal(folder)}
                    >
                      Edit Category
                    </MenuItem>
                    <MenuItem
                      display="flex"
                      justifyContent="center"
                      bg="#F1F6FE"
                      _hover={{ color: "#5433FF", fontWeight: "600" }}
                      onClick={() => openDeleteModal(folder)}
                    >
                      Delete Category
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </Box>
            <Text
              fontSize="12px"
              fontWeight={400}
              color="#606060"
              maxWidth="120px"
            >
              {folder.folder_description}
            </Text>
            {expandedState && (
              <Text fontSize="10px" fontWeight={400} color="#606060">
                Content Items: {folder.folder_medias?.length || 0}
              </Text>
            )}
          </VStack>
        </HStack>
        {!expandedState && (
          <HStack
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            gap={2}
          >
            <VStack width="78%">
              <AvatarGroup
                size="md"
                max={Number((windowWidth * 0.011).toFixed(0))}
                spacing={
                  folder?.folder_medias?.length * 64 > windowWidth * 0.6
                    ? -2
                    : 2
                }
              >
                {folder?.folder_medias?.map((media) => {
                  if (media.type === "image") {
                    return (
                      <Image
                        key={media.name}
                        alt={media.name}
                        src={media.media_url}
                        width="64px"
                        height="64px"
                        borderRadius="12px"
                        boxShadow="0px 0px 20px 2px rgba(0, 0, 0, 0.16)"
                        border="2px solid #FFFDFD"
                      />
                    );
                  }
                  if (media.type === "video") {
                    return (
                      <Box
                        key={media.name}
                        as="video"
                        src={media.media_url}
                        objectFit="cover"
                        width="64px"
                        height="64px"
                        borderRadius="12px"
                        boxShadow="0px 0px 20px 2px rgba(0, 0, 0, 0.16)"
                        border="2px solid #FFFDFD"
                      />
                    );
                  }
                })}
              </AvatarGroup>
            </VStack>
            <VStack width="12%">
              <Text fontSize="10px" fontWeight={400} color="#606060">
                Content Items: {folder?.folder_medias?.length || 0}
              </Text>
            </VStack>
          </HStack>
        )}
        {expandedState && (
          <MediaGrid
            mediaItems={folder.folder_medias}
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
            isAddingMedia={true}
            isAddingFolder={isAddingFolder}
            setIsAddingMedia={setIsAddingMedia}
            showMediaData
            folderId={folder.folder_id}
          />
        )}
        {expandedState && (
          <HStack display="flex" justifyContent="flex-end" width="100%">
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              color="#606060"
              cursor="pointer"
              onClick={() => setExpandedState(false)}
            >
              <Text fontSize="11px" fontWeight={500}>
                Close
              </Text>
              <ChevronUpIcon width="20px" height="20px" />
            </Box>
          </HStack>
        )}
      </HStack>
      <SortMediaModal
        isOpen={isSortModalOpen}
        onClose={closeSortModal}
        mediaItems={sortMediaItems}
        setMediaItems={setSortMediaItems}
        fetchMediaItems={refetchMediaItems}
        sortMediaModalKey={SORT_MEDIA_MODAL_KEYS.FOLDER_MEDIA}
        folderId={folder.folder_id}
      />
    </Box>
  );
};

export default FolderItem;
