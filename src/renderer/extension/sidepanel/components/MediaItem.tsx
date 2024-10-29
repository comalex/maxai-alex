import { DragHandleIcon } from "@chakra-ui/icons";
import {
  HStack,
  Image,
  Text,
  Checkbox,
  Button,
  Box,
  useToast,
  Input,
  Textarea,
  VStack,
  Spinner,
  Tooltip
} from "@chakra-ui/react";
import React, { useState } from "react";
import { SORT_MEDIA_MODAL_KEYS } from "../../config/constants";
import { api } from "../../sidepanel/api";
import type { MediaItem, MediaSetType } from "../../sidepanel/components/MediaGrid";
import useFileLoading from "../../sidepanel/hooks/useFileLoading";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import ConfirmSentMediaModal from "./ConfirmSentMediaModal";
import SortMediaModal from "./SortMediaModal";
import SortSetsModal from "./SortSetsModal";

export type MediaItemType = {
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
  order_index: number;
  payment_status: string;
  sent: boolean;
  created_at: string;
};

function MediaItemElem({
  media,
  onSelect,
  selectedItems,
  mediaItems,
  setIsConfirmModalOpen
}) {
  const [isHovered, setIsHovered] = useState(false);

  const openInNewTab = () => {
    window.open(media.media_url, "_blank");
  };

  return (
    <HStack
      key={media.id}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      mb="10px"
      backgroundColor="white"
      borderColor="gray.300"
      borderStyle="solid"
      padding="10px"
    >
      <Checkbox onChange={() => onSelect(media.id)} />
      <Box
        borderRadius="lg"
        overflow="hidden"
        draggable="true"
        onDragStart={(event) => {
          if (selectedItems?.length > 0) {
            const selectedItemsUrls = selectedItems
              .map((itemId) => {
                const mediaItem = mediaItems.find(({ id }) => id === itemId);
                return mediaItem ? mediaItem.media_url : null;
              })
              .filter((url) => url !== null);
            const uniqueUrls = Array.from(new Set([...selectedItemsUrls]));
            event.dataTransfer.setData(
              "text/plain",
              JSON.stringify(uniqueUrls)
            );
          } else {
            event.dataTransfer.setData(
              "text/plain",
              JSON.stringify([media.media_url])
            );
          }
        }}
        onDragEnd={() => setIsConfirmModalOpen(true)}
        display="flex"
        justifyContent="center"
        alignItems="center"
        backgroundColor="black"
        width="100px"
        height="100px"
        position="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <Button
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex="150"
            color="white"
            onClick={openInNewTab}
          >
            Full Screen
          </Button>
        )}

        <Box position="absolute" top="0" left="0">
          {media.sent && (
            <Box
              position="absolute"
              p={2}
              bg="rgba(255, 0, 0, 0.7)"
              borderRadius="lg"
              top="50px"
              left="50px"
              transform="translate(-50%, -50%)"
              zIndex="150"
              color="white"
              fontWeight="bold"
            >
              SENT
            </Box>
          )}
        </Box>
        {media.type === "video" ? (
          <video
            width="100px"
            src={media.media_url}
            controls={false}
            draggable="false"
          />
        ) : (
          <Image
            width="100px"
            src={media.media_url}
            alt={media.name}
            borderRadius="lg"
            draggable="false"
          />
        )}
      </Box>
      <HStack display="flex" width="60%" justifyContent="space-around">
        <VStack display="flex" alignItems="flex-start">
          <Text>{media.name}</Text>
          <Text>{media.description}</Text>
        </VStack>
        <VStack display="flex" alignItems="flex-start">
          <Text>
            Price: <span style={{ color: "green" }}>${media.price}</span>
          </Text>
          <Text>
            Type: {media.type}{" "}
            {media.type === "video"
              ? "🎥"
              : media.type === "audio"
                ? "🎵"
                : "🖼️"}
          </Text>
        </VStack>
        <VStack display="flex" alignItems="flex-start">
          <Box display="flex" flexDirection="column" gap={2}>
            <Text>Tags:</Text>
            {media?.tags?.length > 0 && (
              <Tooltip width="100%" label={media.tags.join(", ")}>
                <Text>{`${media.tags.join(", ")}`}</Text>
              </Tooltip>
            )}
          </Box>
          <Box display="flex" gap={2} flexDirection="column">
            <Text>Collaborators:</Text>
            {media?.collaborators?.length > 0 && (
              <Tooltip width="100%" label={media.collaborators.join(", ")}>
                <Text>{`${media.collaborators.join(", ")}`}</Text>
              </Tooltip>
            )}
          </Box>
        </VStack>
      </HStack>
    </HStack>
  );
}

