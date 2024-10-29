import { Box, Button, Input, Textarea } from "@chakra-ui/react";
import React, { useState } from "react";

const AddFolderButton = ({
  setIsAddingFolder,
  newFolderName,
  newFolderDescription,
  setNewFolderName,
  setNewFolderDescription,
  handleCreateFolder
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFolder = async () => {
    setIsLoading(true);
    await handleCreateFolder();
    setIsLoading(false);
    setIsAddingFolder(false);
  };

  const isFormValid = () => {
    return newFolderName;
  };

  return (
    <Box width="100%">
      <Box mt={4}>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          placeholder="Name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          mb={2}
        />
        <Textarea
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          placeholder="Description"
          value={newFolderDescription}
          onChange={(e) => setNewFolderDescription(e.target.value)}
          mb={2}
          style={{
            resize: "none",
            width: "100%",
            height: "100px",
            overflow: "auto"
          }}
        />
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
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
            onClick={() => setIsAddingFolder(false)}
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
            onClick={handleAddFolder}
            isDisabled={!isFormValid() || isLoading}
            isLoading={isLoading}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddFolderButton;
