import { Box, Button, Tooltip } from "@chakra-ui/react";
import { VStack, Text } from "@chakra-ui/react";
import React from "react";
import { ExclamationMarkIcon } from "../icons";
import AccountSettingsList from "../sidepanel/components/AccountSettingsList";

import { useGlobal } from "./hooks/useGlobal";

interface WhatsAppButtonProps {
  link?: string;
  title?: string;
  [key: string]: any;
}

export const WhatsAppButton = React.forwardRef<
  HTMLButtonElement,
  WhatsAppButtonProps
>(({ link, title, ...props }, ref) => {
  return (
    <Button
      aria-label="Support"
      leftIcon={<ExclamationMarkIcon />}
      ref={ref}
      whiteSpace="normal"
      sx={{ whiteSpace: "normal", wordWrap: "break-word" }}
      {...props}
      onClick={async () => {
        window.open(link, "_blank");
      }}
    >
      {title}
    </Button>
  );
});

const parseLearningDevelopment = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse learning_development data:", error);
    return null;
  }
};

const Help = () => {
  const { agency, account, accountName } = useGlobal();

  const supportLink = agency?.settings?.whatsapp_support_group_invite_link;
  const chatLink = account?.settings?.whatsapp_channel_link;

  const learningDevelopmentArray = parseLearningDevelopment(
    agency?.settings?.learning_development
  );

  return (
    <VStack spacing={4} align="left" width="100%">
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        gap={4}
        borderRadius="8px"
        p={4}
        backgroundColor="white"
      >
        {accountName && (
          <Text fontWeight={500} fontSize="16px">
            Account Name: {accountName}
          </Text>
        )}
        {supportLink && (
          <Button
            width="100%"
            variant="unstyled"
            backgroundColor="lightBlue"
            borderRadius="10px"
            p={2}
            display="flex"
            gap={2}
            alignItems="center"
            onClick={async () => {
              window.open(supportLink, "_blank");
            }}
          >
            <ExclamationMarkIcon width="24px" height="24px" />
            <Text
              display="flex"
              flexWrap="wrap"
              fontSize="12px"
              fontWeight={500}
              wordBreak="break-word"
              whiteSpace="normal"
            >
              Technical Support (for extension-related issues)
            </Text>
          </Button>
        )}
        {chatLink && (
          <Button
            width="100%"
            variant="unstyled"
            bgGradient="linear-gradient(0deg, #25D366 0%, #25D366 100%)"
            // backgroundColor="lightBlue"
            borderRadius="10px"
            p={2}
            display="flex"
            gap={2}
            alignItems="center"
            onClick={async () => {
              window.open(chatLink, "_blank");
            }}
          >
            <Text
              display="flex"
              flexWrap="wrap"
              fontSize="14px"
              fontWeight={500}
              wordBreak="break-word"
              whiteSpace="normal"
              color="white"
            >
              Agency manager and performer chat
            </Text>
          </Button>
        )}
      </Box>
      {/* {chatLink &&
        <Tooltip
          label={`${accountName}: Agency Manager and Performer Chat`}
          aria-label={`${accountName}: Agency Manager and Performer Chat`}
          hasArrow
          placement="left"
        >
          <WhatsAppButton
            title={`${accountName}: Agency Manager and Performer Chat`}
            link={chatLink}
          />
        </Tooltip>
      } */}
      {account && account.settings && (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          gap={4}
          borderRadius="8px"
          p={4}
          backgroundColor="white"
        >
          <Text fontWeight="bold" fontSize="md" textAlign="left">
            Custom Content Pricing:
          </Text>
          <Text fontSize="md">{account.settings.customs_price_list}</Text>
        </Box>
      )}
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        gap={4}
        borderRadius="8px"
        p={4}
        backgroundColor="white"
      >
        <Text fontWeight="bold" fontSize="md" textAlign="left">
          Creator Information:
        </Text>
        <AccountSettingsList settings={account?.settings} />
      </Box>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        gap={4}
        borderRadius="8px"
        p={4}
        backgroundColor="white"
      >
        <Text fontWeight="bold" fontSize="md" textAlign="left">
          Learning & Development:
        </Text>
        {learningDevelopmentArray ? (
          learningDevelopmentArray.map((input, index) =>
            input.type === "link" ? (
              <a
                key={index}
                href={input.src}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "underline",
                  color: "blue",
                  marginLeft: "20px",
                  fontSize: "16px"
                }}
              >
                {input.value}
              </a>
            ) : (
              <Text
                key={index}
                whiteSpace="pre-wrap"
                marginLeft="20px"
                fontSize="md"
              >
                {input.value}
              </Text>
            )
          )
        ) : (
          <Text>Coming Soon</Text>
        )}
        <a
          href="https://extenation-builds.s3.amazonaws.com/maxai-latest.zip"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "underline",
            color: "blue",
            marginLeft: "20px",
            fontSize: "16px"
          }}
        >
          Download the latest version
        </a>
      </Box>
    </VStack>
  );
};

export default Help;