function MediaItemList({
  onClose,
  mediaItems,
  folderId,
  mediaSetItems,
  refetchMediaItems,
  refetchFolders
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemsTotalPrice, setSelectedItemsTotalPrice] = useState([]);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [setName, setSetName] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const toast = useToast();
  const { jwtToken, agency, account, customVaultId } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortMediaItems, setSortMediaItems] = useState(mediaItems);
  const [isSortSetsModalOpen, setIsSortSetsModalOpen] = useState(false);
  const [sortMediaSetItems, setSortMediaSetItems] = useState(mediaSetItems);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { fileLoading } = useFileLoading();
  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  const openSortSetsModal = () => setIsSortSetsModalOpen(true);
  const closeSortSetsModal = () => setIsSortSetsModalOpen(false);

  const handleSelect = (id) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      const totalPrice = newSelectedItems.reduce((acc, itemId) => {
        const mediaItem = mediaItems.find((media) => media.id === itemId);
        return acc + (mediaItem ? mediaItem.price : 0);
      }, 0);

      setSelectedItemsTotalPrice(totalPrice);
      return newSelectedItems;
    });
  };

  const handleCreateSet = async () => {
    setIsLoading(true);
    const setData = {
      folder_id: folderId,
      media_ids: selectedItems,
      name: setName,
      description: setDescription,
      user_id: account.name,
      agency_id: agency.settings.agency_id,
      vault_id: customVaultId
    };

    try {
      const response = await api.createCustomVaultSet(jwtToken, setData);
      if (response.success) {
        toast({
          title: "Set created successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setSelectedItems([]);
        setIsCreatingSet(false);
        setSetName("");
        setSetDescription("");
        setSelectedItems([]);
        refetchMediaItems();
        setIsLoading(false);
        onClose();
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
      onClose();
    }
  };

  const handleDeleteFromFolder = async () => {
    setIsLoading(true);
    try {
      const promises = selectedItems.map((mediaId) =>
        api.removeMediaFromFolder(jwtToken, folderId, mediaId, customVaultId)
      );
      const results = await Promise.all(promises);
      const success = results.every((result) => result.success);
      setSelectedItems([]);
      if (success) {
        toast({
          title: "Media removed from folder successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setSelectedItems([]);
        refetchMediaItems();
        onClose();
      } else {
        toast({
          title: "Failed to remove some media from folder",
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
      onClose();
    }
  };

  const handleDeleteSet = async (setId: string | number) => {
    setIsLoading(true);
    try {
      const response = await api.deleteCustomVaultSet(jwtToken, setId);
      if (response.success) {
        toast({
          title: "Set deleted successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        setSelectedItems([]);
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
      onClose();
    }
  };

  const handleAddToSet = async () => {
    if (!selectedSet) {
      toast({
        title: "Please select a set",
        status: "warning",
        duration: 1000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedItems.map((mediaId) =>
        api.addMediaToSet(jwtToken, selectedSet, mediaId, customVaultId)
      );
      const results = await Promise.all(promises);
      const success = results.every((result) => result.success);
      setSelectedItems([]);
      if (success) {
        toast({
          title: "Media added to set successfully",
          status: "success",
          duration: 1000,
          isClosable: true
        });
        refetchMediaItems();
      } else {
        toast({
          title: "Failed to add some media to set",
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
      onClose();
    }
  };

  const onCloseSentMediaModal = () => {
    setIsConfirmModalOpen(false);
  };

  const sortedMediaItems = sortMediaItems.sort(
    (a: MediaItem, b: MediaItem) => a.order_index - b.order_index
  );
  const sortedMediaSets = sortMediaSetItems.sort(
    (a: MediaSetType, b: MediaSetType) => a.order_index - b.order_index
  );

  return (
    <Box>
      <Box>
        {/*Left to restore the Set management functionality, if necessary*/}

        {/*<Box*/}
        {/*  width="100%"*/}
        {/*  display="flex"*/}
        {/*  justifyContent="flex-end"*/}
        {/*  mb="10px"*/}
        {/*  mt="10px"*/}
        {/*>*/}
        {/*  <Button size="sm" onClick={openSortSetsModal}>*/}
        {/*    Sort Sets*/}
        {/*  </Button>*/}
        {/*</Box>*/}
        {sortedMediaSets?.map((set: MediaSetType) => (
          <Box
            key={set.uuid}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            mb="10px"
            borderColor="gray.300"
            borderStyle="solid"
            padding="10px"
            backgroundColor="gray.100"
          >
            <HStack justifyContent="space-between" paddingBottom="10px">
              <Button
                draggable={true}
                onDragStart={(event) => {
                  const selectedItemsUrls = set?.medias?.map(
                    ({ media_url }) => media_url
                  );
                  const uniqueUrls = Array.from(
                    new Set([...selectedItemsUrls])
                  );
                  event.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify(uniqueUrls)
                  );
                }}
                leftIcon={<DragHandleIcon />}
                size="sm"
              >
                {" "}
                {set.medias?.length || 0}
              </Button>
              <HStack width="100%" justifyContent="space-between">
                <VStack alignItems="flex-start" width="100%">
                  <Text fontWeight="bold">Set: {set.name}</Text>
                  <Text>Description: {set.description}</Text>
                </VStack>
                <VStack alignItems="flex-start" mr="20px" width="86px">
                  <Text fontWeight="bold">Total Set price:</Text>
                  <Text fontWeight="bold">
                    $
                    {set?.medias?.reduce((acc: number, elem: MediaItem) => {
                      acc += elem.price || 0;
                      return acc;
                    }, 0)}
                  </Text>
                </VStack>
              </HStack>
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => handleDeleteSet(set.id)}
              >
                Delete
              </Button>
            </HStack>
            {set.medias.map((media) => (
              <HStack
                key={media.id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                mb="10px"
                backgroundColor="white"
                borderColor="gray.300"
                borderStyle="solid"
                padding="10px"
              >
                <Box borderRadius="lg" overflow="hidden">
                  {media.type === "video" && (
                    <video
                      width="100px"
                      height="100px"
                      src={media.media_url}
                      controls={false}
                      draggable="false"
                    />
                  )}
                  {media.type === "image" && (
                    <Image
                      width="100px"
                      height="100px"
                      src={media.media_url}
                      alt={media.name}
                      draggable="false"
                    />
                  )}
                  {media.type === "audio" && (
                    <audio
                      src={media.media_url}
                      controls={false}
                      draggable="false"
                    />
                  )}
                </Box>
                <HStack display="flex" gap="50px">
                  <VStack display="flex" alignItems="flex-start">
                    <Text>{media.name}</Text>
                    <Text>{media.description}</Text>
                  </VStack>
                  <VStack display="flex" alignItems="flex-start">
                    <Text>Price: {media.price}</Text>
                    <Text>Type: {media.type}</Text>
                  </VStack>
                  <VStack display="flex" alignItems="flex-start">
                    <Text>Tags: {media.tags?.join(", ") || ""}</Text>
                    <Text>
                      Collaborators: {media.collaborators?.join(", ") || ""}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            ))}
          </Box>
        ))}
        <SortSetsModal
          isOpen={isSortSetsModalOpen}
          onClose={closeSortSetsModal}
          mediaSetItems={mediaSetItems}
          setMediaSetItems={setSortMediaSetItems}
          fetchMediaItems={refetchMediaItems}
        />
      </Box>
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-end"
        mb="10px"
        mt="10px"
      >
        <Button onClick={openSortModal} size="sm">
          Sort Media
        </Button>
      </Box>

      {sortedMediaItems?.map((media: MediaItem) => (
        <MediaItemElem
          key={media.id}
          media={media}
          onSelect={handleSelect}
          selectedItems={selectedItems}
          mediaItems={sortedMediaItems}
          setIsConfirmModalOpen={setIsConfirmModalOpen}
        />
      ))}
      <SortMediaModal
        isOpen={isSortModalOpen}
        onClose={closeSortModal}
        mediaItems={sortMediaItems}
        setMediaItems={setSortMediaItems}
        fetchMediaItems={refetchMediaItems}
        sortMediaModalKey={SORT_MEDIA_MODAL_KEYS.FOLDER_MEDIA}
        folderId={folderId}
      />
      {selectedItems?.length > 0 && (
        <HStack
          mt={4}
          display="flex"
          justifyContent="space-between"
          width="100%"
        >
          <VStack display="flex" justifyContent="space-between" width="100%">
            <HStack width="100%" justifyContent="center">
              <Button
                draggable={true}
                onDragStart={(event) => {
                  const selectedItemsUrls = selectedItems
                    .map((id) => {
                      const mediaItem = mediaItems.find(
                        (media) => media.id === id
                      );
                      return mediaItem ? mediaItem.media_url : null;
                    })
                    .filter((url) => url !== null);
                  const uniqueUrls = Array.from(
                    new Set([...selectedItemsUrls])
                  );
                  event.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify(uniqueUrls)
                  );
                }}
                onDragEnd={() => setIsConfirmModalOpen(true)}
                leftIcon={<DragHandleIcon />}
                size="sm"
              >
                {selectedItems?.length || 0}
              </Button>
              {isLoading && <Spinner size="sm" />}
              {/*Left to restore the Set management functionality, if necessary*/}

              {/*<Button*/}
              {/*  size="sm"*/}
              {/*  colorScheme="blue"*/}
              {/*  onClick={() => setIsCreatingSet(true)}*/}
              {/*  isDisabled={isLoading}*/}
              {/*>*/}
              {/*  Create Set*/}
              {/*</Button>*/}

              {/*Left to restore the Set management functionality, if necessary*/}

              {/*<Button*/}
              {/*  size="sm"*/}
              {/*  colorScheme="red"*/}
              {/*  onClick={handleDeleteFromFolder}*/}
              {/*  isDisabled={isLoading}*/}
              {/*>*/}
              {/*  Delete from folder*/}
              {/*</Button>*/}
              <Text>
                <strong>Total price: ${selectedItemsTotalPrice || 0}</strong>
              </Text>
            </HStack>
            {/*Left to restore the Set management functionality, if necessary*/}

            {/*<HStack width="100%">*/}
            {/*  <Select*/}
            {/*    placeholder="Select set"*/}
            {/*    size="sm"*/}
            {/*    onChange={(e) => setSelectedSet(e.target.value)}*/}
            {/*  >*/}
            {/*    {mediaSetItems.map((set) => (*/}
            {/*      <option key={set.id} value={set.id}>*/}
            {/*        {set.name}*/}
            {/*      </option>*/}
            {/*    ))}*/}
            {/*  </Select>*/}
            {/*  <Button colorScheme="blue" onClick={handleAddToSet} size="sm">*/}
            {/*    Add to Set*/}
            {/*  </Button>*/}
            {/*</HStack>*/}
          </VStack>
        </HStack>
      )}
      {isCreatingSet && (
        <Box mt={4}>
          <Input
            placeholder="Set Name"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            mb={2}
          />
          <Textarea
            placeholder="Set Description"
            value={setDescription}
            onChange={(e) => setSetDescription(e.target.value)}
            mb={2}
          />
          <Button
            colorScheme="blue"
            onClick={handleCreateSet}
            isLoading={isLoading}
          >
            {isLoading ? "Creating..." : "Save Set"}
          </Button>
        </Box>
      )}
      <ConfirmSentMediaModal
        fileLoading={fileLoading}
        isOpen={isConfirmModalOpen}
        selectedMedia={selectedItems}
        onClose={onCloseSentMediaModal}
        mediaItems={mediaItems}
        fetchMediaItems={refetchMediaItems}
        refetchFolders={refetchFolders}
      />
    </Box>
  );
}

export default MediaItemList;
