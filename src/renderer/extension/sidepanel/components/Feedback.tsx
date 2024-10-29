import { Button, Textarea, Box, Spinner, useToast } from "@chakra-ui/react";
import React, { useState, createContext, useContext } from "react";
import { NegativeFeedbackIcon, PositiveFeedbackIcon } from "../../icons";
import { sendNotificationToSlack } from "../../services/utils";
import { api } from "../../sidepanel/api";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

enum FeedbackEnum {
  Like = 1,
  Dislike = -1,
  None = 0
}

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({
  children,
  messageUUID,
  trainingDataHistory,
  suggestedMessageText
}) => {
  const [boolFeedback, setBoolFeedback] = useState<FeedbackEnum>(
    FeedbackEnum.None
  );
  const [feedback, setFeedback] = useState("");
  const [showTextarea, setShowTextarea] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { jwtToken, agency, account, chatter } = useGlobal();
  const toast = useToast();

  const showThankYouToast = () => {
    toast({
      title: "Thank you for your feedback!",
      status: "success",
      duration: 1000,
      isClosable: true
    });
  };

  const handleLike = async () => {
    setBoolFeedback(FeedbackEnum.Like);
    setShowTextarea(true);
    await handleSubmitFeedback(FeedbackEnum.Like);
  };

  const handleDislike = async () => {
    setBoolFeedback(FeedbackEnum.Dislike);
    setShowTextarea(true);
    await handleSubmitFeedback(FeedbackEnum.Dislike);
  };

  const handleSubmitFeedback = async (
    feedbackType: FeedbackEnum,
    sendNotification = false
  ) => {
    setIsSubmitting(true);
    await api.sendFeedback(
      jwtToken,
      messageUUID,
      feedback,
      feedbackType,
      trainingDataHistory,
      suggestedMessageText
    );
    setIsSubmitting(false);

    if (sendNotification) {
      setShowTextarea(false);
      showThankYouToast();
    }
  };

  return (
    <FeedbackContext.Provider
      value={{
        boolFeedback,
        feedback,
        showTextarea,
        setFeedback,
        handleLike,
        handleDislike,
        handleSubmitFeedback,
        isSubmitting
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const FeedbackButtons = () => {
  const { boolFeedback, handleLike, handleDislike } =
    useContext(FeedbackContext);
  return (
    <Box display="flex" gap={2} alignItems="center">
      <Button
        display="flex"
        alignItems="center"
        variant="unstyled"
        borderRadius="10px"
        border="1px solid #E8E8E8"
        backgroundColor={
          boolFeedback === FeedbackEnum.Like ? "#CCF1E6" : "#F4F4F4"
        }
        onClick={handleLike}
        px={4}
        py={2}
        _hover={{
          backgroundColor: "#D2D1D1"
        }}
      >
        <PositiveFeedbackIcon width="24px" height="24px" />
      </Button>
      <Button
        display="flex"
        alignItems="center"
        variant="unstyled"
        borderRadius="10px"
        border="1px solid #E8E8E8"
        backgroundColor={
          boolFeedback === FeedbackEnum.Dislike ? "#FDD9D9" : "#F4F4F4"
        }
        onClick={handleDislike}
        px={4}
        py={2}
        _hover={{
          backgroundColor: "#D2D1D1"
        }}
      >
        <NegativeFeedbackIcon width="24px" height="24px" />
      </Button>
    </Box>
  );
};

export const FeedbackTextarea = () => {
  const {
    feedback,
    setFeedback,
    showTextarea,
    handleSubmitFeedback,
    isSubmitting,
    boolFeedback
  } = useContext(FeedbackContext);
  return (
    showTextarea && (
      <Box mt={4}>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="(optional) Provide additional comments"
          size="sm"
          width="100%"
        />
        <Button
          colorScheme="blue"
          onClick={() => handleSubmitFeedback(boolFeedback, true)}
          mt={2}
          isDisabled={isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" /> : "Submit Feedback"}
        </Button>
      </Box>
    )
  );
};
