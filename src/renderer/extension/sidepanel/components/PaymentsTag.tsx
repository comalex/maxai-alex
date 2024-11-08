import { Box, Text, Tooltip } from "@chakra-ui/react";
import { useMemo } from "react";

export enum DataForTagNumber {
  "NEVER_PURCHASED" = 0,
  "NO_PURCHASE_LAST_WEEK" = 1,
  "NEW_CONVERSATION" = 2,
  "RECENTLY_PURCHASED" = 3,
  "WHALE" = 4,
  "KNOWN_SPENDER" = 5
}

const dataForTag = [
  {
    content: "Never purchased",
    backgroundColor: "#FDD9D9",
    textColor: "#F45252",
    tooltip:
      "Shows up after 12 messages if the user has never made a purchase on this Creator’s account"
  },
  {
    content: "No purchase in the last week",
    backgroundColor: "#EFEEEF",
    textColor: "#606060"
  },
  {
    content: "New Conversation",
    backgroundColor: "#CCF1E6",
    textColor: "#299474",
    tooltip: "User Sent Less than 12 messages"
  },
  {
    content: "Recently purchased",
    backgroundColor: "#00BB83",
    textColor: "#00573D"
  },
  {
    content: "🐳 WHALE",
    backgroundColor: "#266188",
    textColor: "#FFF",
    tooltip: "More than $500 in the last month"
  },
  {
    content: "Known spender",
    backgroundColor: "linear-gradient(92deg, #E0C181 0%, #D0A86D 100%)",
    textColor: "#F9F4EC",
    tooltip: "Spender on other creators"
  }
];

interface PaymentsTagProps {
  dataForTagNumber: DataForTagNumber;
  whaleThreshold?: number;
}

const PaymentsTag = ({
  dataForTagNumber,
  whaleThreshold
}: PaymentsTagProps) => {
  const currentDataForTag = useMemo(() => {
    if (whaleThreshold) {
      return {
        ...dataForTag[dataForTagNumber],
        tooltip: `More than $${whaleThreshold} in the last month`
      };
    }

    return dataForTag[dataForTagNumber];
  }, []);

  return (
    <Tooltip
      variant="unstyled"
      hasArrow
      arrowSize={12}
      px={1.5}
      py={4}
      fontSize="16px"
      fontWeight={500}
      label={currentDataForTag.tooltip ? currentDataForTag.tooltip : ""}
      color="white"
      borderRadius="3px 13px 13px 13px"
      boxShadow="0px 10px 100px 0px rgba(0, 0, 0, 0.30)"
      backgroundColor="rgba(37, 37, 37, 0.90)"
      position="relative"
      // _before={{
      //   content: '""',
      //   position: "absolute",
      //   left: "4px",
      //   top: "-13px",
      //   background: "rgba(37, 37, 37, 0.90)",
      //   width: "37px",
      //   height: "13.179px",
      //   clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
      // }}
    >
      <Box
        width="fit-content"
        borderRadius="20px"
        backgroundColor={
          currentDataForTag.backgroundColor.includes("linear-gradient")
            ? ""
            : currentDataForTag.backgroundColor
        }
        bgGradient={
          currentDataForTag.backgroundColor.includes("linear-gradient")
            ? currentDataForTag.backgroundColor
            : ""
        }
        display="flex"
        alignItems="center"
        // py="2px"
        px="6px"
      >
        <Text
          fontSize="10px"
          fontWeight={600}
          color={currentDataForTag.textColor}
        >
          {currentDataForTag.content.toUpperCase()}
        </Text>
      </Box>
    </Tooltip>
  );
};

export default PaymentsTag;
