import { Button, Heading, HStack, VStack } from "@chakra-ui/react";
import React from "react";
import { PageName } from "../config/types";
import { useGlobal } from "../sidepanel/hooks/useGlobal";

type ContainerProps = {
  children: React.ReactNode;
  title: string;
  titleExtraActions?: any;
};

function Container({ children, title, titleExtraActions }: ContainerProps) {
  const { activePage, setActivePage } = useGlobal();
  return (
    <VStack spacing={4} align="stretch" width="100%" padding={4}>
      <HStack width="100%" justifyContent="flex-end">
        {/* <Heading as="h1" noOfLines={1}>
          {title}
        </Heading> */}
        {/* <Button
          onClick={() => {
            setActivePage(
              activePage === PageName.VaultList ? PageName.Message : PageName.VaultList
            );
          }}
        >
          {activePage === PageName.VaultList ? "Messages" : "Vault Contents"}
        </Button> */}
        {titleExtraActions}
      </HStack>
      <HStack>{children}</HStack>
    </VStack>
  );
}

// function OtherComponent() {
//   const activePage = useContext(CurrentPageContext);
//   // Additional logic for OtherComponent can be implemented here
//   // For example, rendering something based on the activePage
//   return (
//     <div>
//       {activePage && <p>Current page is: {activePage}</p>}
//     </div>
//   );
// }

export default Container;
