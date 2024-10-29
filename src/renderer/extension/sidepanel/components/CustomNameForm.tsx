import { Box, Button, Input } from "@chakra-ui/react";
import React from "react";
import useUserHook from "../../sidepanel/hooks/useUser";

interface CustomNameInputProps {
  setIsEditingName: (isEditing: boolean) => void;
}

const CustomNameInput: React.FC<CustomNameInputProps> = ({
  setIsEditingName
}) => {
  const { inputCustomUserName, setInputCustomUserName, updUserCustomName } =
    useUserHook();

  return (
    <Box
      display="flex"
      alignItems="center"
      width="100%"
      gap="10px"
      fontSize="md"
    >
      <Input
        type="text"
        fontSize="sm"
        color="gray.500"
        value={inputCustomUserName}
        onChange={(event) => {
          const name = event.target.value;
          setInputCustomUserName(name);
        }}
      />
      <Button
        width="250px"
        fontSize="md"
        padding="10px"
        onClick={() => {
          updUserCustomName();
          setIsEditingName(false); // Hide the input field and button after setting the custom name
        }}
      >
        Set Custom Name
      </Button>
    </Box>
  );
};

export default CustomNameInput;
