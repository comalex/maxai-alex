import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Input,
  List,
  ListItem,
  IconButton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Divider,
  Text
} from "@chakra-ui/react";
import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  type ReactNode
} from "react";
import type { Timer, User } from "../../config/types";
import { TimerIcon } from "../../icons";

interface TimerContextType {
  timers: Timer[];
  addTimer: (timer: Timer) => void;
  deleteTimer: (index: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TimerProvider = ({
  user,
  setUserData,
  children
}: {
  user: User;
  children: ReactNode;
  setUserData: (obj: any, force: boolean) => {};
}) => {
  const [timers, setTimers] = useState<Timer[]>([]);

  useEffect(() => {
    if (user && user.timers) {
      setTimers(user.timers);
    }
  }, [user]);

  const addTimer = (timer: Timer) => {
    setTimers((prevTimers) => {
      const timers = [...prevTimers, timer];
      setUserData(
        {
          timers: timers
        },
        true
      );
      return timers;
    });
  };

  const deleteTimer = (index: number) => {
    setTimers((prevTimers) => {
      const timers = prevTimers.filter((_, i) => i !== index);
      setUserData(
        {
          timers: timers
        },
        true
      );
      return timers;
    });
  };

  return (
    <TimerContext.Provider value={{ timers, addTimer, deleteTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const AddTimer = ({
  setIsShowTimer
}: {
  setIsShowTimer: (value: React.SetStateAction<boolean>) => void;
}) => {
  return (
    <Button
      width="100%"
      onClick={() => setIsShowTimer(true)}
      variant="unstyled"
      size="sm"
      display="flex"
      gap={2}
      p={4}
      alignItems="center"
      fontSize="16px"
      fontWeight={500}
      textColor="#5449F6"
      borderRadius="10px"
      border="2px solid #5449F6"
      _hover={{
        backgroundColor: "#CFE0FC"
      }}
    >
      <TimerIcon />
      <Text>Start Timer</Text>
    </Button>
  );
};

const TimerForm = ({
  onSubmit,
  setIsShowTimer
}: {
  onSubmit: (timerData: Timer) => void;
  setIsShowTimer: (value: React.SetStateAction<boolean>) => void;
}) => {
  const [timerHours, setTimerHours] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const timerContext = useContext(TimerContext);

  if (!timerContext) {
    throw new Error("TimerForm must be used within a TimerProvider");
  }

  const { addTimer } = timerContext;

  const handleSubmit = () => {
    const totalMinutes =
      parseFloat(timerHours || "0") * 60 + parseFloat(timerMinutes || "0");
    const timerData = {
      amount: totalMinutes.toString(),
      description: timerDescription,
      addedAt: Date.now()
    };
    onSubmit(timerData);
    addTimer(timerData);
    setTimerHours("");
    setTimerMinutes("");
    setTimerDescription("");
    setIsShowTimer(false);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={4}
      borderRadius="10px"
      backgroundColor="white"
      p={4}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontSize="16px" fontWeight={500}>
          Timer
        </Text>
        <CloseIcon cursor="pointer" onClick={() => setIsShowTimer(false)} />
      </Box>
      <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
        <Box display="flex" alignItems="center">
          <Input
            variant="unstyled"
            width="65px"
            height="50px"
            placeholder="0"
            fontSize="40px"
            p={2}
            value={timerHours}
            onChange={(e) => {
              const value = Math.max(0, Math.min(12, Number(e.target.value)));
              setTimerHours(String(value));
            }}
            type="number"
            min={0}
            max={12}
            borderRadius="10px"
            border="2px solid #7C7C7C"
            backgroundColor="#F1F6FE"
          />
          <Text fontSize="32px" fontWeight={500} color="#0E0E0E" opacity="20%">
            hours
          </Text>
        </Box>
        <Box display="flex" alignItems="center">
          <Input
            variant="unstyled"
            width="65px"
            height="50px"
            placeholder="0"
            fontSize="40px"
            p={2}
            value={timerMinutes}
            onChange={(e) => {
              const value = Math.max(0, Math.min(59, Number(e.target.value)));
              setTimerMinutes(String(value));
            }}
            type="number"
            min={0}
            max={60}
            borderRadius="10px"
            border="2px solid #7C7C7C"
            backgroundColor="#F1F6FE"
          />
          <Text fontSize="32px" fontWeight={500} color="#0E0E0E" opacity="20%">
            min
          </Text>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" flex="2">
        <Input
          variant="unstyled"
          placeholder="Write your description here"
          value={timerDescription}
          onChange={(e) => setTimerDescription(e.target.value)}
          borderRadius="16px"
          p={4}
          backgroundColor="#F4F4F4"
        />
      </Box>
      <Button
        onClick={handleSubmit}
        variant="unstyled"
        size="sm"
        p={4}
        borderRadius="10px"
        backgroundColor="#5433FF"
        display="flex"
        color="white"
        _hover={{
          backgroundColor: "#360FFF"
        }}
      >
        Set Timer
      </Button>
    </Box>
  );
};

const TimerList = () => {
  const timerContext = useContext(TimerContext);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timerContext) {
    throw new Error("TimerList must be used within a TimerProvider");
  }

  const { timers, deleteTimer } = timerContext;

  if (timers.length === 0) {
    return null;
  }

  return (
    <>
      {timers?.map((timer, index) => {
        const timeElapsed = (currentTime - timer.addedAt) / 1000 / 60; // in minutes
        const timeRemaining = parseFloat(timer.amount) - timeElapsed;
        const remainingHours = Math.floor(timeRemaining / 60);
        const remainingMinutes = Math.floor(timeRemaining % 60);
        const isExpired = timeRemaining <= 0;
        return (
          <Box
            key={timer.amount + timer.description}
            display="flex"
            flexDirection="column"
            gap={4}
            borderRadius="10px"
            backgroundColor="white"
            p={4}
          >
            <Box display="flex" flexDirection="column" gap={4}>
              <Box>
                <Text fontSize="16px" fontWeight={500}>
                  Timer
                </Text>
              </Box>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                gap={1}
              >
                <Box display="flex" alignItems="center">
                  <Text fontSize="40px">
                    {Math.floor(Number(timer.amount) / 60)}
                  </Text>
                  <Text
                    fontSize="32px"
                    fontWeight={500}
                    color="#0E0E0E"
                    opacity="20%"
                  >
                    hours
                  </Text>
                </Box>
                <Box display="flex" alignItems="center">
                  <Text fontSize="40px">
                    {Math.floor(Number(timer.amount) % 60)}
                  </Text>
                  <Text
                    fontSize="32px"
                    fontWeight={500}
                    color="#0E0E0E"
                    opacity="20%"
                  >
                    min
                  </Text>
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" flex="2">
                <Text
                  fontSize="16px"
                  fontWeight={400}
                  borderRadius="16px"
                  p={4}
                  backgroundColor="#F1F6FE"
                >
                  {timer.description}
                </Text>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={4}>
              <Box>
                <Text fontSize="16px" fontWeight={500}>
                  Remaining time
                </Text>
              </Box>
              {!isExpired && (
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  gap={1}
                >
                  <Box display="flex" alignItems="center">
                    <Text fontSize="40px" color="#FFD74B">
                      {remainingHours}
                    </Text>
                    <Text
                      fontSize="32px"
                      fontWeight={500}
                      color="#0E0E0E"
                      opacity="20%"
                    >
                      hours
                    </Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Text fontSize="40px" color="#FFD74B">
                      {remainingMinutes}
                    </Text>
                    <Text
                      fontSize="32px"
                      fontWeight={500}
                      color="#0E0E0E"
                      opacity="20%"
                    >
                      min
                    </Text>
                  </Box>
                </Box>
              )}
              {isExpired && (
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  gap={1}
                >
                  <Box display="flex" alignItems="center">
                    <Text fontSize="40px" color="#FFD74B">
                      Expired
                    </Text>
                  </Box>
                </Box>
              )}
              <Button
                variant="unstyled"
                size="sm"
                p={4}
                borderRadius="10px"
                backgroundColor="#F45252"
                display="flex"
                color="white"
                _hover={{
                  backgroundColor: "#F45252"
                }}
                onClick={() => deleteTimer(index)}
              >
                Stop
              </Button>
            </Box>
          </Box>
        );
      })}
    </>
  );
};

const TimerManager = ({
  setUserData,
  user,
  isShowTimerForm,
  setIsShowTimer
}) => {
  const handleAddTimerClick = () => {
    console.log("Add Timer button clicked");
  };

  const handleSubmit = (timerData: Timer) => {};

  return (
    <TimerProvider user={user} setUserData={setUserData}>
      <Box width="100%" display="flex" flexDirection="column" gap={4}>
        {isShowTimerForm && (
          <TimerForm onSubmit={handleSubmit} setIsShowTimer={setIsShowTimer} />
        )}
        <TimerList />
      </Box>
    </TimerProvider>
  );
};

export default TimerManager;
