import {
  Box,
  Button,
  Input,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useToast,
  Tag,
  TagCloseButton,
  Text,
  Tooltip,
  Icon
} from "@chakra-ui/react";
import { type FC, useEffect, useState } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import type { MediaItemWithFolderName } from "./MediaGrid";

interface EditMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMedia: MediaItemWithFolderName | null;
  setEditingMedia: (media: MediaItemWithFolderName) => void;
  fetchMediaItems: () => void;
  refetchFolders: () => void;
}

const EditMediaModal: FC<EditMediaModalProps> = ({
  isOpen,
  onClose,
  editingMedia,
  setEditingMedia,
  fetchMediaItems,
  refetchFolders
}) => {
  const { jwtToken, customVaultId, agency, account } = useGlobal();
  const toast = useToast();
  const [tagInput, setTagInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingCollaborators, setIsFetchingCollaborators] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const fetchCollaborators = async () => {
    setIsFetchingCollaborators(true);
    try {
      const response = await api.getCustomVaultCollaborators(
        jwtToken,
        agency.settings.agency_id,
        customVaultId
      );
      if (response.success) {
        if (response?.collaborators?.length > 0) {
          setCollaborators([
            ...response.collaborators.map((collaborator) => collaborator.tag)
          ]);
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
      setIsFetchingCollaborators(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [jwtToken, agency.settings.agency_id, customVaultId]);

  const handleEditMedia = async () => {
    if (editingMedia) {
      setIsEditing(true);
      try {
        const updatedMedia = {
          ...editingMedia,
          agency_id: agency.settings.agency_id,
          user_id: account.name,
          custom_vault_id: Number(customVaultId)
        };
        const response = await api.updateCustomVaultMedia(
          jwtToken,
          editingMedia.id,
          updatedMedia
        );
        if (response.success) {
          toast({
            title: "Media updated successfully",
            status: "success",
            duration: 1000,
            isClosable: true
          });
          fetchMediaItems();
          refetchFolders();
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
        setIsEditing(false);
      }
    }
  };

  const handleTagRemove = (tag) => {
    setEditingMedia({
      ...editingMedia,
      tags: editingMedia.tags.filter((t) => t !== tag)
    });
  };

  const handleCollaboratorRemove = (collaborator) => {
    setEditingMedia({
      ...editingMedia,
      collaborators: editingMedia.collaborators.filter(
        (c) => c !== collaborator
      )
    });
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
        <ModalHeader>Edit Media</ModalHeader>
        <ModalBody maxHeight="400px" overflow="hidden" overflowY="scroll">
          {editingMedia && (
            <Box display="flex" flexDirection="column" gap="10px">
              <Box
                width="100%"
                display="flex"
                flexWrap="wrap"
                gap={2}
                alignItems="end"
              >
                {editingMedia.folderNames?.length > 0 ? (
                  editingMedia.folderNames.map((item) => {
                    return (
                      <Tooltip key={item} label={item} width="100%">
                        <Text
                          px={2}
                          width="fit-content"
                          borderRadius="full"
                          fontSize="xs"
                          whiteSpace="nowrap"
                          backgroundColor="rgb(243 244 246);"
                        >
                          {item?.length > 12 ? `${item.slice(0, 12)}...` : item}
                        </Text>
                      </Tooltip>
                    );
                  })
                ) : (
                  <Text fontSize="md"></Text>
                )}
              </Box>
              {
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Box borderRadius="md" overflow="hidden" maxWidth="50%">
                    {editingMedia.type === "image" && (
                      <Image
                        src={editingMedia?.media_url || null}
                        alt="Preview"
                      />
                    )}
                    {editingMedia.type === "video" && (
                      <video controls src={editingMedia?.media_url || null} />
                    )}
                    {editingMedia.type === "audio" && (
                      <audio controls src={editingMedia?.media_url || null} />
                    )}
                  </Box>
                </Box>
              }
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Title*
                </Text>
                <Input
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  placeholder="Write a title here"
                  value={editingMedia.name}
                  onChange={(e) =>
                    setEditingMedia({ ...editingMedia, name: e.target.value })
                  }
                />
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Description
                </Text>
                <Textarea
                  variant="unstyled"
                  placeholder="Write a description about the media here"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  value={editingMedia.description}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
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
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Starting price
                </Text>
                <Input
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  p={4}
                  placeholder="$"
                  type="number"
                  value={editingMedia.price}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      price: Number(e.target.value)
                    })
                  }
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Text fontSize="15px" fontWeight={400}>
                    Collaborator tag
                  </Text>
                  <Input
                    variant="unstyled"
                    borderRadius="16px"
                    border="1px solid #E8E8E8"
                    backgroundColor="#FFFDFD"
                    p={4}
                    placeholder={
                      isFetchingCollaborators
                        ? "Loading..."
                        : "Collaborator Tag"
                    }
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        collaboratorInput.trim() !== ""
                      ) {
                        setEditingMedia({
                          ...editingMedia,
                          collaborators: [
                            ...editingMedia.collaborators,
                            collaboratorInput.trim()
                          ]
                        });
                        setCollaboratorInput("");
                      }
                    }}
                    list="collaborator-tags"
                    isDisabled={isFetchingCollaborators}
                  />
                  {collaborators?.length > 0 &&
                    collaboratorInput?.trim()?.length > 0 && (
                      <datalist id="collaborator-tags">
                        {collaborators.map((collaborator) => (
                          <option key={collaborator} value={collaborator} />
                        ))}
                      </datalist>
                    )}
                </Box>
                <Box
                  width="fit-content"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  flexWrap="wrap"
                >
                  {editingMedia.collaborators?.map((collaborator, index) => (
                    <Tag
                      key={collaborator + index}
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
                        {collaborator}
                      </Text>
                      <TagCloseButton
                        p={0}
                        m={0}
                        onClick={() => handleCollaboratorRemove(collaborator)}
                      />
                    </Tag>
                  ))}
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Text fontSize="15px" fontWeight={400}>
                    2-5 tags for the AI Model
                  </Text>
                  <Input
                    variant="unstyled"
                    borderRadius="16px"
                    border="1px solid #E8E8E8"
                    backgroundColor="#FFFDFD"
                    p={4}
                    placeholder="XOT wants to know what [usr] thinks of this pic"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim() !== "") {
                        setEditingMedia({
                          ...editingMedia,
                          tags: [...editingMedia.tags, tagInput.trim()]
                        });
                        setTagInput("");
                      }
                    }}
                  />
                </Box>
                <Box
                  width="fit-content"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  flexWrap="wrap"
                >
                  {editingMedia.tags?.map((tag, index) => (
                    <Tag
                      key={tag + index}
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
                      <TagCloseButton
                        p={0}
                        m={0}
                        onClick={() => handleTagRemove(tag)}
                      />
                    </Tag>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </ModalBody>
        <ModalFooter
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
        >
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
              setTagInput("");
              setCollaboratorInput("");
              onClose();
            }}
          >
            Cancel
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
            onClick={handleEditMedia}
            isLoading={isEditing}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditMediaModal;
