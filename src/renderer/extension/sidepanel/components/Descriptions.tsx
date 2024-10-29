import {
  Box,
  Button,
  Stack,
  Text,
  Textarea,
  Spinner,
  Image
} from "@chakra-ui/react";
import React, {
  type Dispatch,
  type SetStateAction,
  useState,
  useCallback,
  useEffect,
  useMemo
} from "react";
import { ImageIcon, VideoChatIcon, VoiceIcon } from "../../icons";

type DescriptionsPropsType = {
  generateResponse: () => Promise<void>;
  stopGeneration: () => void;
  setIsPictureInfo: (value: SetStateAction<boolean>) => void;
  setMediaDescriptions: Dispatch<SetStateAction<{}>>;
  mediaDescriptions: any;
  cancelGenerateResponse: () => void;
  refetchedPostMedia: any;
  getLastUserMessage: () => any;
  mediaPosts: any;
  isPictureInfo: boolean;
  children: React.ReactNode;
};

const Descriptions = (props: DescriptionsPropsType) => {
  const {
    generateResponse,
    stopGeneration,
    setIsPictureInfo,
    setMediaDescriptions,
    mediaDescriptions,
    cancelGenerateResponse,
    refetchedPostMedia,
    getLastUserMessage,
    mediaPosts,
    isPictureInfo,
    children
  } = props;

  const [buttonState, setButtonState] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loadButtonState, setLoadButtonState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  useEffect(() => {
    let isLoading = true;
    if (loadButtonState) {
      getLastUserMessage().then(({ messageHistory }) => {
        if (isLoading) {
          setButtonState((prevButtonState) => {
            const newButtonState = { ...prevButtonState };
            messageHistory.forEach((message) => {
              if (mediaPosts?.[message.id]?.description) {
                newButtonState[message.id] = true;
              }
            });
            return newButtonState;
          });
          setMessageHistory(messageHistory);
          setLoadButtonState(false);
        }
      });
    }
    return () => {
      isLoading = false;
    };
  }, [loadButtonState]);

  const updateMediaDescription = useCallback(
    (messageId, description) => {
      setMediaDescriptions((prevDescriptions) => ({
        ...prevDescriptions,
        [messageId]: { ...prevDescriptions[messageId], description }
      }));
    },
    [setMediaDescriptions]
  );

  const memoizedMessages = useMemo(() => {
    if (!isLoading) {
      if (messageHistory?.length > 0) {
        let descriptionCounter = 0;
        return messageHistory.map((message) => {
          const isMediaMessage =
            /<image|_image|<video|_video|<audio|_audio|<gif|_gif/;
          const mediaMessages =
            isMediaMessage.test(message.content) && message.role === "user";
          if (mediaMessages && descriptionCounter < 3) {
            descriptionCounter += 1;
            let hasDescription = !!mediaDescriptions?.[message.id]?.description;
            return (
              <Box
                key={message.id}
                display="flex"
                alignItems="center"
                gap="10px"
                width="100%"
              >
                {message?.attachments?.[0]?.type === "gif" && (
                  <ImageIcon width={8} />
                )}
                {message?.attachments?.[0]?.type === "image" && (
                  <Box
                    width={10}
                    overflow="hidden"
                    display="flex"
                    justifyContent="center"
                  >
                    {message.attachments?.[0]?.url ? (
                      <Image
                        height={10}
                        src={message.attachments?.[0].url}
                        alt=""
                        borderRadius={5}
                      />
                    ) : (
                      <ImageIcon width={8} />
                    )}
                  </Box>
                )}
                {message?.attachments?.[0]?.type === "audio" && (
                  <VoiceIcon width={8} />
                )}
                {message?.attachments?.[0]?.type === "video" && (
                  <Box
                    width={10}
                    overflow="hidden"
                    display="flex"
                    justifyContent="center"
                    position="relative"
                  >
                    {message.attachments?.[0]?.url ? (
                      <>
                        <Image
                          height={10}
                          src={message.attachments?.[0].url}
                          alt=""
                          borderRadius={5}
                        />
                        <Box
                          position="absolute"
                          top="80%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          bg="rgba(0, 0, 0, 0.5)"
                          borderRadius="full"
                        >
                          <VideoChatIcon width={5} color="white" />
                        </Box>
                      </>
                    ) : (
                      <VideoChatIcon width={8} />
                    )}
                  </Box>
                )}
                {/*{isLastInfluencerAudio && (*/}
                {/*  <Box as="span" textAlign="center" color="blue">*/}
                {/*    Your audio*/}
                {/*  </Box>*/}
                {/*)}*/}
                <Textarea
                  variant="unstyled"
                  borderRadius="16px"
                  p={2}
                  border="1px solid #E8E8E8"
                  backgroundColor="#FFFDFD"
                  fontSize="14px"
                  color="black"
                  style={{
                    resize: "none"
                  }}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    updateMediaDescription(message.id, newValue);
                  }}
                  rows={mediaDescriptions?.[message.id]?.description ? 1 : 3}
                  value={mediaDescriptions?.[message.id]?.description || ""}
                  placeholder={
                    message?.attachments?.[0]?.type === "audio"
                      ? "Enter the EXACT WORDS from the user's voice note"
                      : `usr sitting on the couch showing off his hard cock, usr is sitting on the couch jacking off showing his ginger pubes, selfie of usr looking cute in the camera wearing a red shirt in a night club`
                  }
                  isReadOnly={buttonState[message.id]}
                  disabled={buttonState[message.id]}
                  borderColor={
                    hasDescription
                      ? "gray"
                      : !buttonState[message.id]
                        ? "red"
                        : "gray"
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      setIsLoading(true);
                      await generateResponse();
                      setIsPictureInfo(false);
                      setIsLoading(false);
                      setTimeout(async () => {
                        const { data: fetchedPostMedia } =
                          await refetchedPostMedia();
                        if (fetchedPostMedia.success) {
                          const mediaDict = fetchedPostMedia.data.reduce(
                            (acc, item) => {
                              acc[item.external_id] = item;
                              return acc;
                            },
                            {}
                          );
                          setMediaDescriptions(mediaDict);
                        }
                      }, 1000);
                    }
                  }}
                />
                {buttonState[message.id] && (
                  <Button
                    variant="unstyled"
                    p={2}
                    borderRadius="10px"
                    border="2px solid #5449F6"
                    backgroundColor="#F1F6FE"
                    fontSize="16px"
                    fontWeight={500}
                    color="#5449F6"
                    display="flex"
                    alignItems="center"
                    size="sm"
                    _hover={{
                      backgroundColor: "#CFE0FC"
                    }}
                    onClick={() => {
                      setButtonState({
                        ...buttonState,
                        [message.id]: !buttonState[message.id]
                      });
                    }}
                    colorScheme={!buttonState[message.id] ? "telegram" : "gray"}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            );
          }
          return null;
        });
      }
    }
    return null;
  }, [messageHistory, buttonState, mediaDescriptions]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      gap="10px"
      borderColor="red"
      borderRadius="10px"
      p={4}
      backgroundColor={"white"}
    >
      <Text textAlign="center" fontSize="sm" fontWeight="500">
        Please enter descriptions of past media
      </Text>
      {memoizedMessages}
      <Stack direction="row" alignItems="center" gap="10px">
        {(!isLoading || isPictureInfo) && (
          <Button
            variant="unstyled"
            display="flex"
            p={2}
            borderRadius="10px"
            backgroundColor="#2F3341"
            color="white"
            _disabled={{
              backgroundColor: "#2F3341",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#2F3341"
            }}
            onClick={() => {
              stopGeneration();
              setIsPictureInfo(false);
              cancelGenerateResponse();
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="unstyled"
          p={2}
          borderRadius="10px"
          backgroundColor="#5433FF"
          display="flex"
          color="white"
          _hover={{
            backgroundColor: "#360FFF"
          }}
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            await generateResponse();
            setIsPictureInfo(false);
            setIsLoading(false);
            setTimeout(async () => {
              const { data: fetchedPostMedia } = await refetchedPostMedia();
              if (fetchedPostMedia.success) {
                const mediaDict = fetchedPostMedia.data.reduce((acc, item) => {
                  acc[item.external_id] = item;
                  return acc;
                }, {});
                setMediaDescriptions(mediaDict);
              }
            }, 1000);
          }}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" marginRight="8px" />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </Button>
        {children}
      </Stack>
    </Box>
  );
};

Descriptions.displayName = "Descriptions";

export default Descriptions;
