import { Box, Text } from "@chakra-ui/react";
import type { ReactElement } from "react";

const StatsTitles = ["Total", "Number of", "Average", "Last", "Days Ago"];

interface PaymentStatsProps {
  title: string | ReactElement;
  stats: string[];
}

const PaymentStats = ({ title, stats }: PaymentStatsProps) => {
  return (
    <Box width="100%" display="flex" flexDirection="column" gap={2.5}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box
          fontSize="11px"
          fontStyle="normal"
          fontWeight="500"
          textColor="#606060"
        >
          {title}
        </Box>
        <Box
          p={3}
          backgroundColor="#EFEEEF"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderRadius="10px"
        >
          {StatsTitles.map((element, index) => {
            if (index === 0) {
              return (
                <Box
                  key={element + stats[index]}
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    fontSize="10px"
                    fontStyle="normal"
                    fontWeight={500}
                    textColor="#606060"
                  >
                    {element}
                  </Text>
                  <Text
                    fontSize="16px"
                    fontStyle="normal"
                    fontWeight={700}
                    textColor="#00BB83"
                  >
                    {stats[index]}
                  </Text>
                </Box>
              );
            } else {
              return (
                <Box
                  key={element + stats[index]}
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    fontSize="10px"
                    fontStyle="normal"
                    fontWeight={500}
                    textColor="#606060"
                  >
                    {element}
                  </Text>
                  <Text
                    fontSize="16px"
                    fontStyle="normal"
                    fontWeight={700}
                    textColor="#0E0E0E"
                  >
                    {stats[index]}
                  </Text>
                </Box>
              );
            }
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentStats;
