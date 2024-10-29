import { Box, Text, Textarea, useColorMode } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { User } from "../../config/types";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

interface UserNoteProps {
  user: User;
  setUserData: (value: Partial<User>, force?: boolean) => void;
}

const UserNote = ({ user, setUserData }: UserNoteProps) => {
  const noteTextareaRef = useRef(null);
  const { colorMode } = useColorMode();
  const { activeTab } = useGlobal();

  const adjustTextareaHeight = () => {
    if (noteTextareaRef.current) {
      noteTextareaRef.current.style.height = "auto";
      noteTextareaRef.current.style.height = `${noteTextareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [user.note, activeTab]);

  return (
    <Box
      backgroundColor={colorMode === "light" ? "white" : "#212327"}
      p={4}
      borderRadius="10px"
      width="100%"
      display="flex"
      flexDirection="column"
      gap={2}
    >
      <Text fontSize="16px" fontWeight={500}>
        Notes:
      </Text>
      <Textarea
        ref={noteTextareaRef}
        value={user?.note || ""}
        onChange={(e) => {
          const updatedNote = e.target.value.slice(0, 1000);
          setUserData({ note: updatedNote });
        }}
        onBlur={(e) => {
          const updatedNote = e.target.value;
          setUserData({ note: updatedNote }, true);
        }}
        borderRadius="16px"
        border="1px solid #E8E8E8"
        backgroundColor="#F4F4F4"
        placeholder="Write your notes about the user here"
        size="md"
        resize="none"
        width="100%"
        rows={2}
        fontSize="15px"
      />
      <Text
        width="100%"
        display="flex"
        justifyContent="flex-end"
        fontSize="12px"
        color="#606060"
      >
        {1000 - (user?.note?.length || 0)} characters
      </Text>
    </Box>
  );
};

export default UserNote;
