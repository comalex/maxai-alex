import { useToast, type UseToastOptions } from "@chakra-ui/react";
import { Box, Text, HStack, Button } from "@chakra-ui/react";

type ShowConfirmToastParams = {
  text: string;
  status?: UseToastOptions["status"];
  onConfirm: () => void;
};

const useConfirm = () => {
  const toast = useToast();

  const showConfirmToast = ({
    text,
    status = "warning",
    onConfirm
  }: ShowConfirmToastParams) => {
    toast({
      status: status,
      isClosable: true,
      position: "top",
      duration: null,
      render: () => (
        <Box color="black" p={3} bg="yellow.500" borderRadius="md">
          <Text fontSize="lg" color="black" mb={4}>
            {text}
          </Text>
          <HStack spacing={3} justifyContent="flex-end">
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => {
                toast.closeAll();
              }}
            >
              Close
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => {
                onConfirm();
                toast.closeAll();
              }}
            >
              Confirm
            </Button>
          </HStack>
        </Box>
      )
    });
  };

  return {
    showConfirmToast
  };
};

export default useConfirm;
