import { CloseIcon, Icon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Input,
  Textarea,
  useToast,
  Tag,
  TagCloseButton,
  Image as ChakraImage,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  type AlertStatus,
  type ToastPosition,
  type ToastId,
  VStack,
  Text
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { RoundedCircleIcon } from "../../icons";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

import FileUploader from "./FileUploader";

const rotateImageFile = async (
  file: File,
  rotationAngle: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Adjust canvas dimensions based on rotation
        if (rotationAngle === 90 || rotationAngle === 270) {
          // For 90 or 270 degrees, swap width and height
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          // For 0 and 180 degrees, keep the original dimensions
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Move the canvas origin to the center
        ctx?.translate(canvas.width / 2, canvas.height / 2);
        ctx?.rotate((rotationAngle * Math.PI) / 180); // Rotate the canvas
        ctx?.translate(-img.width / 2, -img.height / 2); // Adjust for rotation

        // Draw the image onto the canvas
        ctx?.drawImage(img, 0, 0);

        // Convert the canvas back to a Blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to Blob"));
          }
        }, file.type);
      };
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const AddVaultMediaButton = ({
  customVaultId,
  onMediaAdded,
  setIsAddingMedia,
  folderList,
  isAddingFolder,
  refetchFolders,
  isFetchingFolders,
  handleCreateFolder,
  newFolderName,
  newFolderDescription,
  setNewFolderName,
  setNewFolderDescription,
  isFolderCreating
}) => {
  const toast = useToast();
  const toastIdRef = useRef<ToastId | undefined>(undefined);
  const { jwtToken, agency, account } = useGlobal();
  const [showForm, setShowForm] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaDataList, setMediaDataList] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMediaToFolder, setIsAddingMediaToFolder] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetchingCollaborators, setIsFetchingCollaborators] = useState(false);
  const {
    isOpen: isOpenInvalidFiles,
    onOpen: onOpenInvalidFiles,
    onClose: onCloseInvalidFiles
  } = useDisclosure();
  const [invalidFileNames, setInvalidFileNames] = useState("");

  function closeToast() {
    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
    }
  }

  function addToast(
    status: AlertStatus,
    title: ReactNode,
    position: ToastPosition
  ) {
    toastIdRef.current = toast({ title, status, position, duration: null });
  }

  const handleImageRotate = async (file: File, index: number) => {
    const rotatedFile = await rotateImageFile(file, 90);

    const fileToUpload = new File([rotatedFile], file.name, {
      type: file.type
    });
    const updatedMediaListWithRotatedFile = mediaDataList.map((media, i) => {
      if (i === index) {
        return { ...media, file: fileToUpload };
      } else {
        return media;
      }
    });
    setMediaDataList(updatedMediaListWithRotatedFile);
    const updatedMediaFilesWithRotatedFile = mediaFiles.map((media, i) => {
      if (i === index) {
        return fileToUpload;
      } else {
        return media;
      }
    });
    setMediaFiles(updatedMediaFilesWithRotatedFile);
    const updatedPreviewUrls = previewUrls.map((url, i) => {
      if (i === index) {
        return URL.createObjectURL(rotatedFile);
      } else {
        return url;
      }
    });
    setPreviewUrls(updatedPreviewUrls);
  };

  const handleFilesChange = (uploadedFiles: File[]) => {
    const allowedFormats = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "video/mp4",
      "video/mov",
      "video/quicktime",
      "video/mpg",
      "video/mpeg",
      "video/avi",
      "video/webm",
      "video/mkv",
      "audio/mpeg"
    ];
    const allFiles = uploadedFiles;
    const files = allFiles.filter((file) =>
      allowedFormats.includes((file as File).type)
    );
    const invalidFiles = allFiles.filter(
      (file) => !allowedFormats.includes((file as File).type)
    );

    if (invalidFiles?.length > 0) {
      const invalidFileNamesList = invalidFiles
        .map((file) => (file as File).name)
        .join(", ");
      setInvalidFileNames(invalidFileNamesList);
      onOpenInvalidFiles();
    }

    setMediaFiles(files);
    const newMediaDataList = files.map((file) => ({
      title: "",
      description: "",
      file: file,
      price: "",
      type: (file as File).type.split("/")[0],
      tags: [],
      folderId: "",
      collaborators: []
    }));
    setMediaDataList(newMediaDataList);
    const newPreviewUrls = files.map((file) =>
      URL.createObjectURL(file as File)
    );
    setPreviewUrls(newPreviewUrls);
  };

  const handleAddMedia = async () => {
    setIsLoading(true);
    setIsAddingMediaToFolder(true);
    try {
      for (let i = 0; i < mediaDataList?.length; i++) {
        const mediaData = mediaDataList[i];
        const formData = new FormData();
        formData.append("user_id", account.name);
        formData.append("agency_id", agency.settings.agency_id.toString());
        formData.append("custom_vault_id", customVaultId);
        formData.append("title", mediaData.title);
        formData.append("description", mediaData.description);
        formData.append("file", mediaData.file);
        formData.append(
          "price",
          mediaData.price?.length ? mediaData.price : "0"
        );
        formData.append("type", mediaData.type);
        formData.append("tags", JSON.stringify(mediaData.tags));
        formData.append(
          "collaborators",
          JSON.stringify(mediaData.collaborators)
        );

        const response = await api.addCustomVaultMedia(jwtToken, formData);
        if (response.success) {
          toast({
            title: "Media added successfully",
            status: "success",
            duration: 1000,
            isClosable: true
          });
          setShowForm(false);
          if (mediaData.folderId) {
            await api.addMediaToFolder(
              jwtToken,
              mediaData.folderId,
              [response.data],
              customVaultId
            );
          }
          onMediaAdded();
          refetchFolders();
          setSearchTerm("");
          fetchCollaborators();
        } else {
          toast({
            title: response.error,
            status: "error",
            duration: 1000,
            isClosable: true
          });
        }
      }
      toast({ title: "Media added successfully", status: "success" });
      setShowForm(false);
      setMediaFiles([]);
      setMediaDataList([]);
      setPreviewUrls([]);
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 1000,
        isClosable: true
      });
    } finally {
      setIsAddingMediaToFolder(false);
      setIsLoading(false);
      setIsAddingMedia(false);
    }
  };

  const isFormValid = () => {
    return mediaDataList.every(
      (mediaData) => mediaData.file && mediaData.type && mediaData.title
    );
  };

  const handleTagRemove = (index, tag) => {
    const newMediaDataList = [...mediaDataList];
    newMediaDataList[index].tags = newMediaDataList[index].tags.filter(
      (t) => t !== tag
    );
    setMediaDataList(newMediaDataList);
  };

  const handleCollaboratorRemove = (index, tag) => {
    const newMediaDataList = [...mediaDataList];
    newMediaDataList[index].collaborators = newMediaDataList[
      index
    ].collaborators.filter((t) => t !== tag);
    setMediaDataList(newMediaDataList);
  };

  const handleAddFolder = async () => {
    setIsLoading(true);
    await handleCreateFolder();
    setIsLoading(false);
    setShowCreateFolderForm(false);
  };

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

  // useEffect(() => {
  //   if (isAddingMediaToFolder) {
  //     addToast("loading", "Adding media in progress...", "bottom");
  //   } else {
  //     closeToast();
  //   }
  // }, [isAddingMediaToFolder]);

  // useEffect(() => {
  //   setIsAddingMedia(showForm);
  // }, [showForm]);

  useEffect(() => {
    fetchCollaborators();
  }, [jwtToken, agency.settings.agency_id, customVaultId]);

  const filteredCollaborators = collaborators.filter((collaborator) =>
    collaborator?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap={8}
    >
      <Button
        variant="unstyled"
        borderRadius="12px"
        backgroundColor="#5449F6"
        p={1}
        width={"20%"}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        onClick={() => {
          setIsAddingMedia(false);
        }}
      >
        <Text fontSize="12px" fontWeight={600} color="white">
          {"< Back"}
        </Text>
      </Button>
      {
        <Box
          mt={-4}
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          gap={4}
          width="100%"
        >
          {mediaFiles?.length === 0 && (
            <label htmlFor="file-input">
              <Box
                border="1px dashed #0E0E0E"
                bg="white"
                borderRadius="8px"
                padding="20px"
                textAlign="center"
                boxShadow="0 0 10px 0 rgba(0, 0, 0, 0.1)"
                width="340px"
              >
                <FileUploader handleFilesChange={handleFilesChange} />
              </Box>
            </label>
          )}

          {mediaFiles.map((file, index) => (
            <Box
              width="100%"
              key={index}
              mb={4}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="rgb(243 244 246)"
              position="relative"
              display="flex"
              flexDirection="column"
              gap={4}
            >
              <CloseIcon
                position="absolute"
                top="-6"
                right="2"
                cursor="pointer"
                className=""
                color="red.500"
                onClick={() => {
                  setMediaFiles((prev) => {
                    return prev.filter((it, i) => i !== index);
                  });
                  setMediaDataList((prev) => {
                    return prev.filter((it, i) => i !== index);
                  });
                  setPreviewUrls((prev) => {
                    return prev.filter((it, i) => i !== index);
                  });
                }}
              />
              {previewUrls[index] && mediaDataList[index].type === "image" && (
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    width="100%"
                    position="relative"
                  >
                    <ChakraImage src={previewUrls[index]} alt="Preview" />
                    <Button
                      position="absolute"
                      right={2}
                      bottom={2}
                      display="flex"
                      gap={2}
                      variant="unstyled"
                      p={2}
                      borderRadius="10px"
                      border="2px solid #5449F6"
                      backgroundColor="#F1F6FE"
                      fontSize="14px"
                      fontWeight={600}
                      color="#5449F6"
                      alignItems="center"
                      _hover={{
                        backgroundColor: "#CFE0FC"
                      }}
                      onClick={() => {
                        handleImageRotate(file, index);
                      }}
                    >
                      <RoundedCircleIcon width="14px" height="14px" />
                      <Text>Rotate Image</Text>
                    </Button>
                  </Box>
                </Box>
              )}
              {previewUrls[index] && mediaDataList[index].type === "video" && (
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  padding="10px"
                >
                  <Box borderRadius="md" overflow="hidden" maxWidth="250px">
                    <video
                      controls
                      src={previewUrls[index]}
                      style={{ maxHeight: "200px" }}
                    />
                  </Box>
                </Box>
              )}
              {previewUrls[index] && mediaDataList[index].type === "audio" && (
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  padding="10px"
                >
                  <Box
                    borderRadius={"200px"}
                    boxShadow={"0px 0px 18px -1px #5449F6"}
                    border={"2px"}
                    borderColor={"#5433FF"}
                  >
                    <audio
                      controls
                      src={previewUrls[index]}
                      style={{ maxHeight: "200px" }}
                    />
                  </Box>
                </Box>
              )}
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
                  value={mediaDataList[index].title}
                  onChange={(e) => {
                    const newMediaDataList = [...mediaDataList];
                    newMediaDataList[index].title = e.target.value;
                    setMediaDataList(newMediaDataList);
                  }}
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
                  value={mediaDataList[index].description}
                  onChange={(e) => {
                    const newMediaDataList = [...mediaDataList];
                    newMediaDataList[index].description = e.target.value;
                    setMediaDataList(newMediaDataList);
                  }}
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
                  value={mediaDataList[index].price}
                  onChange={(e) => {
                    const newMediaDataList = [...mediaDataList];
                    newMediaDataList[index].price = e.target.value;
                    setMediaDataList(newMediaDataList);
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Text fontSize="15px" fontWeight={400}>
                  Select category
                </Text>
                <Select
                  variant="unstyled"
                  borderRadius="16px"
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  sx={{ padding: "16px" }}
                  placeholder="Select category"
                  value={
                    isAddingFolder || isFolderCreating || isFetchingFolders
                      ? -1
                      : mediaDataList[index].folderId
                  }
                  onChange={(e) => {
                    const newMediaDataList = [...mediaDataList];
                    if (e.target.value === "create_new_folder") {
                      setShowCreateFolderForm(true);
                    } else {
                      newMediaDataList[index].folderId = e.target.value;
                    }
                    setMediaDataList(newMediaDataList);
                  }}
                  isDisabled={
                    isFetchingFolders || isFolderCreating || isFetchingFolders
                  }
                >
                  {(isFetchingFolders ||
                    isFolderCreating ||
                    isFetchingFolders) && (
                    <option value={-1}>Loading...</option>
                  )}
                  <option value="create_new_folder">
                    + Create new category
                  </option>
                  {folderList.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Select>
              </Box>
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
                  placeholder="Collaborator Tag"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  autoComplete="on"
                  list="collaborator-tags"
                  isDisabled={isFetchingCollaborators}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (searchTerm?.trim() !== "") {
                        setSearchTerm("");
                        const newMediaDataList = [...mediaDataList];
                        newMediaDataList[index].collaborators = [
                          ...newMediaDataList[index].collaborators,
                          searchTerm
                        ];
                        setMediaDataList(newMediaDataList);
                        setCollaborators((prev) => {
                          const uniqueCollaborators = [
                            ...new Set([...prev, searchTerm])
                          ];
                          return uniqueCollaborators;
                        });
                      }
                    }
                  }}
                />
                {collaborators?.length > 0 &&
                  searchTerm?.trim()?.length > 0 && (
                    <datalist id="collaborator-tags">
                      {filteredCollaborators?.map((collaborator) => (
                        <option key={collaborator} value={collaborator} />
                      ))}
                    </datalist>
                  )}
              </Box>
              {mediaDataList[index].collaborators?.length > 0 && (
                <Box display="flex" gap={2} flexWrap="wrap">
                  {mediaDataList[index].collaborators.map(
                    (tag, collabIndex) => (
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
                        <TagCloseButton
                          p={0}
                          m={0}
                          onClick={() => handleCollaboratorRemove(index, tag)}
                        />
                      </Tag>
                    )
                  )}
                </Box>
              )}
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
                      const newMediaDataList = [...mediaDataList];
                      newMediaDataList[index].tags = [
                        ...newMediaDataList[index].tags,
                        tagInput.trim()
                      ];
                      setMediaDataList(newMediaDataList);
                      setTagInput("");
                    }
                  }}
                />
              </Box>
              {mediaDataList[index].tags?.length > 0 && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  {mediaDataList[index].tags.map((tag, tagIndex) => (
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
                      <TagCloseButton
                        p={0}
                        m={0}
                        onClick={() => handleTagRemove(index, tag)}
                      />
                    </Tag>
                  ))}
                </Box>
              )}
              <Box border="1px solid #E8E8E8"></Box>
            </Box>
          ))}
        </Box>
      }
      {mediaFiles?.length > 0 && (
        <Box
          mt={-8}
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
              setMediaFiles([]);
              setMediaDataList([]);
              setPreviewUrls([]);
              setShowForm(false);
              setIsAddingMedia(false);
            }}
            isDisabled={isLoading}
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
            onClick={handleAddMedia}
            isDisabled={!isFormValid() || isLoading || mediaFiles?.length === 0}
            isLoading={isLoading}
          >
            Save
          </Button>
        </Box>
      )}
      <Modal
        isOpen={showCreateFolderForm}
        onClose={() => setShowCreateFolderForm(false)}
      >
        <ModalOverlay zIndex="99998" />
        <ModalContent
          mt="18vh"
          containerProps={{
            zIndex: "99999"
          }}
        >
          <ModalHeader>Create New Category</ModalHeader>
          <ModalBody display="flex" flexDirection="column" gap={4}>
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
              onClick={() => setShowCreateFolderForm(false)}
              isDisabled={isFolderCreating}
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
              onClick={handleAddFolder}
              colorScheme="blue"
              isDisabled={
                !newFolderName || isFetchingFolders || isFolderCreating
              }
              isLoading={isFolderCreating}
            >
              Create Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isOpenInvalidFiles} onClose={onCloseInvalidFiles}>
        <ModalOverlay zIndex="99998" />
        <ModalContent
          mt="18vh"
          containerProps={{
            zIndex: "99999"
          }}
        >
          <ModalHeader>Invalid file types</ModalHeader>
          <ModalBody>
            <VStack>
              <Box>The following files are not supported:</Box>
              <Box fontWeight="bold">{invalidFileNames}</Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onCloseInvalidFiles}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AddVaultMediaButton;
