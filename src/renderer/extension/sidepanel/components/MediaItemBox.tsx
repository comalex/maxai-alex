import { Box, Checkbox, Icon, Image, Text } from "@chakra-ui/react";
import type React from "react";
import { useState } from "react";
import { FaPlay, FaImage } from "react-icons/fa6";
import { GoScreenFull } from "react-icons/go";
import { IoPeopleSharp } from "react-icons/io5";
import { PencilIcon } from "../../icons";

import type { MediaItem } from "./MediaGrid";

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours > 0 ? hours : null,
    hours && minutes < 10 ? `0${minutes}` : minutes,
    secs < 10 ? `0${secs}` : secs
  ]
    .filter((unit) => unit !== null)
    .join(":");
};

interface MediaItemBoxProps {
  item: MediaItem;
  selectedMedia: any[];
  mediaItems: any;
  handleMediaSelect: (mediaId: any) => void;
  openEditModal: (mediaItem: MediaItem) => void;
  handleDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    item: MediaItem,
    mediaItems: MediaItem[],
    selectedMedia: number[]
  ) => void;
  handleDragEnd: () => void;
  size?: string;
}

const MediaItemBox = ({
  item,
  selectedMedia,
  mediaItems,
  handleMediaSelect,
  openEditModal,
  handleDragStart,
  handleDragEnd,
  size
}: MediaItemBoxProps) => {
  const [mediaDuration, setMediaDuration] = useState<string | null>(null);

  const openInNewTab = () => {
    window.open(item.media_url, "_blank");
  };

  return (
    <Box
      key={item.id}
      borderWidth="1px"
      borderRadius="12px"
      overflow="hidden"
      width={size ? size : "150px"}
      minW={size ? size : "150px"}
      height={size ? size : "150px"}
      position="relative"
      display="flex"
      justifyContent="center"
      alignItems="center"
      backgroundColor="black"
      className="group"
    >
      <Checkbox
        position="absolute"
        top="1.5"
        right="1"
        zIndex="98"
        size="lg"
        isChecked={selectedMedia.includes(item.id)}
        onChange={() => handleMediaSelect(item.id)}
        borderColor="white"
        iconColor="white"
        _checked={{
          bg: "#5433FF",
          borderColor: "#5433FF"
        }}
        colorScheme="lightBlue"
        borderRadius="4px"
      />
      <Box
        position="relative"
        width="100%"
        height="100%"
        draggable="true"
        onDragStart={(event) =>
          handleDragStart(event, item, mediaItems, selectedMedia)
        }
        onDragEnd={handleDragEnd}
      >
        {item.type === "audio" && (
          <Box
            as="audio"
            src={item.media_url}
            width="100%"
            height="100%"
            draggable="false"
            onLoadedMetadata={(e) => {
              const audioDuration = (e.currentTarget as any).duration;
              const formattedDuration = formatTime(audioDuration);
              setMediaDuration(formattedDuration);
            }}
          />
        )}
        {item.type === "video" && (
          <Box
            as="video"
            src={item.media_url}
            width="100%"
            height="100%"
            draggable="false"
            onLoadedMetadata={(e) => {
              const videoDuration = (e.currentTarget as any).duration;
              const formattedDuration = formatTime(videoDuration);
              setMediaDuration(formattedDuration);
            }}
          />
        )}
        {item.type === "image" && (
          <Image
            src={item.media_url}
            alt={item.name}
            width="100%"
            objectFit="cover"
            draggable="false"
          />
        )}
        <Box
          position="absolute"
          top="1"
          left="1"
          gap="6px"
          alignItems="center"
          display={{ base: "flex" }}
          _groupHover={{ display: "none" }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {item.type === "image" ? (
              <Icon as={FaImage} color="white" width="24px" height="24px" />
            ) : (
              <Icon as={FaPlay} color="white" width="24px" height="24px" />
            )}
            {mediaDuration && (
              <Text fontSize="12px" fontWeight={600} color="white">
                {mediaDuration}
              </Text>
            )}
          </Box>
          {item?.collaborators?.length > 0 && (
            <Icon as={IoPeopleSharp} color="white" width="24px" height="24px" />
          )}
        </Box>
        <Box
          position="absolute"
          borderRadius="40px"
          top="1"
          left="1"
          bg="#F4F4F4"
          onClick={() => openEditModal(item)}
          display={{ base: "none" }}
          _groupHover={{ display: "flex" }}
          alignItems="center"
          cursor="pointer"
          boxShadow="0px 0px 6px 3px rgba(0, 0, 0, 0.40)"
        >
          <PencilIcon ml="8px" mt="8px" width="20px" height="20px" />
        </Box>
        {(item.type === "image" || item.type === "video") && (
          <Box
            position="absolute"
            borderRadius="40px"
            top="1"
            p={1}
            left="9"
            bg="#F4F4F4"
            onClick={openInNewTab}
            display={{ base: "none" }}
            _groupHover={{ display: "flex" }}
            alignItems="center"
            cursor="pointer"
            boxShadow="0px 0px 6px 3px rgba(0, 0, 0, 0.40)"
          >
            <Icon as={GoScreenFull} width="20px" height="20px" />
          </Box>
        )}
        <Box position="absolute" bottom="1" left="1">
          <Box
            bg="#F4F4F4"
            borderRadius="20px"
            py={1}
            px="7px"
            minW={7}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="10px" fontWeight={500} color="#0F0F12">
              ${Number(item.price).toFixed(0)}
            </Text>
          </Box>
        </Box>
        {item?.sent && (
          <Box
            position="absolute"
            bg={item?.payment_status === "Paid" ? "#00BB83" : "#2F3341"}
            borderRadius="20px"
            py={1}
            px="7px"
            bottom="1"
            right="1"
            zIndex="98"
            color="white"
            fontSize="10px"
            fontWeight={600}
          >
            {item?.payment_status === "Paid"
              ? "✅ Paid"
              : Number(item.price) === 0
                ? "Sent for Free"
                : "✉️ Sent"}
          </Box>
        )}
        {/* {item?.collaborators?.length > 0 && (
          <Box position="absolute" bottom="1" left="1">
            <Tooltip
              label={item?.collaborators ? item?.collaborators?.join(", ") : ""}
              width="100%"
            >
              <Box bg="rgba(255, 255, 255, 0.85)" borderRadius="lg" p="1">
                Collaborators
              </Box>
            </Tooltip>
          </Box>
        )} */}
        {/* {item?.tags?.length > 0 && (
          <Box
            position="absolute"
            bottom={item?.collaborators?.length > 0 ? "8" : "1"}
            left="1"
          >
            <Tooltip
              label={item?.tags ? item?.tags?.join(", ") : ""}
              width="100%"
            >
              <Box bg="rgba(255, 255, 255, 0.85)" borderRadius="lg" p="1">
                Tags
              </Box>
            </Tooltip>
          </Box>
        )} */}
      </Box>
    </Box>
  );
};

export default MediaItemBox;
