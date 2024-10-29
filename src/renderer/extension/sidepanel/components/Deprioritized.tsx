import { Box, Checkbox, IconButton, Text } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import type { User } from "../../config/types";
import { StrikeIcon } from "../../icons";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";
import { usePayments } from "../../sidepanel/hooks/usePayments";

const Deprioritized = ({
  user,
  setUserData
}: {
  user: User;
  setUserData: (value: Partial<User>, force?: boolean) => void;
}) => {
  const { account, logger, agency } = useGlobal();

  const { paymentsData } = usePayments();

  const payments = paymentsData?.payments || [];

  useEffect(() => {
    const shouldResetDeprioritized = payments
      .filter((payment) => payment.paidStatus === "Paid")
      .some((payment) => {
        const paymentTime = new Date(payment.time).getTime();
        const strikes = user?.deprioritize_stikes;
        const strikeTimes = [
          new Date(strikes?.strike1?.time).getTime(),
          new Date(strikes?.strike2?.time).getTime(),
          new Date(strikes?.strike3?.time).getTime()
        ].filter((time) => time !== null && !isNaN(time));
        return strikeTimes.some(
          (strikeTime) => !strikeTime || strikeTime < paymentTime
        );
      });

    if (shouldResetDeprioritized) {
      logger.debug("Reset Deprioritized");
      setUserData(
        {
          ...user,
          deprioritize_stikes: null
        },
        true
      );
    }
  }, [payments, user?.deprioritize_stikes]);

  const isDeprioritized = useMemo(() => {
    if (!user?.deprioritize_stikes?.strike3?.time) return false;
    return Object.values(user.deprioritize_stikes || {}).every(
      (strike) => strike && strike.time
    );
  }, [user.deprioritize_stikes]);

  const deprioritizedDays = agency?.settings?.deprioritized_user_window;

  const deprioritizedDaysLeft = useMemo(() => {
    if (!user?.deprioritize_stikes?.strike3?.time || !deprioritizedDays)
      return 30;

    const latestStrikeTime = new Date(
      user.deprioritize_stikes.strike3.time
    ).getTime();
    if (isNaN(latestStrikeTime)) return false;

    const currentTime = new Date().getTime();
    const timeDifference = currentTime - latestStrikeTime;
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
    const daysLeft = deprioritizedDays - Math.floor(daysDifference);

    return daysLeft > 0 ? daysLeft : 0;
  }, [user?.deprioritize_stikes?.strike3?.time, deprioritizedDays]);

  // const handleCheckboxChange = (strikeKey) => (e) => {
  //   const checked = e.target.checked;
  //   const updatedStrikes = { ...user.deprioritize_stikes };

  //   if (checked) {
  //     updatedStrikes[strikeKey] = { time: new Date() };
  //   } else {
  //     delete updatedStrikes[strikeKey];
  //   }

  //   setUserData(
  //     {
  //       ...user,
  //       deprioritize_stikes: updatedStrikes
  //     },
  //     true
  //   );
  // };

  const handleStrikeClick = (strikeKey) => {
    const updatedStrikes = { ...user.deprioritize_stikes };

    if (user.deprioritize_stikes) {
      const currentStrikes = Object.keys(user.deprioritize_stikes);
      let currentStrikeKeyToAdd = strikeKey;

      if (!Object.keys(user.deprioritize_stikes).includes(strikeKey)) {
        if (strikeKey === "strike3" && currentStrikes.length <= 1) {
          if (currentStrikes.length === 1) {
            currentStrikeKeyToAdd = "strike2";
          } else {
            currentStrikeKeyToAdd = "strike1";
          }
        } else if (strikeKey === "strike2") {
          if (currentStrikes.length === 0) {
            currentStrikeKeyToAdd = "strike1";
          }
        }

        updatedStrikes[currentStrikeKeyToAdd] = { time: new Date() };
      } else {
        if (strikeKey === "strike1" && currentStrikes.length > 1) {
          if (currentStrikes.length === 3) {
            currentStrikeKeyToAdd = "strike3";
          } else {
            currentStrikeKeyToAdd = "strike2";
          }
        } else if (strikeKey === "strike2") {
          if (currentStrikes.length === 3) {
            currentStrikeKeyToAdd = "strike3";
          }
        }

        delete updatedStrikes[currentStrikeKeyToAdd];
      }
    }

    setUserData(
      {
        ...user,
        deprioritize_stikes: updatedStrikes
      },
      true
    );
  };

  const strikeLength = useMemo(() => {
    if (user.deprioritize_stikes) {
      return Object.keys(user.deprioritize_stikes).length;
    } else {
      return 0;
    }
  }, [user]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        //   height={isDeprioritized ? "50px" : "auto"}
      >
        <Box display="flex" gap={1} alignItems="center">
          {["strike1", "strike2", "strike3"].map((strikeKey) => (
            <IconButton
              key={strikeKey}
              size="sm"
              onClick={() => handleStrikeClick(strikeKey)}
              icon={
                <StrikeIcon
                  color={
                    user.deprioritize_stikes?.[strikeKey]?.time
                      ? "white"
                      : "gray"
                  }
                  borderRadius="10px"
                  width="24px"
                  height="24px"
                />
              }
              variant="ghost"
              aria-label="Edit Username"
              colorScheme={
                user.deprioritize_stikes?.[strikeKey]?.time ? "red" : "gray"
              }
              backgroundColor={
                user.deprioritize_stikes?.[strikeKey]?.time
                  ? "#F45252CC"
                  : "white"
              }
            />
            // <Checkbox
            //   key={strikeKey}
            //   isChecked={!!user.deprioritize_stikes?.[strikeKey]?.time}
            //   onChange={handleCheckboxChange(strikeKey)}
            //   fontSize="md"
            //   marginRight="10px"
            // >
            //   <Text
            //     as="span"
            //     fontWeight={
            //       user.deprioritize_stikes?.[strikeKey]?.time
            //         ? "bold"
            //         : "normal"
            //     }
            //     color={
            //       user.deprioritize_stikes?.[strikeKey]?.time
            //         ? "white"
            //         : "inherit"
            //     }
            //     bg={
            //       user.deprioritize_stikes?.[strikeKey]?.time
            //         ? "red.500"
            //         : "inherit"
            //     }
            //     padding="2px 4px"
            //     borderRadius="4px"
            //     fontSize="md"
            //   >
            //     {strikeKey.replace(/strike(\d)/, "Strike $1")}
            //   </Text>
            // </Checkbox>
          ))}
        </Box>
        <Text
          width="100%"
          fontWeight="500"
          fontSize="10px"
          textAlign="center"
          color={isDeprioritized || strikeLength > 0 ? "red" : ""}
        >
          {isDeprioritized
            ? `Depriotized for ${deprioritizedDaysLeft} days`
            : strikeLength > 0
              ? `${strikeLength} strike${strikeLength > 1 ? "s" : ""}`
              : "Strikes"}
        </Text>
        {/* {isDeprioritized && (
          <Text position="absolute" top="55px" fontWeight="bold" fontSize="md">
            Deprioritized for {deprioritizedDaysLeft} more days
          </Text>
        )} */}
      </Box>
    </>
  );
};

export default Deprioritized;
