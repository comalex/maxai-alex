import { Box, Button, Input, Text } from "@chakra-ui/react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
  handleFilesChange: (uploadedFiles: File[]) => void;
}

const FileUploader = ({ handleFilesChange }: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop
  });

  return (
    <Box w="100%" display="flex" flexDirection="column" gap={4}>
      <Box
        {...getRootProps()}
        position="relative"
        w="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderColor="gray.200"
      >
        {/* @ts-ignore */}
        <Input {...getInputProps()} display="none" />
        <Box display="flex" flexDirection="column" gap={4} alignItems="center">
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            alignItems="center"
          >
            <Text fontSize="16px" fontWeight={500}>
              Drag files here to upload
            </Text>
            <Text fontSize="16px" fontWeight={500}>
              or
            </Text>
            <Button
              width="100%"
              variant="unstyled"
              display="flex"
              p={2}
              borderRadius="10px"
              backgroundColor="#2F3341"
              fontSize="16px"
              color="white"
              _disabled={{
                backgroundColor: "#2F3341",
                opacity: "30%"
              }}
              _hover={{
                backgroundColor: "#2F3341",
                boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)"
              }}
            >
              Browse for files
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FileUploader;
