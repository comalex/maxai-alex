import { Box, Button, Progress, Stack, Text, useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import type { GetUserPerformanceResponse } from "../../config/types";
import { retrieveSubsHistory } from "../../services/utils";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

function useUser(token: string) {
  return useQuery<GetUserPerformanceResponse, Error>({
    queryKey: ["user-performance"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No JWT token found");
      }
      return api.getUserPerformance(token);
    },
    refetchInterval: 10000
  });
}

// Helper function to format the time
const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};

const useTimeBoxPosition = (progress: number, goalTimeInHours: number) => {
  const [boxPosition, setBoxPosition] = useState<number>(0);
  const [formattedTime, setFormattedTime] = useState<string>("");

  useEffect(() => {
    // Calculate the position for the time box based on the progress
    const calculatePosition = (
      currentInSeconds: number,
      goalInSeconds: number
    ) => {
      if (goalInSeconds === 0) return 0; // Prevent division by zero
      const progress = (currentInSeconds / goalInSeconds) * 100;
      if (progress > 100) {
        return 90;
      } else if (progress < 10) {
        return 10;
      } else return progress;
    };

    // Convert goal time from hours to seconds
    const goalTimeInSeconds = goalTimeInHours * 3600;

    setBoxPosition(calculatePosition(progress, goalTimeInSeconds));
    setFormattedTime(formatTime(progress));
  }, [progress, goalTimeInHours]);

  return { boxPosition, formattedTime };
};

const calculateProgressValue = (goal: number, currentValue: number) => {
  if (goal === 0) return 0; // Prevent division by zero
  const progress = (currentValue / goal) * 100;
  return progress > 100 ? 100 : progress;
};

type MyGoalProgressBarProps = {};

const MyGoalProgressBar: React.FC<MyGoalProgressBarProps> = () => {
  const { jwtToken, accountId, chatter } = useGlobal();
  const toast = useToast();
  const { data } = useUser(jwtToken);

  const { boxPosition, formattedTime } = useTimeBoxPosition(
    data?.data?.total_shift_duration_seconds ?? 0,
    data?.data?.time_goal ?? 0
  );

  const [revenueProgress, setRevenueProgress] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const currentValue = data?.data?.total_paid_payments_today ?? 0;
    if (data?.data?.revenue_goal) {
      setRevenueProgress(
        calculateProgressValue(data.data?.revenue_goal, currentValue)
      );
    } else if (data?.data?.agency_default_revenue) {
      setRevenueProgress(
        calculateProgressValue(data?.data?.agency_default_revenue, currentValue)
      );
    }
  }, [data]);

  return (
    <Box width={"100%"} display={"flex"} flexDirection={"column"} gap={2}>
      {/*<Box*/}
      {/*  width={"100%"}*/}
      {/*  display={"flex"}*/}
      {/*  justifyContent={"flex-end"}*/}
      {/*  height={"20px"}*/}
      {/*  mb={2}*/}
      {/*>*/}
      {/*  <Button*/}
      {/*    onClick={() => setIsExpanded(!isExpanded)}*/}
      {/*    size={"sm"}*/}
      {/*    variant={"ghost"}*/}
      {/*  >*/}
      {/*    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}*/}
      {/*  </Button>*/}
      {/*</Box>*/}
      {isExpanded && (
        <Box width={"100%"} display={"flex"} justifyContent={"center"}>
          <Button
            onClick={async () => {
              const subs = await retrieveSubsHistory();
              if (subs?.length !== 0) {
                try {
                  await api.addSubscription(jwtToken, {
                    ...subs,
                    of_account: accountId
                  });
                  toast({
                    title: "Subscription information scrapped",
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                    position: "bottom"
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Subscription information scrap error",
                    status: "error",
                    duration: 1000,
                    isClosable: true,
                    position: "bottom"
                  });
                }
              }
            }}
          >
            Get fan subscriptions info
          </Button>
        </Box>
      )}
      <Stack width={"100%"} direction={"row"} justifyContent={"space-between"}>
        <Text fontSize={"12px"} fontWeight={"500"}>
          {chatter ? `My goal (${chatter})` : "My goal"}
        </Text>
        <Text
          fontSize={"10px"}
          fontWeight={"400"}
          sx={{ "& span": { fontWeight: 600 } }}
        >
          Work time: <span> {data?.data?.time_goal ?? 0} hours</span>
        </Text>
      </Stack>
      <Box position="relative" width="100%">
        {/* Left Label */}
        <Text
          color={revenueProgress > 10 ? "white" : "black"}
          position="absolute"
          top={1}
          left={2}
          fontSize="10px"
          fontWeight="bold"
          zIndex={99}
          transition="color 0.2s ease-in-out"
        >
          ${data?.data?.total_paid_payments_today ?? 0}
        </Text>

        {/* Right Label */}
        <Text
          color={revenueProgress > 95 ? "white" : "black"}
          position="absolute"
          top={1}
          right={2}
          fontSize="10px"
          fontWeight="bold"
          zIndex={99}
          transition="color 0.2s ease-in-out"
        >
          ${data?.data?.revenue_goal ?? data?.data?.agency_default_revenue ?? 0}
        </Text>

        {/* Progress Bar */}
        <Progress
          value={revenueProgress}
          height={6}
          borderRadius="full"
          sx={{
            "& > div": {
              background:
                "linear-gradient(88deg, #A249F6 -27.4%, #FF4287 119.64%)",
              transitionProperty: "width", // Only animate the width change
              transitionDuration: "1s", // Set the duration for the animation
              transitionTimingFunction: "ease-in-out" // Set the timing function for a smoother transition
            }
          }}
        />
        {/* Time (Center Label) */}
        {data?.data && (
          <Box
            position="absolute"
            top={-0.5}
            left={`${boxPosition}%`} // Adjust this based on your progress
            transform="translateX(-50%) rotate(45deg)"
            bg="#5433FF"
            color="white"
            width={7}
            height={7}
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius={"3px"}
            zIndex={999}
            transition="left 0.5s ease-in-out"
          >
            <Text fontSize={"9px"} fontWeight={700} transform="rotate(-45deg)">
              {formattedTime}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MyGoalProgressBar;
